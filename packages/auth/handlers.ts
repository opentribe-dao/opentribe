import "server-only";

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "./server";

const { GET: baseGet, POST: basePost } = toNextJsHandler(auth);

const allowedOrigins = new Set([
  "https://opentribe.io",
  "https://api.opentribe.io",
  "https://dashboard.opentribe.io",

  "https://dev.opentribe.io",
  "https://api.dev.opentribe.io",
  "https://dashboard.dev.opentribe.io",

  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
]);

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.has(origin);
}

function buildCorsResponse(
  origin: string,
  status: number,
  body: BodyInit | null = null
) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": origin,
    },
  });
}

function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") ?? "";

    if (!isOriginAllowed(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }

    if (req.method === "OPTIONS") {
      return buildCorsResponse(origin, 204);
    }

    const res = await handler(req);

    const response = new Response(res.body, res);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    response.headers.set("Access-Control-Allow-Origin", origin);

    return response;
  };
}

export const GET = withCors(baseGet);
export const POST = withCors(basePost);
