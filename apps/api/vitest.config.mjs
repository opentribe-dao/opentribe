import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    env: {
      // Set test environment variables directly
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-key-for-testing",
      BETTER_AUTH_URL: "http://localhost:3002",
      RESEND_FROM: "test@example.com",
      RESEND_TOKEN: "test-token",
      BLOB_READ_WRITE_TOKEN: "test-blob-token",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./"),
      "@packages": path.resolve(process.cwd(), "../../packages"),
    },
  },
});
