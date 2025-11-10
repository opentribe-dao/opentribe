"use client";

import { authClient, useSession } from "@packages/auth/client";
import { Alert, AlertDescription } from "@packages/base/components/ui/alert";
import { Button } from "@packages/base/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
        <div className="rounded-lg border border-white/20 bg-white/5 p-8 backdrop-blur-[10px]">
          {status === "loading" && (
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#E6007A]" />
              <h1 className="font-heading font-semibold text-2xl text-white">
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
              <h1 className="font-heading font-semibold text-2xl text-white">
                Invite Accepted!
              </h1>
              <p className="text-white/60">
                You've successfully joined the organization.
              </p>
              <p className="text-sm text-white/60">
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="font-heading font-semibold text-2xl text-white">
                Invite Failed
              </h1>

              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertDescription className="text-left text-red-400">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                  onClick={() => router.push("/")}
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}
        </div>

        {status === "loading" && (
          <p className="text-center text-sm text-white/40">
            This should only take a moment
          </p>
        )}
      </div>
    </div>
  );
}
