import { vi } from "vitest";

// Mock server-only module - must be before any imports that use it
// server-only throws an error at module evaluation time, so we need to mock it completely
vi.mock("server-only", () => {
  // Return an empty object to prevent the error
  return {};
});

// Mock Next.js headers function
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

// Mock the database module globally
vi.mock("@packages/db", () => vi.importActual("@packages/db/__mocks__/index"));

// Mock the auth module
vi.mock("@packages/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock the email module
vi.mock("@packages/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendBountyFirstSubmissionEmail: vi.fn().mockResolvedValue(true),
  sendBountyWinnerEmail: vi.fn().mockResolvedValue(true),
  emailTemplates: {},
}));

// Mock polkadot/server module which imports server-only
vi.mock("@packages/polkadot/server", () => ({
  exchangeRateService: {
    getExchangeRates: vi.fn().mockResolvedValue({}),
  },
}));

// Ensure we're in test environment
process.env.NODE_ENV = "test";

// Set required environment variables for tests
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing-min-32-chars";
process.env.CRON_SECRET = "test-cron-secret-key-for-testing-min-32-chars";

// Set required analytics environment variables for tests
process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key_for_testing_purposes";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://app.posthog.com";

// Set required URL environment variables for tests
process.env.NEXT_PUBLIC_DASHBOARD_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_WEB_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3002";
process.env.NEXT_PUBLIC_DOCS_URL = "http://localhost:3003";

// Set required email environment variables for tests
process.env.RESEND_FROM = "test@example.com";
process.env.RESEND_TOKEN = "re_test_token_for_testing";
