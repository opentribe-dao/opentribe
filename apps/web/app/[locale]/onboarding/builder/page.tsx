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
import { stringifySkillsArray } from "@/lib/utils/skills-parser";
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
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ")[1] || "",
    username: session?.user?.username || "",
    image: session?.user?.image || "",
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

  const handleInputChange = (field: string, value: string) => {
    // Convert username to lowercase for consistency
    const processedValue = field === 'username' ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return {
        ...prev,
        skills: newSkills,
      };
    });
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
      // Scroll to top when moving to next step, especially important for mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      // Scroll to top when going back to previous step, especially important for mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push("/onboarding");
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Prepare the payload with detailed logging
      const payload = {
        ...formData,
        username: formData.username.toLowerCase(), // Ensure username is lowercase in API
        skills: stringifySkillsArray(formData.skills),
        // TODO: @tarun - discuss with team, don't send profileCompleted update it in the backend
        profileCompleted: true,
      };

      // Update user profile
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
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
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2'></div>
      </div>
    );
  }

  // If no session, show loading (will redirect)
  if (!session?.user) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2'></div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div className='font-medium text-white/70 text-xs tracking-[0.2em]'>
            OPENTRIBE
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/60">Questions?</span>
            <span className="text-sm text-white/60">Contact</span>
            <Button variant="ghost" size="sm" className="text-white/60">
              <Globe className='mr-1 h-4 w-4' />
              EN
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className='rounded-2xl border border-white/10 bg-zinc-900/95 p-8 backdrop-blur-md'>
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-6 text-white/60 hover:text-white"
          >
            <ChevronLeft className='mr-1 h-4 w-4' />
            Back
          </Button>

          {/* Title */}
          <div className="mb-8">
            <h1 className='mb-2 font-semibold text-2xl text-white'>Profile</h1>
            <p className='text-sm text-white/60'>
              Help us to know about you so that we can have tailored experience.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className='mb-8 flex items-center gap-4'>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStep >= 1 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className='text-white/60 text-xs'>Personal Details</span>
            </div>
            <div className='h-px flex-1 bg-white/20' />
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStep >= 2 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className='text-white/60 text-xs'>
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
                  <Label htmlFor="firstName" className='mb-2 text-white/80'>
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className='mb-2 text-white/80'>
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter your last name"
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                </div>
              </div>

              {/* Avatar */}
              <div>
                <Label className='mb-4 block text-white/80'>
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
                <Label htmlFor="username" className='mb-2 text-white/80'>
                  Username *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Choose a unique username"
                  className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className='mb-2 text-white/80'>
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="City, Country"
                  className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                />
              </div>

              {/* Skills */}
              <div>
                <Label className='mb-2 text-white/80'>
                  Skills *{" "}
                  <span className='text-white/40 text-xs'>
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
                          ? 'border-[#E6007A] bg-[#E6007A] text-white'
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
                <Label htmlFor="walletAddress" className='mb-2 text-white/80'>
                  Wallet Address *
                </Label>
                <Input
                  id="walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) =>
                    handleInputChange("walletAddress", e.target.value)
                  }
                  placeholder="Enter your Polkadot or Kusama address"
                  className='border-white/20 bg-white/5 font-mono text-white placeholder:text-white/40'
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
                <Label className='mb-2 text-white/80'>
                  Social Media Links{" "}
                  <span className='text-white/40 text-xs'>
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
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                  <Input
                    value={formData.twitter}
                    onChange={(e) =>
                      handleInputChange("twitter", e.target.value)
                    }
                    placeholder="Twitter handle"
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                  <Input
                    value={formData.github}
                    onChange={(e) =>
                      handleInputChange("github", e.target.value)
                    }
                    placeholder="GitHub username"
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                  <Input
                    value={formData.linkedin}
                    onChange={(e) =>
                      handleInputChange("linkedin", e.target.value)
                    }
                    placeholder="LinkedIn profile"
                    className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Current Employer */}
              <div>
                <Label htmlFor="employer" className='mb-2 text-white/80'>
                  Current Employer{" "}
                  <span className='text-white/40 text-xs'>(Optional)</span>
                </Label>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) =>
                    handleInputChange("employer", e.target.value)
                  }
                  placeholder="Company name"
                  className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                />
              </div>

              {/* Work Experience */}
              <div>
                <Label htmlFor="workExperience" className='mb-2 text-white/80'>
                  Work Experience{" "}
                  <span className='text-white/40 text-xs'>(Optional)</span>
                </Label>
                <Textarea
                  id="workExperience"
                  value={formData.workExperience}
                  onChange={(e) =>
                    handleInputChange("workExperience", e.target.value)
                  }
                  placeholder="Tell us about your professional experience"
                  rows={4}
                  className='border-white/20 bg-white/5 text-white placeholder:text-white/40'
                />
              </div>

              {/* Crypto Experience */}
              <div>
                <Label className='mb-2 text-white/80'>
                  Crypto Experience *
                </Label>
                <Select
                  value={formData.cryptoExperience}
                  onValueChange={(value) =>
                    handleInputChange("cryptoExperience", value)
                  }
                >
                  <SelectTrigger className='border-white/20 bg-white/5 text-white'>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className='border-white/20 bg-zinc-900'>
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
                <Label className='mb-2 text-white/80'>Work Preference *</Label>
                <Select
                  value={formData.workPreference}
                  onValueChange={(value) =>
                    handleInputChange("workPreference", value)
                  }
                >
                  <SelectTrigger className='border-white/20 bg-white/5 text-white'>
                    <SelectValue placeholder="Select your preferred work type" />
                  </SelectTrigger>
                  <SelectContent className='border-white/20 bg-zinc-900'>
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
          <div className='mt-8 flex items-center justify-between'>
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
              onClick={handleNext}
              disabled={loading}
              className='bg-[#E6007A] px-8 text-white hover:bg-[#E6007A]/90'
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
