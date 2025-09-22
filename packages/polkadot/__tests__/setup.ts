import { vi, beforeEach } from 'vitest';

// Mock fetch globally for Subscan API tests
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});