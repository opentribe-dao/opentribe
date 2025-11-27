import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export interface OrganizationAuth {
  userId: string;
  organizationId: string;
  membership: {
    id: string;
    role: "owner" | "admin" | "member";
    userId: string;
    organizationId: string;
  };
}

type SessionData = {
  user: {
    id: string;
  };
} | null;

/**
 * Get organization authentication data.
 * Middleware already validated auth/membership, so this just retrieves the data.
 * This function performs the check to get userId and membership details.
 * 
 * @param request - NextRequest object (required for backward compatibility)
 * @param organizationId - Organization ID to check membership for
 * @param options - Optional parameters to avoid duplicate auth lookups
 * @param options.userId - Pre-fetched user ID (avoids session lookup)
 * @param options.session - Pre-fetched session data (avoids session lookup)
 * @returns OrganizationAuth object or null if not authenticated/authorized
 */
export async function getOrganizationAuth(
  request: NextRequest,
  organizationId: string,
  options?: {
    userId?: string;
    session?: SessionData;
  }
): Promise<OrganizationAuth | null> {
  let userId: string | undefined;

  // Use provided userId or session, otherwise fetch session
  if (options?.userId) {
    userId = options.userId;
  } else if (options?.session?.user) {
    userId = options.session.user.id;
  } else {
    // Get session if not provided
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    userId = session.user.id;
  }

  if (!userId) {
    return null;
  }

  // Get membership (middleware already validated it exists)
  const membership = await database.member.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId,
    organizationId,
    membership: {
      id: membership.id,
      role: membership.role as "owner" | "admin" | "member",
      userId,
      organizationId,
    },
  };
}

/**
 * Check if user has required role(s) for the organization
 */
export function hasRequiredRole(
  membership: OrganizationAuth["membership"],
  requiredRoles: Array<"owner" | "admin" | "member">
): boolean {
  return requiredRoles.includes(membership.role);
}

