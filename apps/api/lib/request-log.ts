type RequestLike = Pick<Request, "method" | "url" | "headers" | "clone">;

const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "authorization",
  "code",
  "email",
  "password",
  "refresh_token",
  "token",
]);

const SENSITIVE_BODY_KEYS = new Set([
  "accessToken",
  "access_token",
  "authorization",
  "code",
  "email",
  "newPassword",
  "password",
  "refreshToken",
  "refresh_token",
  "token",
]);

const MAX_LOG_BODY_BYTES = 1024 * 64;

export const isAuthApiRoute = (pathname: string) =>
  pathname.startsWith("/api/auth/");

const redactHeaderValue = (name: string, value: string | null) => {
  if (!value) return value;

  const lowered = name.toLowerCase();
  if (
    lowered === "authorization" ||
    lowered === "cookie" ||
    lowered === "set-cookie"
  ) {
    return "[redacted]";
  }

  return value;
};

const redactValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (!(value && typeof value === "object")) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_BODY_KEYS.has(key) ? "[redacted]" : redactValue(entry),
    ])
  );
};

export const buildRequestLogMeta = async (request: RequestLike) => {
  const url = new URL(request.url);
  const authRoute = isAuthApiRoute(url.pathname);

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = redactHeaderValue(key, value) ?? "";
  });

  const query: Record<string, string | string[]> = {};
  if (!authRoute) {
    url.searchParams.forEach((value, key) => {
      const safeValue = SENSITIVE_QUERY_KEYS.has(key) ? "[redacted]" : value;
      if (key in query) {
        const existing = query[key];
        query[key] = Array.isArray(existing)
          ? [...existing, safeValue]
          : [existing, safeValue];
      } else {
        query[key] = safeValue;
      }
    });
  }

  const contentType = request.headers.get("content-type") || "";
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  let body: unknown;
  if (
    !authRoute &&
    ["POST", "PUT", "PATCH"].includes(request.method.toUpperCase()) &&
    contentType.includes("application/json") &&
    (Number.isFinite(contentLength) ? contentLength <= MAX_LOG_BODY_BYTES : true)
  ) {
    try {
      const text = await request.clone().text();
      if (text && text.length <= MAX_LOG_BODY_BYTES) {
        try {
          body = redactValue(JSON.parse(text));
        } catch {
          body = text;
        }
      }
    } catch {
      body = undefined;
    }
  }

  return {
    authRoute,
    contentLength,
    headers,
    pathname: url.pathname,
    query: authRoute ? undefined : query,
    search: authRoute ? "" : url.search,
    url: authRoute ? `${url.origin}${url.pathname}` : url.toString(),
    body,
  };
};
