import { vi } from "vitest";

// Mock @nosecone/next module
vi.mock("@nosecone/next", () => ({
  defaults: {
    contentSecurityPolicy: false,
    crossOriginEmbededPolicy: "same-origin",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "same-origin",
    originAgentCluster: "?1",
    referrerPolicy: "no-referrer",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    xContentTypeOptions: "nosniff",
    xDNSPrefetchControl: "off",
    xDownloadOptions: "noopen",
    xFrameOptions: "SAMEORIGIN",
    xPermittedCrossDomainPolicies: "none",
    xPoweredBy: "Opentribe",
    xXSSProtection: "0",
  },
  createMiddleware: vi.fn((_options) => {
    return (_request) => {
      // Return a mock response with security headers
      return new Response("OK", {
        status: 200,
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    };
  }),
  withVercelToolbar: vi.fn((options) => options),
}));

// Ensure we're in test environment
process.env.NODE_ENV = "test";
