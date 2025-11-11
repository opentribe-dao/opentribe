import { beforeEach } from "vitest";
import { type DeepMockProxy, mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/client";

// Create a deep mock of PrismaClient
export const database: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// Export everything from the real client for types
export * from "../generated/client";

// Reset mocks before each test
beforeEach(() => {
  mockReset(database);
});
