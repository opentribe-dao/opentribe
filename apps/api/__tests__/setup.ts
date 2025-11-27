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
