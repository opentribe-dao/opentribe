import { database } from "@packages/db";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, customSession, organization } from "better-auth/plugins";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrgInviteEmail,
  sendWelcomeEmail,
  createContact,
} from "@packages/email";

export const trustedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://opentribe.io",
  "https://api.opentribe.io",
  "https://dashboard.opentribe.io",
  "https://dev.opentribe.io",
  "https://api.dev.opentribe.io",
  "https://dashboard.dev.opentribe.io",
];

/**
 * Role Architecture (Better Auth based):
 *
 * Platform Roles (stored in User.role via admin plugin):
 * - "user" (default) - Regular platform users, can apply to grants/bounties
 * - "admin" - Can create and manage organizations
 * - "superadmin" - Platform administrators with full system access
 *
 * Organization Roles (stored in Member.role via organization plugin):
 * - "owner" - Organization creator with full control
 * - "admin" - Can manage organization settings, bounties, grants
 * - "member" - Can view organization content
 */

const authOptions = {
  database: prismaAdapter(database, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      // Profile fields
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      username: { type: "string", required: false },
      headline: { type: "string", required: false },
      bio: { type: "string", required: false },
      interests: { type: "string", required: false }, // JSON array stored as string
      location: { type: "string", required: false },
      skills: { type: "string", required: false }, // JSON stored as string
      walletAddress: { type: "string", required: false },

      // Social profiles
      twitter: { type: "string", required: false },
      discord: { type: "string", required: false },
      github: { type: "string", required: false },
      linkedin: { type: "string", required: false },
      website: { type: "string", required: false },
      telegram: { type: "string", required: false },

      // Work profile
      employer: { type: "string", required: false },
      workExperience: { type: "string", required: false },
      cryptoExperience: { type: "string", required: false },
      workPreference: { type: "string", required: false },

      // User metadata
      profileCompleted: { type: "boolean", defaultValue: false },
      private: { type: "boolean", defaultValue: false },
      acceptedTOS: { type: "date", required: false },
      preferences: { type: "string", required: false }, // JSON stored as string
      lastSeen: { type: "date", required: false },
    },
  },

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.VERCEL_TARGET_ENV === "production" ||
        process.env.VERCEL_TARGET_ENV === "dev"
          ? ".opentribe.io"
          : "localhost",
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    },
  },
  trustedOrigins: [
    ...trustedOrigins,
    ...(process.env.ADDITIONAL_TRUSTED_ORIGINS
      ? process.env.ADDITIONAL_TRUSTED_ORIGINS.split(",").map((origin) =>
          origin.trim()
        )
      : []),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Should not be committed as false, to be disabled only for local development
    sendResetPassword: async ({ user, url, token }) => {
      console.log("Sending password reset email to:", user.email);
      try {
        // Extract just the token from the URL
        const resetToken = url.split("token=")[1]?.split("&")[0] || token;

        await sendPasswordResetEmail(
          {
            email: user.email,
            firstName: user.name || undefined,
          },
          resetToken
        );
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      console.log("Sending verification email to:", user.email);
      try {
        // Extract token from URL if needed
        const verificationToken =
          url.split("token=")[1]?.split("&")[0] || token;

        await sendVerificationEmail(
          {
            email: user.email,
            firstName: user.name || undefined,
          },
          verificationToken
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
      }
    },
    afterEmailVerification: async (user) => {
      console.log("Email verified for:", user.email);
      try {
        await sendWelcomeEmail({
          email: user.email,
          firstName: user.name || undefined,
        });
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Don't throw here - email verification was successful
      }
      try {
        await createContact({
          email: user.email,
          firstName: user.name || undefined,
          lastName: user.name || undefined,
        });
      } catch (error) {
        console.error("Failed to subscribe to newsletter:", error);
        // Don't throw here - email verification was successful
      }
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log(
            "After user create hook:",
            user.createdAt,
            user.email,
            user.emailVerified
          );
          if (user.emailVerified) {
            try {
              await createContact({
                email: user.email,
                firstName: user.name || undefined,
                lastName: user.name || undefined,
              });
            } catch (error) {
              console.error("Failed to subscribe to newsletter:", error);
            }
          }
        },
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },

  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "superadmin"],
    }),
    organization({
      allowUserToCreateOrganization: async (user) => {
        // Allow any authenticated user to create organizations
        return true;
      },
      organizationLimit: 5, // Limit to 5 organizations per user
      membershipLimit: 100, // Max 100 members per organization
      creatorRole: "owner", // Creator gets 'owner' role
      sendInvitationEmail: async (data) => {
        console.log("Sending organization invitation:", data);
        try {
          const inviter = data.inviter?.user;
          const organization = data.organization;

          if (!inviter || !organization) {
            throw new Error("Missing inviter or organization data");
          }

          await sendOrgInviteEmail(
            {
              email: inviter.email,
              firstName: inviter.name || undefined,
            },
            data.email,
            {
              name: organization.name,
              logo: organization.logo || undefined,
            },
            data.role as "admin" | "member",
            data.id // Use invitation ID as token
          );
        } catch (error) {
          console.error("Failed to send organization invitation email:", error);
          throw error;
        }
      },
    }),
  ],
} satisfies BetterAuthOptions;

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  ...authOptions,
  plugins: [
    ...authOptions.plugins,
    customSession(async ({ user, session }, ctx) => {
      // console.debug("Custom session:", user);
      return {
        user: {
          ...user,
          profileCompleted: user.profileCompleted,
          username: user.username,
          role: user.role,
        },
        session,
      };
    }, authOptions),
  ],
});
