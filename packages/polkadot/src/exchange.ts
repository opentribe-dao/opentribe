import { redis } from "@packages/security";
import { keys } from "../keys";

// Exchange rate interfaces (data comes from CoinMarketCap API)
export interface ExchangeRateQuote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  percent_change_60d: number;
  percent_change_90d: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  tvl: number | null;
  last_updated: string;
}

export interface ExchangeTokenData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number | null;
  circulating_supply: number;
  total_supply: number;
  is_active: number;
  infinite_supply: boolean;
  platform: unknown;
  cmc_rank: number;
  is_fiat: number;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  tvl_ratio: number | null;
  last_updated: string;
  quote: {
    USDC: ExchangeRateQuote;
  };
}

export interface ExchangeApiResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: Record<string, ExchangeTokenData>;
}

const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes in seconds
const CACHE_KEY_PREFIX = "exchange:rates";

export class ExchangeRateService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    const env = keys();
    // Using CoinMarketCap API for exchange rate data
    this.apiKey = env.COINMARKETCAP_API_KEY;
    this.apiUrl = env.COINMARKETCAP_API_URL;
  }

  /**
   * Get exchange rates for multiple tokens, with Redis caching
   */
  async getExchangeRates(tokens: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    const tokensToFetch: string[] = [];

    // Check Redis cache first
    for (const token of tokens) {
      const cacheKey = `${CACHE_KEY_PREFIX}:${token.toUpperCase()}`;
      try {
        const cached = await redis.get<number>(cacheKey);
        if (cached !== null) {
          result[token.toUpperCase()] = cached;
        } else {
          tokensToFetch.push(token.toUpperCase());
        }
      } catch (error) {
        console.error(`Failed to check cache for token ${token}:`, error);
        tokensToFetch.push(token.toUpperCase());
      }
    }

    // Fetch missing tokens from API
    if (tokensToFetch.length > 0) {
      try {
        const rates = await this.fetchExchangeRates(tokensToFetch);

        // Cache the results in Redis
        for (const [token, rate] of Object.entries(rates)) {
          const cacheKey = `${CACHE_KEY_PREFIX}:${token}`;
          try {
            await redis.set(cacheKey, rate, { ex: CACHE_TTL_SECONDS });
            result[token] = rate;
          } catch (error) {
            console.error(`Failed to cache rate for token ${token}:`, error);
            result[token] = rate; // Still return the rate even if caching fails
          }
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        throw error;
      }
    }

    return result;
  }

  /**
   * Get exchange rate for a single token
   */
  async getExchangeRate(token: string): Promise<number> {
    const rates = await this.getExchangeRates([token]);
    return rates[token.toUpperCase()] || 0;
  }

  /**
   * Fetch exchange rates from CoinMarketCap API
   */
  private async fetchExchangeRates(
    tokens: string[]
  ): Promise<Record<string, number>> {
    if (tokens.length === 0) {
      return {};
    }

    const symbols = tokens.join("%2C"); // URL encode comma
    const url = `${this.apiUrl}/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USDC`;

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `CoinMarketCap API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as ExchangeApiResponse;

    if (data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
    }

    const rates: Record<string, number> = {};
    for (const [symbol, tokenData] of Object.entries(data.data)) {
      rates[symbol.toUpperCase()] = tokenData.quote.USDC.price;
    }

    return rates;
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  async clearCache(): Promise<void> {
    try {
      // Get all cache keys with our prefix
      const pattern = `${CACHE_KEY_PREFIX}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  }

  /**
   * Get cache status for debugging
   */
  async getCacheStatus(): Promise<
    Record<string, { rate: number; ttl: number }>
  > {
    const status: Record<string, { rate: number; ttl: number }> = {};

    try {
      // Get all cache keys with our prefix
      const pattern = `${CACHE_KEY_PREFIX}:*`;
      const keys = await redis.keys(pattern);

      for (const key of keys) {
        const token = key.replace(`${CACHE_KEY_PREFIX}:`, "");
        const rate = await redis.get<number>(key);
        const ttl = await redis.ttl(key);

        if (rate !== null) {
          status[token] = {
            rate,
            ttl,
          };
        }
      }
    } catch (error) {
      console.error("Failed to get cache status:", error);
    }

    return status;
  }
}

// Export a singleton instance
export const exchangeRateService = new ExchangeRateService();
