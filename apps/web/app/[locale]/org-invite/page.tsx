"use client";

import { Loader2 } from "lucide-react";

/**
 * Organization Invite Page
 * 
 * This page handles the organization invite flow.
 * Currently shows a loader while the invite is being processed.
 * 
 * TODO: Implement invite flow with API call and redirection logic
 * TODO: Add error handling and security best practices
 */
export default function OrgInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h1 className="font-semibold text-2xl">Processing Invite</h1>
        <p className="text-muted-foreground">
          Please wait while we process your organization invite...
        </p>
      </div>
    </div>
  );
}
