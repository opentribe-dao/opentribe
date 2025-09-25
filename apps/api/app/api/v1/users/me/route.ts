import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/users/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with organization memberships
    const user = await database.user.findUnique({
      where: { id: sessionData.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        // Core fields
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,

        // Profile fields
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        bio: user.bio,
        interests: user.interests,
        location: user.location,
        skills: user.skills,
        walletAddress: user.walletAddress,

        // Social profiles
        twitter: user.twitter,
        discord: user.discord,
        github: user.github,
        linkedin: user.linkedin,
        website: user.website,
        telegram: user.telegram,

        // Work profile
        employer: user.employer,
        workExperience: user.workExperience,
        cryptoExperience: user.cryptoExperience,
        workPreference: user.workPreference,

        // Metadata
        profileCompleted: user.profileCompleted,
        private: user.private,
        acceptedTOS: user.acceptedTOS,
        preferences: user.preferences,
        lastSeen: user.lastSeen,

        // Organizations
        organizations: user.members.map((member) => ({
          id: member.organization.id,
          name: member.organization.name,
          slug: member.organization.slug,
          role: member.role,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
