import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import type {
  Session,
  User,
  Member,
  Organization,
  GrantApplication,
  Submission,
} from "@packages/db";
import { sendOnboardingCompleteEmail } from "@packages/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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

    const { id: userId } = await params;

    // Get user with all relevant relations
    const user = await database.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
        applications: {
          where: {
            status: {
              not: "DRAFT",
            },
          },
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
          where: {
            status: {
              not: "DRAFT",
            },
          },
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the requesting user can view this profile
    const isOwnProfile = sessionData?.user?.id === userId;
    const isPublicProfile = !user.private;

    if (!isOwnProfile && !isPublicProfile) {
      // Return limited data for private profiles
      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            image: user.image,
            headline: user.headline,
            private: true,
          },
        },
        { headers: corsHeaders }
      );
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

    return NextResponse.json(
      {
        user: {
          ...publicUser,
          email: isOwnProfile ? email : undefined, // Only show email to profile owner
          isOwnProfile,
        },
        stats,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500, headers: corsHeaders }
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id: userId } = await params;

    // Only allow users to update their own profile
    if (sessionData.user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const updateProfileSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      username: z.string().min(3).max(30).optional(),
      avatarUrl: z.string().url().optional(),
      headline: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      interests: z.array(z.string()).optional(),
      location: z.string().optional(),
      skills: z.any().optional(),
      walletAddress: z.string().optional(),
      twitter: z.string().optional(),
      discord: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().url().optional(),
      telegram: z.string().optional(),
      employer: z.string().optional(),
      workExperience: z.string().optional(),
      cryptoExperience: z.string().optional(),
      workPreference: z.string().optional(),
      private: z.boolean().optional(),
    });

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is already taken
    if (validatedData.username) {
      const existingUser = await database.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400, headers: corsHeaders }
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
          { status: 400, headers: corsHeaders }
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

    return NextResponse.json(
      {
        user: {
          ...publicUser,
          email, // Include email for own profile
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500, headers: corsHeaders }
    );
  }
}
