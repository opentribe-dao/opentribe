"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient, useSession } from "@packages/auth/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@packages/base/components/ui/button";
import { Alert, AlertDescription } from "@packages/base/components/ui/alert";

import { env } from "@/env";

/**
 * Organization Invite Page
 *
 * This page handles the organization invite flow.
 * The invite token is passed as a query parameter: /org-invite?token={invitationId}
 *
 * Flow:
 * 1. Extract token from URL query params
 * 2. Check if user is authenticated
 * 3. Call authClient.organization.acceptInvitation with the token
 * 4. Redirect to the organization dashboard on success
 */
export default function OrgInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processInvite = async () => {
      // Get token from URL
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("Invalid invite link. No invitation token found.");
        return;
      }

      // Wait for session to load
      if (sessionLoading) {
        return;
      }

      // Check if user is authenticated
      if (!session) {
        // Store the invite token and redirect to sign in
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pendingInviteToken", token);
          router.push(`/sign-in?redirect=/org-invite?token=${token}`);
        }
        return;
      }

      // Accept the invitation
      try {
        const { data, error } = await authClient.organization.acceptInvitation({
          invitationId: token,
        });

        if (error) {
          setStatus("error");
          setErrorMessage(
            error.message ||
              "Failed to accept invitation. The invite may be invalid or expired."
          );
          return;
        }

        if (data) {
          setStatus("success");

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push(env.NEXT_PUBLIC_DASHBOARD_URL);
          }, 2000);
        }
      } catch {
        setStatus("error");
        setErrorMessage(
          "An unexpected error occurred while processing your invite."
        );
      }
    };

    processInvite();
  }, [searchParams, session, sessionLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white/5 backdrop-blur-[10px] border border-white/20 rounded-lg p-8">
          {status === "loading" && (
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#E6007A]" />
              <h1 className="font-heading text-2xl font-semibold text-white">
                Processing Invite
              </h1>
              <p className="text-white/60">
                Please wait while we process your organization invite...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="font-heading text-2xl font-semibold text-white">
                Invite Accepted!
              </h1>
              <p className="text-white/60">
                You've successfully joined the organization.
              </p>
              <p className="text-white/60 text-sm">
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="font-heading text-2xl font-semibold text-white">
                Invite Failed
              </h1>

              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400 text-left">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/")}
                  className="w-full bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}
        </div>

        {status === "loading" && (
          <p className="text-white/40 text-center text-sm">
            This should only take a moment
          </p>
        )}
      </div>
    </div>
  );
}
