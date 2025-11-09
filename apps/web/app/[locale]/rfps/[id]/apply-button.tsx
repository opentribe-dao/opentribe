"use client";

import { env } from "@/env";
import { Button } from "@packages/base/components/ui/button";
import { useRouter } from "next/navigation";

interface ApplyButtonProps {
  rfp: {
    id: string;
    status: string;
    userApplicationId?: string;
    canApply?: boolean;
    grant: {
      id: string;
      slug?: string;
      status: string;
      source: string;
      applicationUrl?: string;
      userApplicationId?: string;
    };
  };
}

export function ApplyButton({ rfp }: ApplyButtonProps) {
  const router = useRouter();

  switch (true) {
    case !!rfp.userApplicationId:
      return (
        <Button
          className="bg-pink-600 text-white hover:bg-pink-700"
          disabled={false}
          onClick={() =>
            router.push(
              `/grants/${rfp.grant.slug || rfp.grant.id}/applications/${
                rfp.userApplicationId
              }`
            )
          }
        >
          View Application
        </Button>
      );
    case rfp.status !== "OPEN" || rfp.grant.status !== "OPEN":
      return (
        <Button
          className="bg-pink-600 text-white hover:bg-pink-700"
          disabled={true}
        >
          Application Closed
        </Button>
      );
    case rfp.grant.source === "EXTERNAL" && !!rfp.grant.applicationUrl:
      return (
        <Button
          className="w-full bg-pink-600 text-white hover:bg-pink-700"
          disabled={rfp.canApply === false}
          onClick={() =>
            window.open(
              rfp.grant.applicationUrl,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Apply Externally
        </Button>
      );
    default:
      return (
        <Button
          className="w-full bg-pink-600 text-white hover:bg-pink-700"
          disabled={rfp.canApply === false}
          onClick={() =>
            router.push(
              `/grants/${rfp.grant.slug || rfp.grant.id}/apply?rfp=${rfp.id}`
            )
          }
        >
          Apply with this RFP
        </Button>
      );
  }
}
