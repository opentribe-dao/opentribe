import { env } from '@/env';
import { authMiddlewareWrapper } from '@packages/auth/middleware';
import { internationalizationMiddleware } from '@packages/i18n/middleware';
import { parseError } from '@packages/logging/error';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@packages/security/middleware';
import {
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from 'next/server';

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets and Posthog ingest
  matcher: ['/((?!_next/static|_next/image|ingest|favicon.ico).*)'],
};

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

const middleware = authMiddlewareWrapper((auth, request) => {
  const i18nResponse = internationalizationMiddleware(
    request as unknown as NextRequest
  );
  if (i18nResponse) {
    return i18nResponse;
  }

  try {
    // Apply security headers
    securityHeaders();
    
    // Get the pathname
    const pathname = request.nextUrl.pathname;
    
    // Skip locale prefix if present
    const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    
    // Protected routes that require authentication
    const authRequiredRoutes = ['/dashboard', '/bounties/create', '/grants/apply', '/onboarding'];
    const requiresAuth = authRequiredRoutes.some(route => 
      pathnameWithoutLocale.startsWith(route) || pathname.startsWith(route)
    );
    
    // If route requires auth but user is not authenticated, redirect to home
    if (requiresAuth && !auth?.user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Protected routes that require profile completion
    const profileRequiredRoutes = ['/dashboard', '/bounties/create', '/grants/apply'];
    const requiresProfile = profileRequiredRoutes.some(route => 
      pathnameWithoutLocale.startsWith(route) || pathname.startsWith(route)
    );
    
    // Check if user is on a protected route that needs profile completion
    if (requiresProfile && auth?.user && !auth.user.profileCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    // If user is on onboarding but has already completed profile, redirect to home
    // (The actual dashboard redirect for org users happens after they create/join an org)
    if ((pathnameWithoutLocale.startsWith('/onboarding') || pathname.startsWith('/onboarding')) 
        && auth?.user?.profileCompleted) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    const message = parseError(error);

    return NextResponse.json({ error: message }, { status: 403 });
  }
}) as unknown as NextMiddleware;

export default middleware;