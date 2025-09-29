declare module "better-auth" {
  interface User {
    // Better Auth admin plugin fields
    role: "user" | "admin" | "superadmin";
    banned: boolean;
    banReason?: string | null;
    banExpires?: Date | null;

    // Opentribe profile fields
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    headline?: string | null;
    bio?: string | null;
    interests?: string[] | null;
    location?: string | null;
    skills?: Record<string, any> | null;
    walletAddress?: string | null;

    // Social profiles
    twitter?: string | null;
    discord?: string | null;
    github?: string | null;
    linkedin?: string | null;
    website?: string | null;
    telegram?: string | null;

    // Work profile
    employer?: string | null;
    workExperience?: string | null;
    cryptoExperience?: string | null;
    workPreference?: string | null;

    // User metadata
    profileCompleted: boolean;
    private: boolean;
    acceptedTOS?: Date | null;
    preferences?: Record<string, any> | null;
    lastSeen?: Date | null;
  }

  interface Session {
    activeOrganizationId?: string | null;
  }
}
