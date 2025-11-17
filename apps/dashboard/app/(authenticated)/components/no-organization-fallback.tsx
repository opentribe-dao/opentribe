"use client";

import { Button } from "@packages/base/components/ui/button";
import { useRouter } from "next/navigation";
import { env } from "@/env";

export function NoOrganizationFallback() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="mb-4 text-white/60">No organization selected</p>
        <Button
          className="bg-[#E6007A] hover:bg-[#E6007A]/90"
          onClick={() =>
            router.push(`${env.NEXT_PUBLIC_WEB_URL}/onboarding/organization`)
          }
        >
          Create Organization
        </Button>
      </div>
    </div>
  );
}

