import { authMiddleware } from "@packages/auth/middleware";
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from "@packages/security/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "./env";

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

export default async function middleware(request: NextRequest) {
  try {
    securityHeaders();
    const authResponse = await authMiddleware(request);
    console.log("[Dashboard] Auth response:", authResponse);
    if (!authResponse) {
      const loginUrl = new URL("/sign-in", env.NEXT_PUBLIC_WEB_URL);
      // Preserve return path back to dashboard after login
      loginUrl.searchParams.set("redirect", request.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error("Error in dashboard middleware", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
