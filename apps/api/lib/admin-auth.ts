import { auth } from "@packages/auth/server";
import { headers } from "next/headers";

export interface AdminSession {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Verify that the current user is a superadmin.
 * Returns the admin session or null if unauthorized.
 */
export async function requireSuperAdmin(): Promise<AdminSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  if (session.user.role !== "superadmin") {
    return null;
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

/**
 * Standard unauthorized response for admin routes
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized. Superadmin access required." },
    { status: 403 }
  );
}
