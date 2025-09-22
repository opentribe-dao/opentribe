import {
  adminClient,
  organizationClient,
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./server";

// Create the auth client with proper configuration
const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${
          process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3002"
        }/api/auth`
      : `${process.env.AUTH_API_URL || "http://localhost:3002"}/api/auth`,
  plugins: [
    adminClient(),
    organizationClient(),
    inferAdditionalFields({
      user: {
        profileCompleted: {
          type: "boolean",
          input: false
        },
      },
    })
  ],
});

// Export the client itself for direct usage
export { authClient };

// Export all the methods from the client
export const {
  // Auth methods
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,

  // Admin methods
  admin,

  // Organization methods
  organization,
  useListOrganizations,
  useActiveOrganization,
  verifyEmail,
} = authClient;
