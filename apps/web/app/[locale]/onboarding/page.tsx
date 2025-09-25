"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import builderIllustration from "../../../public/images/builder-illustration.png";
import organizationIllustration from "../../../public/images/organization-illustration.png";
import { Label } from "@packages/base/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [selectedType, setSelectedType] = useState<
    "builder" | "organization" | null
  >("builder");

  useEffect(() => {
    if (!isPending && !session?.user) {
      // User is not authenticated, redirect to home
      router.push("/");
    }
  }, [session, isPending, router]);

  const handleContinue = () => {
    if (!selectedType) {
      return;
    }

    if (selectedType === "builder") {
      router.push("/onboarding/builder");
    } else {
      router.push("/onboarding/organization");
    }
  };

  const canContinue = selectedType !== null;

  const builderBenefits = [
    "Contribute to top Polkadot projects",
    "Build your Web3 resume",
    "Get paid in Crypto",
  ];

  const organizationBenefits = [
    "Get in front of hundreds of weekly contributors",
    "20+ templates to choose from",
    "100% free and Open Source",
  ];

  const descriptions = {
    builder:
      "Create a profile to start submitting, and get notified on new work opportunities",
    organization:
      "List a bounty or freelance gig for your project and find your next contributor",
  } as const;

  const description = selectedType ? descriptions[selectedType] : "";

  const benefitsMap = {
    builder: builderBenefits,
    organization: organizationBenefits,
  } as const;

  const benefits = selectedType ? benefitsMap[selectedType] : [];

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
      </div>
    );
  }

  // If no session, show loading (will redirect)
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 p-8 backdrop-blur-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading text-transparent text-xl tracking-[0.25em]">
            OPENTRIBE
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-8 text-center font-semibold text-2xl text-white">
          How do you want to continue
        </h1>

        {/* Account Type Selection */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Builder Option */}
          <button
            type="button"
            onClick={() => setSelectedType("builder")}
            className={`relative rounded-xl border-2 p-6 transition-all ${
              selectedType === "builder"
                ? "border-[#E6007A] bg-[#E6007A]/10"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="relative mb-4 aspect-square">
              <Image
                src={builderIllustration}
                alt="Builder"
                fill
                className="object-contain"
              />
            </div>
            <p className="font-medium text-white">As Builder</p>
          </button>

          {/* Organization Option */}
          <button
            type="button"
            onClick={() => setSelectedType("organization")}
            className={`relative rounded-xl border-2 p-6 transition-all ${
              selectedType === "organization"
                ? "border-[#E6007A] bg-[#E6007A]/10"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="relative mb-4 aspect-square">
              <Image
                src={organizationIllustration}
                alt="Organization"
                fill
                className="object-contain"
              />
            </div>
            <p className="font-medium text-white">As Organization</p>
          </button>
        </div>

        {/* Options based on selection */}
        {selectedType && (
          <div className="mb-8">
            <p className="mb-4 text-sm text-white/80">{description}</p>

            <div className="space-y-3">
              {benefits.map((text) => (
                <Label
                  key={text}
                  className="flex cursor-pointer items-center space-x-3"
                >
                  <Checkbox
                    checked={true}
                    disabled
                    className="border-white/40 data-[state=checked]:border-[#E6007A] data-[state=checked]:bg-[#E6007A]"
                  />
                  <span className="text-sm text-white/80">{text}</span>
                </Label>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="h-12 w-full bg-[#E6007A] font-medium text-white hover:bg-[#E6007A]/90 disabled:opacity-50"
        >
          Continue as{" "}
          {selectedType === "organization" ? "Organization" : "Builder"}
        </Button>

        {/* Footer text */}
        {/* <div className="mt-4 text-center text-white/40 text-xs">
          {selectedType === "builder" && <p>Join 94,500 above</p>}
          {selectedType === "organization" && <p>Logos</p>}
        </div> */}
      </div>
    </div>
  );
}
