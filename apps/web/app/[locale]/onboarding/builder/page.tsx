"use client";

import { useSession } from "@packages/auth/client";
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
import { Textarea } from "@packages/base/components/ui/textarea";
import { ImageUpload } from "@packages/base";
import { ChevronLeft, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { validateWalletAddress } from "../../lib/validations/wallet";
import { env } from "@/env";

const SKILLS_OPTIONS = [
  "Smart Contracts",
  "Frontend Development",
  "Backend Development",
  "Mobile Development",
  "UI/UX Design",
  "DevOps",
  "Security",
  "Data Analysis",
  "Product Management",
  "Community Management",
  "Content Creation",
  "Marketing",
];

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
  const { data: session, isPending } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    if (!isPending) {
      if (!session?.user) {
        // User is not authenticated, redirect to home
        router.push("/");
      } else {
        // Pre-fill form with existing user data
        if (session.user.name) {
          const [firstName, ...lastNameParts] = session.user.name.split(" ");
          setFormData((prev) => ({
            ...prev,
            firstName: firstName || "",
            lastName: lastNameParts.join(" ") || "",
          }));
        }
      }
    }
  }, [session, isPending, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validateStep1 = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.location
    ) {
      toast.error("Please fill in all required fields");
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
      !formData.website &&
      !formData.twitter &&
      !formData.github &&
      !formData.linkedin
    ) {
      toast.error("Please add at least one social media link");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.cryptoExperience || !formData.workPreference) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.push("/onboarding");
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Update user profile
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            skills: JSON.stringify(formData.skills),
            profileCompleted: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no session, show loading (will redirect)
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-xs font-medium text-white/70 tracking-[0.2em]">
            OPENTRIBE
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/60">Questions?</span>
            <span className="text-sm text-white/60">Contact</span>
            <Button variant="ghost" size="sm" className="text-white/60">
              <Globe className="h-4 w-4 mr-1" />
              EN
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-6 text-white/60 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Profile</h1>
            <p className="text-white/60 text-sm">
              Help us to know about you so that we can have tailored experience.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 1 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-xs text-white/60">Personal Details</span>
            </div>
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 2 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-xs text-white/60">
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
                  <Label htmlFor="firstName" className="text-white/80 mb-2">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white/80 mb-2">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter your last name"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              {/* Avatar */}
              <div>
                <Label className="text-white/80 mb-4 block">
                  Profile Picture
                </Label>
                <ImageUpload
                  currentImageUrl={formData.image}
                  onImageChange={(url) => handleInputChange("image", url || "")}
                  uploadType="profile-avatar"
                  entityId={session?.user?.id}
                  variant="avatar"
                />
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username" className="text-white/80 mb-2">
                  Username *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Choose a unique username"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-white/80 mb-2">
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="City, Country"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Skills */}
              <div>
                <Label className="text-white/80 mb-2">
                  Skills *{" "}
                  <span className="text-xs text-white/40">
                    (We will use this to match you to new opportunities)
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_OPTIONS.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkillToggle(skill)}
                      className={`border-white/20 ${
                        formData.skills.includes(skill)
                          ? "bg-[#E6007A] border-[#E6007A] text-white"
                          : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <Label htmlFor="walletAddress" className="text-white/80 mb-2">
                  Wallet Address *
                </Label>
                <Input
                  id="walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) =>
                    handleInputChange("walletAddress", e.target.value)
                  }
                  placeholder="Enter your Polkadot or Kusama address"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 font-mono"
                />
                {formData.walletAddress && (
                  <p
                    className={`text-xs mt-1 ${
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
                <Label className="text-white/80 mb-2">
                  Social Media Links{" "}
                  <span className="text-xs text-white/40">
                    (Add at least one)
                  </span>
                </Label>
                <div className="space-y-3">
                  <Input
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="Personal website"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Input
                    value={formData.twitter}
                    onChange={(e) =>
                      handleInputChange("twitter", e.target.value)
                    }
                    placeholder="Twitter handle"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Input
                    value={formData.github}
                    onChange={(e) =>
                      handleInputChange("github", e.target.value)
                    }
                    placeholder="GitHub username"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Input
                    value={formData.linkedin}
                    onChange={(e) =>
                      handleInputChange("linkedin", e.target.value)
                    }
                    placeholder="LinkedIn profile"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Current Employer */}
              <div>
                <Label htmlFor="employer" className="text-white/80 mb-2">
                  Current Employer{" "}
                  <span className="text-xs text-white/40">(Optional)</span>
                </Label>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) =>
                    handleInputChange("employer", e.target.value)
                  }
                  placeholder="Company name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Work Experience */}
              <div>
                <Label htmlFor="workExperience" className="text-white/80 mb-2">
                  Work Experience{" "}
                  <span className="text-xs text-white/40">(Optional)</span>
                </Label>
                <Textarea
                  id="workExperience"
                  value={formData.workExperience}
                  onChange={(e) =>
                    handleInputChange("workExperience", e.target.value)
                  }
                  placeholder="Tell us about your professional experience"
                  rows={4}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Crypto Experience */}
              <div>
                <Label className="text-white/80 mb-2">
                  Crypto Experience *
                </Label>
                <Select
                  value={formData.cryptoExperience}
                  onValueChange={(value) =>
                    handleInputChange("cryptoExperience", value)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/20">
                    {CRYPTO_EXPERIENCE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Preference */}
              <div>
                <Label className="text-white/80 mb-2">Work Preference *</Label>
                <Select
                  value={formData.workPreference}
                  onValueChange={(value) =>
                    handleInputChange("workPreference", value)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select your preferred work type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/20">
                    {WORK_PREFERENCE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white"
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
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="ghost"
              onClick={() =>
                router.push(env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard")
              }
              className="text-white/60 hover:text-white"
            >
              Save as Draft
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white px-8"
            >
              {loading ? (
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
