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

/**
 * Get organization authentication data.
 * Middleware already validated auth/membership, so this just retrieves the data.
 * This function performs the check to get userId and membership details.
 */
export async function getOrganizationAuth(
  request: NextRequest,
  organizationId: string
): Promise<OrganizationAuth | null> {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  // Get membership (middleware already validated it exists)
  const membership = await database.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId: session.user.id,
    organizationId,
    membership: {
      id: membership.id,
      role: membership.role as "owner" | "admin" | "member",
      userId: session.user.id,
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

