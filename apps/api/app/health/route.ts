import { database } from "@packages/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const startTime = Date.now();

export const GET = (req: Request) => {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  if (format === "plain") {
    return new Response("OK", {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const compute = async () => {
    const timestamp = new Date().toISOString();
    const envAny = (process as any)?.env ?? {};
    const git = {
      commitSha:
        envAny.VERCEL_GIT_COMMIT_SHA || envAny.NEXT_PUBLIC_GIT_SHA || null,
      commitRef: envAny.VERCEL_GIT_COMMIT_REF || null,
      commitMessage: envAny.VERCEL_GIT_COMMIT_MESSAGE || null,
      repoOwner: envAny.VERCEL_GIT_REPO_OWNER || null,
      repoSlug: envAny.VERCEL_GIT_REPO_SLUG || null,
      deploymentUrl: envAny.VERCEL_URL ? `https://${envAny.VERCEL_URL}` : null,
      vercelEnv: envAny.VERCEL_ENV || null,
      buildId: envAny.NEXT_BUILD_ID || null,
    } as const;
    let dbOk = false;
    let dbLatencyMs: number | null = null;
    try {
      const startedAt = Date.now();
      // Lightweight DB ping
      await database.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startedAt;
      dbOk = true;
    } catch (error) {
      dbOk = false;
    }

    const body = {
      data: {
        status: dbOk ? "ok" : "degraded",
        timestamp,
        uptime: (Date.now() - startTime) / 1000 / 60 / 60 + " hrs",
        runtime: "nodejs",
        region: (process as any)?.env?.VERCEL_REGION ?? "local",
        git,
        checks: {
          database: dbOk ? "ok" : "fail",
          databaseLatencyMs: dbLatencyMs,
        },
      },
    } as const;

    return NextResponse.json(body, {
      status: dbOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Api-Version": "v1",
        ...(git.commitSha ? { "X-Commit-Sha": git.commitSha } : {}),
      },
    });
  };

  return compute();
};

export const HEAD = () =>
  new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

export const OPTIONS = () =>
  new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
