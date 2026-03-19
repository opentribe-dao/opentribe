import { describe, expect, test } from "vitest";
import { buildRequestLogMeta } from "../lib/request-log";

describe("buildRequestLogMeta", () => {
  test("omits auth query params and body logging on auth routes", async () => {
    const request = new Request(
      "http://localhost:3002/api/auth/reset-password?token=secret&email=user@example.com",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
          password: "hunter2",
          token: "secret",
        }),
      }
    );

    const meta = await buildRequestLogMeta(request);

    expect(meta.url).toBe("http://localhost:3002/api/auth/reset-password");
    expect(meta.search).toBe("");
    expect(meta.query).toBeUndefined();
    expect(meta.body).toBeUndefined();
  });

  test("redacts sensitive headers and query/body values on non-auth routes", async () => {
    const request = new Request(
      "http://localhost:3002/api/v1/test?token=secret&status=open",
      {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          cookie: "session=abc",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          password: "hunter2",
          nested: {
            token: "secret",
          },
          status: "open",
        }),
      }
    );

    const meta = await buildRequestLogMeta(request);

    expect(meta.headers.authorization).toBe("[redacted]");
    expect(meta.headers.cookie).toBe("[redacted]");
    expect(meta.query).toEqual({
      token: "[redacted]",
      status: "open",
    });
    expect(meta.body).toEqual({
      password: "[redacted]",
      nested: {
        token: "[redacted]",
      },
      status: "open",
    });
  });
});
