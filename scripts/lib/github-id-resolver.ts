/**
 * Resolves GitHub usernames to stable account IDs via the GitHub API.
 *
 * GitHub account IDs are numeric and never change (unlike usernames).
 * We store them as strings to match Better Auth's Account.accountId format.
 *
 * Rate limits:
 * - Unauthenticated: 60 requests/hour
 * - With token: 5,000 requests/hour
 *
 * For ~1,500 lookups (600 apps x 2.5 members), a token completes in one run.
 */

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
}

interface ResolvedGitHubId {
  accountId: string; // Numeric ID as string
  login: string; // Current username (may differ from input if renamed)
  name: string | null;
  avatarUrl: string;
}

interface ResolverOptions {
  token?: string;
  /** Delay between requests in ms (default: 100) */
  delayMs?: number;
  logger?: {
    log: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export class GitHubIdResolver {
  private cache = new Map<string, ResolvedGitHubId | null>();
  private token: string | undefined;
  private delayMs: number;
  private requestCount = 0;
  private logger: ResolverOptions["logger"];

  constructor(options: ResolverOptions = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.delayMs = options.delayMs ?? 100;
    this.logger = options.logger ?? {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
  }

  /**
   * Resolve a GitHub username to its stable account ID.
   * Returns null if the user doesn't exist or API fails.
   */
  async resolve(username: string): Promise<ResolvedGitHubId | null> {
    const normalized = username.toLowerCase().replace(/^@/, "");

    // Check cache
    if (this.cache.has(normalized)) {
      return this.cache.get(normalized) ?? null;
    }

    try {
      // Rate limit delay
      if (this.requestCount > 0) {
        await sleep(this.delayMs);
      }

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "opentribe-import",
      };
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(normalized)}`,
        { headers }
      );
      this.requestCount++;

      if (response.status === 404) {
        this.logger.warn(
          `GitHub user not found: ${normalized}`
        );
        this.cache.set(normalized, null);
        return null;
      }

      if (response.status === 403 || response.status === 429) {
        const resetHeader = response.headers.get("x-ratelimit-reset");
        const resetTime = resetHeader
          ? new Date(parseInt(resetHeader) * 1000).toISOString()
          : "unknown";
        this.logger.error(
          `GitHub API rate limited. Resets at ${resetTime}. Requests made: ${this.requestCount}`
        );
        throw new Error(`GitHub API rate limited. Resets at ${resetTime}`);
      }

      if (!response.ok) {
        this.logger.warn(
          `GitHub API error for ${normalized}: ${response.status}`
        );
        this.cache.set(normalized, null);
        return null;
      }

      const user: GitHubUser = await response.json();
      const resolved: ResolvedGitHubId = {
        accountId: String(user.id),
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
      };

      this.cache.set(normalized, resolved);

      // Also cache by current login if different from input
      if (user.login.toLowerCase() !== normalized) {
        this.cache.set(user.login.toLowerCase(), resolved);
        this.logger.log(
          `GitHub username changed: ${normalized} → ${user.login}`
        );
      }

      return resolved;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("rate limited")
      ) {
        throw error; // Re-throw rate limit errors
      }
      this.logger.error(
        `Failed to resolve GitHub user ${normalized}: ${error}`
      );
      this.cache.set(normalized, null);
      return null;
    }
  }

  /**
   * Resolve multiple usernames with progress tracking.
   */
  async resolveMany(
    usernames: string[]
  ): Promise<Map<string, ResolvedGitHubId | null>> {
    const unique = [...new Set(usernames.map((u) => u.toLowerCase().replace(/^@/, "")))];
    const results = new Map<string, ResolvedGitHubId | null>();

    this.logger.log(
      `Resolving ${unique.length} GitHub usernames (${this.token ? "authenticated" : "unauthenticated"})...`
    );

    for (let i = 0; i < unique.length; i++) {
      const username = unique[i];
      const result = await this.resolve(username);
      results.set(username, result);

      // Progress logging every 50
      if ((i + 1) % 50 === 0) {
        this.logger.log(
          `  Progress: ${i + 1}/${unique.length} (${this.requestCount} API calls)`
        );
      }
    }

    this.logger.log(
      `Resolved ${unique.length} usernames in ${this.requestCount} API calls`
    );

    return results;
  }

  get stats() {
    return {
      cacheSize: this.cache.size,
      requestCount: this.requestCount,
      resolved: [...this.cache.values()].filter((v) => v !== null).length,
      failed: [...this.cache.values()].filter((v) => v === null).length,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
