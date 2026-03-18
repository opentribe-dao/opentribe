import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-key-for-testing-minimum-length",
      BETTER_AUTH_URL: "http://localhost:3002",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret",
      RESEND_FROM: "test@example.com",
      RESEND_TOKEN: "re_test123456789",
      RESEND_GENERAL_AUDIENCE_ID: "fca6d77f-e6ed-4d07-88c5-0ea4e774705a",
      NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
      NEXT_PUBLIC_DASHBOARD_URL: "http://localhost:3001",
      NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3002",
    },
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@packages": path.resolve(__dirname, "../../packages"),
    },
  },
});
