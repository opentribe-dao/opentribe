import { vi } from "vitest";

// Mock neon serverless
vi.mock("@neondatabase/serverless", () => ({
  neonConfig: {
    webSocketConstructor: vi.fn(),
  },
}));

// Mock Prisma adapter
vi.mock("@prisma/adapter-neon", () => ({
  PrismaNeon: vi.fn().mockImplementation(() => ({
    name: "prisma-neon-adapter",
  })),
}));

// Mock ws module
vi.mock("ws", () => ({
  default: vi.fn(),
}));

// Set test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
