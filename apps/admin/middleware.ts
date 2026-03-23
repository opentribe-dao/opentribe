import { authMiddleware } from "@packages/auth/middleware";
import {
  noseconeMiddleware,
  noseconeOptions,
} from "@packages/security/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "./env";

const securityHeaders = noseconeMiddleware(noseconeOptions);

export default async function middleware(request: NextRequest) {
  try {
    securityHeaders();
    const authResponse = await authMiddleware(request);

    if (!authResponse) {
      const loginUrl = new URL("/sign-in", env.NEXT_PUBLIC_WEB_URL);
      loginUrl.searchParams.set("redirect", request.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the user has superadmin role
    if (authResponse.user?.role !== "superadmin") {
      // Redirect non-superadmin users to the main web app
      return NextResponse.redirect(
        new URL("/", env.NEXT_PUBLIC_WEB_URL)
      );
    }
  } catch (error) {
    console.error("Error in admin middleware", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
