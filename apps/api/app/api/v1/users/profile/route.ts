import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendOnboardingCompleteEmail } from "@packages/email";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for profile update
const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  name: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  walletAddress: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  employer: z.string().optional(),
  workExperience: z.string().optional(),
  cryptoExperience: z.string().optional(),
  workPreference: z.string().optional(),
  profileCompleted: z.boolean().optional(),
  image: z.string().optional(),
});

// PATCH /api/v1/users/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Get current user to check previous state
    const currentUser = await database.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        walletAddress: true,
        profileCompleted: true,
        email: true,
        firstName: true,
        lastName: true,
        website: true,
        twitter: true,
        github: true,
        linkedin: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Check if username is already taken (if provided and different from current)
    if (
      validatedData.username &&
      validatedData.username !== currentUser.username
    ) {
      const existingUser = await database.user.findFirst({
        where: {
          username: {
            equals: validatedData.username,
            mode: "insensitive",
          },
          id: {
            not: session.user.id,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // 2. Check if wallet address is already taken (if provided and different from current)
    if (
      validatedData.walletAddress &&
      validatedData.walletAddress !== currentUser.walletAddress
    ) {
      const existingWallet = await database.user.findFirst({
        where: {
          walletAddress: validatedData.walletAddress,
          id: {
            not: session.user.id,
          },
        },
      });

      if (existingWallet) {
        return NextResponse.json(
          { error: "Wallet address is already in use" },
          { status: 409 }
        );
      }
    }

    // 3. Determine if profile should be marked as completed
    // Profile is complete if: username, wallet, and at least 1 social link
    const updateData = { ...validatedData };

    // Build the final user data by merging current with updates
    const finalUserData = {
      username: updateData.username ?? currentUser.username,
      walletAddress: updateData.walletAddress ?? currentUser.walletAddress,
      website: updateData.website ?? currentUser.website,
      twitter: updateData.twitter ?? currentUser.twitter,
      github: updateData.github ?? currentUser.github,
      linkedin: updateData.linkedin ?? currentUser.linkedin,
    };

    const hasUsername = Boolean(finalUserData.username);
    const hasWallet = Boolean(finalUserData.walletAddress);
    const hasSocial = Boolean(
      finalUserData.website ||
        finalUserData.twitter ||
        finalUserData.github ||
        finalUserData.linkedin
    );

    // Override profileCompleted if all conditions are met
    if (hasUsername && hasWallet && hasSocial) {
      updateData.profileCompleted = true;
    }

    // Also update full name if firstName and lastName are provided
    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || currentUser.firstName || "";
      const lastName = updateData.lastName || currentUser.lastName || "";
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    // 4. Update user profile
    const updatedUser = await database.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        firstName: true,
        lastName: true,
        username: true,
        location: true,
        skills: true,
        walletAddress: true,
        website: true,
        twitter: true,
        github: true,
        linkedin: true,
        employer: true,
        workExperience: true,
        cryptoExperience: true,
        workPreference: true,
        profileCompleted: true,
      },
    });

    // 5. Send onboarding complete email if this is the first time
    if (
      updatedUser.profileCompleted &&
      !currentUser.profileCompleted &&
      updatedUser.email
    ) {
      try {
        await sendOnboardingCompleteEmail(
          {
            email: updatedUser.email,
            firstName: updatedUser.firstName || undefined,
            username: updatedUser.username || undefined,
          },
          "builder"
        );
      } catch (emailError) {
        // Log error but don't fail the request
        console.error("Failed to send onboarding email:", emailError);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
