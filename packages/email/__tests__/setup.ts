import { vi } from "vitest";

// Mock Resend client
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "test-email-id" },
        error: null,
      }),
    },
    audiences: {
      contacts: {
        create: vi.fn().mockResolvedValue({
          data: { id: "test-contact-id" },
          error: null,
        }),
      },
    },
  })),
}));

// Mock the keys module
vi.mock("./keys", () => ({
  keys: vi.fn(() => ({
    RESEND_TOKEN: "re_test123456789",
    RESEND_FROM: "test@example.com",
    RESEND_GENERAL_AUDIENCE_ID: "fca6d77f-e6ed-4d07-88c5-0ea4e774705a",
  })),
}));

// Set test environment
process.env.NODE_ENV = "test";
process.env.RESEND_TOKEN = "re_test123456789";
process.env.RESEND_FROM = "test@example.com";
process.env.NEXT_PUBLIC_WEB_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_DASHBOARD_URL = "http://localhost:3001";
