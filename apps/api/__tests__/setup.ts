import { vi } from 'vitest';

// Mock Next.js headers function
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

// Mock the database module globally
vi.mock('@packages/db', () => {
  return vi.importActual('@packages/db/__mocks__/index');
});

// Mock the auth module
vi.mock('@packages/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock the email module
vi.mock('@packages/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  emailTemplates: {},
}));

// Ensure we're in test environment
process.env.NODE_ENV = 'test';