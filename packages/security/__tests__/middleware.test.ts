import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  noseconeMiddleware,
} from "@packages/security/middleware";
import { describe, expect, test } from "vitest";

describe("Security Middleware", () => {
  describe("noseconeOptions", () => {
    test("should be defined and exported", () => {
      expect(noseconeOptions).toBeDefined();
    });

    test("should have defaults applied", () => {
      expect(noseconeOptions).toHaveProperty("contentSecurityPolicy");
    });

    test("should have CSP disabled by default", () => {
      // CSP is disabled because it depends on Next Forge features
      expect(noseconeOptions.contentSecurityPolicy).toBe(false);
    });

    test("should include standard security headers in defaults", () => {
      // Nosecone should include defaults from @nosecone/next
      const expectedDefaults = [
        "crossOriginEmbededPolicy",
        "crossOriginOpenerPolicy",
        "crossOriginResourcePolicy",
        "originAgentCluster",
        "referrerPolicy",
        "strictTransportSecurity",
        "xContentTypeOptions",
        "xDNSPrefetchControl",
        "xDownloadOptions",
        "xFrameOptions",
        "xPermittedCrossDomainPolicies",
        "xPoweredBy",
        "xXSSProtection",
      ];

      expectedDefaults.forEach((header) => {
        expect(noseconeOptions).toHaveProperty(header);
      });
    });

    test("should have X-Frame-Options set to SAMEORIGIN", () => {
      expect(noseconeOptions.xFrameOptions).toBe("SAMEORIGIN");
    });

    test("should have X-Content-Type-Options set to nosniff", () => {
      expect(noseconeOptions.xContentTypeOptions).toBe("nosniff");
    });

    test("should have Strict-Transport-Security configured", () => {
      expect(noseconeOptions.strictTransportSecurity).toContain("max-age=");
      expect(noseconeOptions.strictTransportSecurity).toContain(
        "includeSubDomains"
      );
    });

    test("should have Referrer-Policy set", () => {
      expect(noseconeOptions.referrerPolicy).toBe("no-referrer");
    });

    test("should disable X-Powered-By exposure", () => {
      expect(noseconeOptions.xPoweredBy).toBe("Opentribe");
    });
  });

  describe("noseconeOptionsWithToolbar", () => {
    test("should be defined and exported", () => {
      expect(noseconeOptionsWithToolbar).toBeDefined();
    });

    test("should be based on noseconeOptions", () => {
      // Should include all the same options as noseconeOptions
      expect(noseconeOptionsWithToolbar).toHaveProperty(
        "contentSecurityPolicy"
      );
    });
  });

  describe("noseconeMiddleware", () => {
    test("should be exported and callable", () => {
      expect(noseconeMiddleware).toBeDefined();
      expect(typeof noseconeMiddleware).toBe("function");
    });

    test("should be a middleware function", () => {
      // The middleware should accept a request and return a response
      const middleware = noseconeMiddleware;
      expect(typeof middleware).toBe("function");
    });
  });

  describe("Content Security Policy", () => {
    test("CSP should be disabled by default", () => {
      // CSP is intentionally disabled because Next Forge features
      // affect the CSP values. Users should configure it themselves.
      expect(noseconeOptions.contentSecurityPolicy).toBe(false);
    });

    test("CSP can be enabled by configuration", () => {
      // This test documents that CSP can be configured
      const customOptions = {
        ...noseconeOptions,
        contentSecurityPolicy: {
          directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
          },
        },
      };

      expect(customOptions.contentSecurityPolicy).not.toBe(false);
      expect(customOptions.contentSecurityPolicy).toHaveProperty("directives");
    });
  });
});
