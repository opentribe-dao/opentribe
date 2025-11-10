"use client";

import { useSession } from "@packages/auth/client";
import { ImageUpload } from "@packages/base";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import SkillsOptions from "@packages/base/components/ui/skills-options";
import { Textarea } from "@packages/base/components/ui/textarea";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { useUpdateProfile, useUserProfile } from "@/hooks/use-user-profile";
import { validateWalletAddress } from "../../lib/validations/wallet";

const CRYPTO_EXPERIENCE_OPTIONS = [
  { value: "new", label: "New to crypto" },
  { value: "occasional", label: "Contribute occasionally" },
  { value: "regular", label: "Contribute regularly" },
];

const WORK_PREFERENCE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "bounties", label: "Bounties only" },
];

export default function BuilderOnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const [currentStep, setCurrentStep] = useState(1);

  // Username validation state
  const [usernameError, setUsernameError] = useState<string>("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1 - Personal Info
    firstName: "",
    lastName: "",
    username: "",
    image: "",
    location: "",
    skills: [] as string[],
    walletAddress: "",
    website: "",
    twitter: "",
    github: "",
    linkedin: "",

    // Step 2 - Work Info
    employer: "",
    workExperience: "",
    cryptoExperience: "",
    workPreference: "",
  });

  useEffect(() => {
    if (!(sessionLoading || session?.user)) {
      // User is not authenticated, redirect to home
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    // Pre-fill form with user profile data when it loads
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        firstName:
          userProfile.firstName ||
          (userProfile.name ? userProfile.name.split(" ")[0] : ""),
        lastName:
          userProfile.lastName ||
          (userProfile.name
            ? userProfile.name.split(" ").slice(1).join(" ")
            : ""),
        username: userProfile.username || "",
        image: userProfile.image || "",
        location: userProfile.location || "",
        skills: userProfile.skills || [],
        walletAddress: userProfile.walletAddress || "",
        website: userProfile.website || "",
        twitter: userProfile.twitter || "",
        github: userProfile.github || "",
        linkedin: userProfile.linkedin || "",
        employer: userProfile.employer || "",
        workExperience: userProfile.workExperience || "",
        cryptoExperience: userProfile.cryptoExperience || "",
        workPreference: userProfile.workPreference || "",
      }));
    }
  }, [userProfile]);

  // Cleanup debounce timer on unmount
  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    []
  );

  // Username validation function
  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      // Skip validation if username is empty or too short
      if (!username || username.length < 3) {
        setUsernameError("");
        return;
      }

      // Skip validation if it's the user's current username
      if (username === session?.user?.username) {
        setUsernameError("");
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError("");

      try {
        const response = await fetch(
          `${
            env.NEXT_PUBLIC_API_URL
          }/api/v1/users?username=${encodeURIComponent(username)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check username");
        }

        const data = await response.json();

        // If any users are returned, the username is taken
        if (data.users && data.users.length > 0) {
          setUsernameError("This username is already taken");
        } else {
          setUsernameError("");
        }
      } catch {
        // Username check failed, but allow user to proceed
        // Don't show error to user, allow them to proceed
        setUsernameError("");
      } finally {
        setIsCheckingUsername(false);
      }
    },
    [session?.user?.username]
  );

  const handleInputChange = (field: string, value: string) => {
    // Convert username to lowercase for consistency
    const processedValue = field === "username" ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    // Debounced username validation
    if (field === "username") {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        checkUsernameAvailability(processedValue);
      }, 500); // 500ms debounce
    }
  };

  const validateStep1 = () => {
    if (
      !(
        formData.firstName &&
        formData.lastName &&
        formData.username &&
        formData.location
      )
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }

    // Check if username is still being validated
    if (isCheckingUsername) {
      toast.error("Please wait while we check username availability");
      return false;
    }

    // Check if username has an error
    if (usernameError) {
      toast.error(usernameError);
      return false;
    }

    if (formData.skills.length === 0) {
      toast.error("Please select at least one skill");
      return false;
    }
    if (!formData.walletAddress) {
      toast.error("Please enter your wallet address");
      return false;
    }

    // Validate wallet address format
    const walletValidation = validateWalletAddress(formData.walletAddress);
    if (!walletValidation.isValid) {
      toast.error(walletValidation.error || "Invalid wallet address");
      return false;
    }

    if (
      !(
        formData.website ||
        formData.twitter ||
        formData.github ||
        formData.linkedin
      )
    ) {
      toast.error("Please add at least one social media link");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!(formData.cryptoExperience && formData.workPreference)) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      // Scroll to top when moving to next step, especially important for mobile
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      // Scroll to top when going back to previous step, especially important for mobile
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/onboarding");
    }
  };

  const handleSubmit = async () => {
    try {
      // payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.toLowerCase(),
        image: formData.image,
        location: formData.location,
        skills: formData.skills,
        walletAddress: formData.walletAddress,
        website: formData.website,
        twitter: formData.twitter,
        github: formData.github,
        linkedin: formData.linkedin,
        employer: formData.employer,
        workExperience: formData.workExperience,
        cryptoExperience: formData.cryptoExperience,
        workPreference: formData.workPreference,
      };

      await updateProfileMutation.mutateAsync(payload);
      toast.success("Profile created successfully!");
      router.push("/");
    } catch (error) {
      // Profile update failed
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create profile. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (sessionLoading || profileLoading) {
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
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="font-medium text-white/70 text-xs tracking-[0.2em]">
            OPENTRIBE
          </div>
          <div className="flex items-center gap-6">
            <Link
              className="text-sm text-white/60"
              href="/faq"
              rel="noopener noreferrer"
              target="_blank"
            >
              Questions?
            </Link>
            <Link
              className="text-sm text-white/60"
              href="/contact"
              rel="noopener noreferrer"
              target="_blank"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/95 p-8 backdrop-blur-md">
          {/* Back Button */}
          <Button
            className="mb-6 text-white/60 hover:text-white"
            onClick={handleBack}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {/* Title */}
          <div className="mb-8">
            <h1 className="mb-2 font-semibold text-2xl text-white">Profile</h1>
            <p className="text-sm text-white/60">
              Help us to know about you so that we can have tailored experience.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStep >= 1 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-white/60 text-xs">Personal Details</span>
            </div>
            <div className="h-px flex-1 bg-white/20" />
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStep >= 2 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-white/60 text-xs">
                Professional Details
              </span>
            </div>
          </div>

          {/* Form Steps */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 text-white/80" htmlFor="firstName">
                    First Name *
                  </Label>
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    id="firstName"
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                    value={formData.firstName}
                  />
                </div>
                <div>
                  <Label className="mb-2 text-white/80" htmlFor="lastName">
                    Last Name *
                  </Label>
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    id="lastName"
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter your last name"
                    value={formData.lastName}
                  />
                </div>
              </div>

              {/* Avatar */}
              <div>
                <Label className="mb-4 block text-white/80">
                  Profile Picture
                </Label>
                <ImageUpload
                  currentImageUrl={formData.image}
                  entityId={session?.user?.id}
                  onImageChange={(url) => handleInputChange("image", url || "")}
                  uploadType="profile-avatar"
                  variant="avatar"
                />
              </div>

              {/* Username */}
              <div>
                <Label className="mb-2 text-white/80" htmlFor="username">
                  Username *
                </Label>
                <div className="relative">
                  <Input
                    className={`bg-white/5 text-white placeholder:text-white/40 ${
                      usernameError ? "border-red-500" : "border-white/20"
                    }`}
                    id="username"
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    placeholder="Choose a unique username"
                    value={formData.username}
                  />
                  {isCheckingUsername && (
                    <div className="-translate-y-1/2 absolute top-1/2 right-3">
                      <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    </div>
                  )}
                </div>
                {usernameError && (
                  <p className="mt-1 text-red-500 text-xs">{usernameError}</p>
                )}
                {!(usernameError || isCheckingUsername) &&
                  formData.username &&
                  formData.username.length >= 3 && (
                    <p className="mt-1 text-green-500 text-xs">
                      ✓ Username is available
                    </p>
                  )}
              </div>

              {/* Location */}
              <div>
                <Label className="mb-2 text-white/80" htmlFor="location">
                  Location *
                </Label>
                <Input
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  id="location"
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="City, Country"
                  value={formData.location}
                />
              </div>

              {/* Skills */}
              <div>
                <Label className="mb-2 text-white/80">Skills *</Label>
                <SkillsOptions
                  onChange={(skills) => {
                    if (skills && skills.length > 0) {
                      setFormData((prev) => ({ ...prev, skills }));
                    } else {
                      setFormData((prev) => ({ ...prev, skills: [] }));
                    }
                  }}
                  value={formData.skills}
                />
              </div>

              {/* Wallet Address */}
              <div>
                <Label className="mb-2 text-white/80" htmlFor="walletAddress">
                  Wallet Address *
                </Label>
                <Input
                  className="border-white/20 bg-white/5 font-mono text-white placeholder:text-white/40"
                  id="walletAddress"
                  onChange={(e) =>
                    handleInputChange("walletAddress", e.target.value)
                  }
                  placeholder="Enter your Polkadot or Kusama address"
                  value={formData.walletAddress}
                />
                {formData.walletAddress && (
                  <p
                    className={`mt-1 text-xs ${
                      validateWalletAddress(formData.walletAddress).isValid
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {validateWalletAddress(formData.walletAddress).isValid
                      ? `✓ Valid ${
                          validateWalletAddress(formData.walletAddress).network
                        } address`
                      : validateWalletAddress(formData.walletAddress).error}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div>
                <Label className="mb-2 text-white/80">
                  Social Media Links{" "}
                  <span className="text-white/40 text-xs">
                    (Add at least one)
                  </span>
                </Label>
                <div className="space-y-3">
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="Personal website"
                    value={formData.website}
                  />
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    onChange={(e) =>
                      handleInputChange("twitter", e.target.value)
                    }
                    placeholder="Twitter handle"
                    value={formData.twitter}
                  />
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    onChange={(e) =>
                      handleInputChange("github", e.target.value)
                    }
                    placeholder="GitHub username"
                    value={formData.github}
                  />
                  <Input
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    onChange={(e) =>
                      handleInputChange("linkedin", e.target.value)
                    }
                    placeholder="LinkedIn profile"
                    value={formData.linkedin}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Current Employer */}
              <div>
                <Label className="mb-2 text-white/80" htmlFor="employer">
                  Current Employer{" "}
                  <span className="text-white/40 text-xs">(Optional)</span>
                </Label>
                <Input
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  id="employer"
                  onChange={(e) =>
                    handleInputChange("employer", e.target.value)
                  }
                  placeholder="Company name"
                  value={formData.employer}
                />
              </div>

              {/* Work Experience */}
              <div>
                <Label className="mb-2 text-white/80" htmlFor="workExperience">
                  Work Experience{" "}
                  <span className="text-white/40 text-xs">(Optional)</span>
                </Label>
                <Textarea
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  id="workExperience"
                  onChange={(e) =>
                    handleInputChange("workExperience", e.target.value)
                  }
                  placeholder="Tell us about your professional experience"
                  rows={4}
                  value={formData.workExperience}
                />
              </div>

              {/* Crypto Experience */}
              <div>
                <Label className="mb-2 text-white/80">
                  Crypto Experience *
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("cryptoExperience", value)
                  }
                  value={formData.cryptoExperience}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-zinc-900">
                    {CRYPTO_EXPERIENCE_OPTIONS.map((option) => (
                      <SelectItem
                        className="text-white"
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Preference */}
              <div>
                <Label className="mb-2 text-white/80">Work Preference *</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("workPreference", value)
                  }
                  value={formData.workPreference}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue placeholder="Select your preferred work type" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-zinc-900">
                    {WORK_PREFERENCE_OPTIONS.map((option) => (
                      <SelectItem
                        className="text-white"
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            {/* TODO: @yogesh - Discuss with team about Save as draft */}
            {/* <Button
              variant="ghost"
              onClick={() =>
                router.push(env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard")
              }
              className="text-white/60 hover:text-white"
            >
              Save as Draft
            </Button> */}

            <Button
              className="bg-[#E6007A] px-8 text-white hover:bg-[#E6007A]/90"
              disabled={updateProfileMutation.isPending}
              onClick={handleNext}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 1 ? (
                "Next Step"
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
