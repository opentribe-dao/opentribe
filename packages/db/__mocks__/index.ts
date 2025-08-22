import { PrismaClient } from '../generated/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { vi } from 'vitest';

// Create a deep mock of PrismaClient
export const database: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// Export everything from the real client for types
export * from '../generated/client';

// Reset mocks before each test
beforeEach(() => {
  mockReset(database);
});
