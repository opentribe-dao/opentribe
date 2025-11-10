import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Create the auth client with proper configuration
const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth`
      : `${process.env.BETTER_AUTH_URL || "http://localhost:3002"}/api/auth`,
  plugins: [
    adminClient(),
    organizationClient(),
    customSessionClient(),
    inferAdditionalFields({
      user: {
        // Only include fields that are in the custom session
        profileCompleted: {
          type: "boolean",
          input: false, // Don't require during signup
        },
        username: {
          type: "string",
          input: false, // Don't require during signup
        },
        role: {
          type: "string",
          input: false, // Don't require during signup
        },
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;

// Export all the methods from the client
export const {
  // Auth methods
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  verifyEmail,

  // Admin methods
  admin,

  // Organization methods
  organization,
  useListOrganizations,
  useActiveOrganization,
} = authClient;

export { authClient };
