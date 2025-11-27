import { auth } from "@packages/auth/server";
import { OPTIONAL_URL_REGEX } from "@packages/base/lib/utils";
import { formatZodError } from "@/lib/zod-errors";
import type {
  GrantApplication,
  Member,
  Organization,
  Submission,
  User,
} from "@packages/db";
import { database } from "@packages/db";
import { sendOnboardingCompleteEmail } from "@packages/email";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

interface UserWithRelations extends User {
  members: (Member & { organization: Organization })[];
  applications: GrantApplication[];
  submissions: Submission[];
  wonSubmissions: Submission[];
}

// GET /api/v1/users/[id] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    const { id: idOrUsername } = await params;

    // First, get the user to check if it's own profile
    const userForCheck = await database.user.findFirst({
      where: {
        OR: [
          { id: idOrUsername },
          {
            username: {
              equals: idOrUsername,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        private: true,
      },
    });

    if (!userForCheck) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user can view this profile
    const isOwnProfile = sessionData?.user?.id === userForCheck.id;
    const isPublicProfile = !userForCheck.private;

    if (!(isOwnProfile || isPublicProfile)) {
      // Return limited data for private profiles
      return NextResponse.json({
        user: {
          id: userForCheck.id,
          private: true,
        },
      });
    }

    // Get user with all relevant relations (by id OR username)
    // For own profile, show all submissions/applications regardless of status
    const user = await database.user.findFirst({
      where: {
        OR: [
          { id: idOrUsername },
          {
            username: {
              equals: idOrUsername,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
        applications: {
          where: isOwnProfile ? {} : { status: { not: "DRAFT" } },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            grant: {
              include: {
                organization: true,
              },
            },
          },
        },
        submissions: {
          where: isOwnProfile ? {} : { status: { not: "DRAFT" } },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            bounty: {
              include: {
                organization: true,
              },
            },
          },
        },
        wonSubmissions: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            bounty: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive fields
    const {
      email,
      emailVerified,
      banned,
      banReason,
      banExpires,
      ...publicUser
    } = user;

    // Add stats
    const stats = {
      totalApplications: user.applications.length,
      totalSubmissions: user.submissions.length,
      totalWins: user.wonSubmissions.length,
      organizations: user.members.length,
    };

    return NextResponse.json({
      user: {
        ...publicUser,
        email: isOwnProfile ? email : undefined, // Only show email to profile owner
        isOwnProfile,
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/users/[id] - Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Only allow users to update their own profile
    if (sessionData.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateProfileSchema = z.object({
      firstName: z.string().trim().optional(),
      lastName: z.string().trim().optional(),
      username: z.string().trim().min(3).max(30).optional(),
      image: z.string().regex(OPTIONAL_URL_REGEX).optional(),
      headline: z.string().trim().max(100).optional(),
      bio: z.string().trim().max(500).optional(),
      interests: z.array(z.string()).optional(),
      location: z.string().trim().optional(),
      skills: z.any().optional(),
      walletAddress: z.string().optional(),
      twitter: z.string().trim().optional(),
      discord: z.string().trim().optional(),
      github: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
      website: z.string().regex(OPTIONAL_URL_REGEX).optional(),
      telegram: z.string().trim().optional(),
      employer: z.string().trim().optional(),
      workExperience: z.string().trim().optional(),
      cryptoExperience: z.string().trim().optional(),
      workPreference: z.string().trim().optional(),
      private: z.boolean().optional(),
    });

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is already taken
    if (validatedData.username) {
      const existingUser = await database.user.findFirst({
        where: {
          username: {
            equals: validatedData.username,
            mode: "insensitive",
          },
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Check if wallet address is already taken
    if (validatedData.walletAddress) {
      const existingUser = await database.user.findFirst({
        where: {
          walletAddress: validatedData.walletAddress,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Wallet address already associated with another account" },
          { status: 400 }
        );
      }
    }

    // Check if this is the first time completing profile
    const currentUser = await database.user.findUnique({
      where: { id: userId },
      select: { profileCompleted: true },
    });

    const isFirstCompletion = !currentUser?.profileCompleted;

    // Update user profile
    const updatedUser = await database.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        profileCompleted: true,
        updatedAt: new Date(),
      },
    });

    // Send onboarding complete email if this is the first time
    if (isFirstCompletion && updatedUser.profileCompleted) {
      try {
        await sendOnboardingCompleteEmail(
          {
            email: updatedUser.email,
            firstName: updatedUser.firstName || undefined,
            username: updatedUser.username || undefined,
          },
          "builder" // Users completing profile are builders
        );
      } catch (error) {
        console.error("Failed to send onboarding complete email:", error);
        // Don't fail the request if email fails
      }
    }

    const {
      email,
      emailVerified,
      banned,
      banReason,
      banExpires,
      ...publicUser
    } = updatedUser;

    return NextResponse.json({
      user: {
        ...publicUser,
        email, // Include email for own profile
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
