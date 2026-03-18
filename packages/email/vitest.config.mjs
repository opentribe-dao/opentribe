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
      RESEND_TOKEN: "re_test123456789",
      RESEND_FROM: "test@example.com",
      RESEND_GENERAL_AUDIENCE_ID: "fca6d77f-e6ed-4d07-88c5-0ea4e774705a",
      NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
      NEXT_PUBLIC_DASHBOARD_URL: "http://localhost:3001",
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
