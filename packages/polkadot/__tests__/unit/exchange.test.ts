import { redis } from "@packages/security";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExchangeRateService } from "../../src/exchange";

// Mock the keys module
vi.mock("../../keys", () => ({
  keys: () => ({
    COINMARKETCAP_API_KEY: "test-api-key",
    COINMARKETCAP_API_URL: "https://pro-api.coinmarketcap.com",
  }),
}));

// Mock the Redis cache
vi.mock("@packages/security", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    ttl: vi.fn(),
  },
}));

describe("ExchangeRateService", () => {
  let service: ExchangeRateService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up Redis mock defaults
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockResolvedValue("OK");
    vi.mocked(redis.del).mockResolvedValue(1);
    vi.mocked(redis.keys).mockResolvedValue([]);
    vi.mocked(redis.ttl).mockResolvedValue(-1);

    service = new ExchangeRateService();
    await service.clearCache();
  });

  describe("getExchangeRates", () => {
    it("should fetch exchange rates for multiple tokens", async () => {
      const mockResponse = {
        status: {
          timestamp: "2025-10-19T22:06:36.373Z",
          error_code: 0,
          error_message: null,
          elapsed: 73,
          credit_count: 1,
          notice: null,
        },
        data: {
          DOT: {
            id: 6636,
            name: "Polkadot",
            symbol: "DOT",
            slug: "polkadot-new",
            num_market_pairs: 978,
            date_added: "2020-08-19T00:00:00.000Z",
            tags: [],
            max_supply: null,
            circulating_supply: 1_628_662_950.317_541,
            total_supply: 1_628_662_950.317_541,
            is_active: 1,
            infinite_supply: true,
            platform: null,
            cmc_rank: 27,
            is_fiat: 0,
            self_reported_circulating_supply: null,
            self_reported_market_cap: null,
            tvl_ratio: null,
            last_updated: "2025-10-19T22:06:00.000Z",
            quote: {
              USDC: {
                price: 3.026_780_285_518_709,
                volume_24h: 202_480_043.346_595_76,
                volume_change_24h: 31.939,
                percent_change_1h: -0.195_481_29,
                percent_change_24h: 2.974_015_77,
                percent_change_7d: -6.780_444_59,
                percent_change_30d: -31.373_694_02,
                percent_change_60d: -22.280_702_33,
                percent_change_90d: -32.574_740_6,
                market_cap: 4_929_604_909.775_87,
                market_cap_dominance: 0.1336,
                fully_diluted_market_cap: 4_929_604_909.775_712,
                tvl: null,
                last_updated: "2025-10-19T22:05:00.000Z",
              },
            },
          },
          KSM: {
            id: 5034,
            name: "Kusama",
            symbol: "KSM",
            slug: "kusama",
            num_market_pairs: 284,
            date_added: "2019-12-12T00:00:00.000Z",
            tags: [],
            max_supply: null,
            circulating_supply: 17_147_795.800_493_05,
            total_supply: 17_147_795.800_493_05,
            is_active: 1,
            infinite_supply: true,
            platform: null,
            cmc_rank: 190,
            is_fiat: 0,
            self_reported_circulating_supply: 24_283.68,
            self_reported_market_cap: 267_620.932_442_554_04,
            tvl_ratio: null,
            last_updated: "2025-10-19T22:06:00.000Z",
            quote: {
              USDC: {
                price: 11.020_307_530_527_54,
                volume_24h: 11_094_675.614_328_552,
                volume_change_24h: 7.5248,
                percent_change_1h: -0.386_336_74,
                percent_change_24h: 4.515_202_98,
                percent_change_7d: -5.684_407_29,
                percent_change_30d: -30.170_274_85,
                percent_change_60d: -25.038_214_39,
                percent_change_90d: -35.902_956_59,
                market_cap: 188_973_983.192_122_1,
                market_cap_dominance: 0.0051,
                fully_diluted_market_cap: 188_973_983.196_990_4,
                tvl: null,
                last_updated: "2025-10-19T22:05:00.000Z",
              },
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const rates = await service.getExchangeRates(["DOT", "KSM"]);

      expect(rates).toEqual({
        DOT: 3.026_780_285_518_709,
        KSM: 11.020_307_530_527_54,
      });

      // Verify Redis caching was called
      expect(redis.set).toHaveBeenCalledWith(
        "exchange:rates:DOT",
        3.026_780_285_518_709,
        { ex: 1800 }
      );
      expect(redis.set).toHaveBeenCalledWith(
        "exchange:rates:KSM",
        11.020_307_530_527_54,
        { ex: 1800 }
      );
    });

    it("should return cached rates on subsequent calls", async () => {
      // Mock Redis to return cached value for DOT
      vi.mocked(redis.get).mockImplementation((key) => {
        if (key === "exchange:rates:DOT") {
          return Promise.resolve(3.026_780_285_518_709);
        }
        return Promise.resolve(null);
      });
      const mockResponse = {
        status: {
          timestamp: "2025-10-19T22:06:36.373Z",
          error_code: 0,
          error_message: null,
          elapsed: 73,
          credit_count: 1,
          notice: null,
        },
        data: {
          DOT: {
            id: 6636,
            name: "Polkadot",
            symbol: "DOT",
            slug: "polkadot-new",
            num_market_pairs: 978,
            date_added: "2020-08-19T00:00:00.000Z",
            tags: [],
            max_supply: null,
            circulating_supply: 1_628_662_950.317_541,
            total_supply: 1_628_662_950.317_541,
            is_active: 1,
            infinite_supply: true,
            platform: null,
            cmc_rank: 27,
            is_fiat: 0,
            self_reported_circulating_supply: null,
            self_reported_market_cap: null,
            tvl_ratio: null,
            last_updated: "2025-10-19T22:06:00.000Z",
            quote: {
              USDC: {
                price: 3.026_780_285_518_709,
                volume_24h: 202_480_043.346_595_76,
                volume_change_24h: 31.939,
                percent_change_1h: -0.195_481_29,
                percent_change_24h: 2.974_015_77,
                percent_change_7d: -6.780_444_59,
                percent_change_30d: -31.373_694_02,
                percent_change_60d: -22.280_702_33,
                percent_change_90d: -32.574_740_6,
                market_cap: 4_929_604_909.775_87,
                market_cap_dominance: 0.1336,
                fully_diluted_market_cap: 4_929_604_909.775_712,
                tvl: null,
                last_updated: "2025-10-19T22:05:00.000Z",
              },
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First call should check cache (miss) and fetch from API
      const rates1 = await service.getExchangeRates(["DOT"]);
      expect(rates1).toEqual({ DOT: 3.026_780_285_518_709 });
      expect(redis.get).toHaveBeenCalledWith("exchange:rates:DOT");

      // Second call should use cached value
      const rates2 = await service.getExchangeRates(["DOT"]);
      expect(rates2).toEqual({ DOT: 3.026_780_285_518_709 });
      // Should not call fetch since we have cached value
      expect(fetch).toHaveBeenCalledTimes(0);
    });
  });

  describe("getExchangeRate", () => {
    it("should fetch exchange rate for a single token", async () => {
      const mockResponse = {
        status: {
          timestamp: "2025-10-19T22:06:36.373Z",
          error_code: 0,
          error_message: null,
          elapsed: 73,
          credit_count: 1,
          notice: null,
        },
        data: {
          DOT: {
            id: 6636,
            name: "Polkadot",
            symbol: "DOT",
            slug: "polkadot-new",
            num_market_pairs: 978,
            date_added: "2020-08-19T00:00:00.000Z",
            tags: [],
            max_supply: null,
            circulating_supply: 1_628_662_950.317_541,
            total_supply: 1_628_662_950.317_541,
            is_active: 1,
            infinite_supply: true,
            platform: null,
            cmc_rank: 27,
            is_fiat: 0,
            self_reported_circulating_supply: null,
            self_reported_market_cap: null,
            tvl_ratio: null,
            last_updated: "2025-10-19T22:06:00.000Z",
            quote: {
              USDC: {
                price: 3.026_780_285_518_709,
                volume_24h: 202_480_043.346_595_76,
                volume_change_24h: 31.939,
                percent_change_1h: -0.195_481_29,
                percent_change_24h: 2.974_015_77,
                percent_change_7d: -6.780_444_59,
                percent_change_30d: -31.373_694_02,
                percent_change_60d: -22.280_702_33,
                percent_change_90d: -32.574_740_6,
                market_cap: 4_929_604_909.775_87,
                market_cap_dominance: 0.1336,
                fully_diluted_market_cap: 4_929_604_909.775_712,
                tvl: null,
                last_updated: "2025-10-19T22:05:00.000Z",
              },
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const rate = await service.getExchangeRate("DOT");

      expect(rate).toBe(3.026_780_285_518_709);
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", async () => {
      // Mock Redis to return some keys
      vi.mocked(redis.keys).mockResolvedValue([
        "exchange:rates:DOT",
        "exchange:rates:KSM",
      ]);
      const mockResponse = {
        status: {
          timestamp: "2025-10-19T22:06:36.373Z",
          error_code: 0,
          error_message: null,
          elapsed: 73,
          credit_count: 1,
          notice: null,
        },
        data: {
          DOT: {
            id: 6636,
            name: "Polkadot",
            symbol: "DOT",
            slug: "polkadot-new",
            num_market_pairs: 978,
            date_added: "2020-08-19T00:00:00.000Z",
            tags: [],
            max_supply: null,
            circulating_supply: 1_628_662_950.317_541,
            total_supply: 1_628_662_950.317_541,
            is_active: 1,
            infinite_supply: true,
            platform: null,
            cmc_rank: 27,
            is_fiat: 0,
            self_reported_circulating_supply: null,
            self_reported_market_cap: null,
            tvl_ratio: null,
            last_updated: "2025-10-19T22:06:00.000Z",
            quote: {
              USDC: {
                price: 3.026_780_285_518_709,
                volume_24h: 202_480_043.346_595_76,
                volume_change_24h: 31.939,
                percent_change_1h: -0.195_481_29,
                percent_change_24h: 2.974_015_77,
                percent_change_7d: -6.780_444_59,
                percent_change_30d: -31.373_694_02,
                percent_change_60d: -22.280_702_33,
                percent_change_90d: -32.574_740_6,
                market_cap: 4_929_604_909.775_87,
                market_cap_dominance: 0.1336,
                fully_diluted_market_cap: 4_929_604_909.775_712,
                tvl: null,
                last_updated: "2025-10-19T22:05:00.000Z",
              },
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Clear cache
      await service.clearCache();

      // Verify Redis operations
      expect(redis.keys).toHaveBeenCalledWith("exchange:rates:*");
      expect(redis.del).toHaveBeenCalledWith(
        "exchange:rates:DOT",
        "exchange:rates:KSM"
      );
    });
  });
});
