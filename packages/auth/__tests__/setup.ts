import { vi } from "vitest";

// Mock server-only module - must be before any imports that use it
vi.mock("server-only", () => {
  return {};
});

// Mock database module globally
vi.mock("@packages/db", () => vi.importActual("@packages/db/__mocks__/index"));

// Mock email module to prevent actual email sending
vi.mock("@packages/email", () => ({
  sendVerificationEmail: vi
    .fn()
    .mockResolvedValue({ data: { id: "test-id" }, error: null }),
  sendWelcomeEmail: vi
    .fn()
    .mockResolvedValue({ data: { id: "test-id" }, error: null }),
  sendPasswordResetEmail: vi
    .fn()
    .mockResolvedValue({ data: { id: "test-id" }, error: null }),
  sendOrgInviteEmail: vi
    .fn()
    .mockResolvedValue({ data: { id: "test-id" }, error: null }),
  createContact: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock better-auth/next-js module
vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn(() => ({
    name: "next-cookies",
  })),
  toNextJsHandler: vi.fn(() => ({
    GET: vi.fn(),
    POST: vi.fn(),
  })),
}));

// Mock better-auth/adapters/prisma
vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => ({
    name: "prisma-adapter",
  })),
}));

// Ensure we're in test environment
process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing-minimum-length";
process.env.BETTER_AUTH_URL = "http://localhost:3002";
process.env.NEXT_PUBLIC_WEB_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_DASHBOARD_URL = "http://localhost:3001";
process.env.RESEND_FROM = "test@example.com";
process.env.RESEND_TOKEN = "re_test123456789";
