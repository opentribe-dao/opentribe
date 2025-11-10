"use server";

import { useActiveOrganization } from "@packages/auth/client";
import { auth } from "@packages/auth/server";
import { database, type User } from "@packages/db";
import { headers } from "next/headers";

export const getUsers = async (
  userIds: string[]
): Promise<
  | {
      data: Pick<User, "id" | "name" | "image" | "email">[];
    }
  | {
      error: unknown;
    }
> => {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    // Get the current organization ID from session
    const currentOrg = useActiveOrganization();

    if (!currentOrg) {
      throw new Error("No active organization");
    }

    // Query users who are members of the current organization
    const users = await database.user.findMany({
      where: {
        id: { in: userIds },
        members: {
          some: {
            organizationId: currentOrg.data?.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
    });

    return {
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error };
  }
};
