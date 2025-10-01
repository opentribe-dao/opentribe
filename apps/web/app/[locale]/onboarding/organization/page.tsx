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
import { ChevronLeft, Contact, Globe, Loader2, Mail, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { useUserProfile } from "@/hooks/use-user-profile";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/hooks/react-query";

const ORGANIZATION_TYPES = [
  { value: "protocol", label: "Protocol" },
  { value: "dao", label: "DAO" },
  { value: "company", label: "Company" },
  { value: "foundation", label: "Foundation" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const INDUSTRIES = [
  { value: "defi", label: "DeFi" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "gaming", label: "Gaming" },
  { value: "nft", label: "NFT" },
  { value: "social", label: "Social" },
  { value: "governance", label: "Governance" },
  { value: "tooling", label: "Developer Tooling" },
  { value: "other", label: "Other" },
];

interface TeamMember {
  id: string;
  name: string;
  email: string | undefined;
  role: "admin" | "member";
}


export default function OrganizationOnboardingPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationOnboardingPageContent />
    </QueryClientProvider>
  );
}

function OrganizationOnboardingPageContent() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1 - Personal Info
    firstName: "",
    lastName: "",
    username: "",
    location: "",
    walletAddress: "",
    website: "",
    twitter: "",
    linkedin: "",

    // Step 2 - Organization Details
    organizationName: "",
    organizationType: "",
    organizationDescription: "",
    organizationWebsite: "",
    organizationLogo: "",
    organizationLocation: "",
    organizationIndustry: "",

    // Step 3 - Team Members
    teamMembers: [] as TeamMember[],
  });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
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
        location: userProfile.location || "",
        walletAddress: userProfile.walletAddress || "",
        website: userProfile.website || "",
        twitter: userProfile.twitter || "",
        linkedin: userProfile.linkedin || "",
      }));

      // If user has completed profile, skip to step 2
      if (userProfile.profileCompleted) {
        setCurrentStep(2);
      }
    }
  }, [userProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: "",
      email: undefined,
      role: "member",
    };
    setFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
    }));
  };

  const updateTeamMember = (
    id: string,
    field: keyof TeamMember,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    }));
  };

  const removeTeamMember = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((member) => member.id !== id),
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
    if (!formData.walletAddress) {
      toast.error("Please enter your wallet address");
      return false;
    }
    if (!formData.website && !formData.twitter && !formData.linkedin) {
      toast.error("Please add at least one social media link");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (
      !formData.organizationName ||
      !formData.organizationType ||
      !formData.organizationDescription
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (!formData.organizationWebsite) {
      toast.error("Please enter your organization website");
      return false;
    }
    if (!formData.organizationLocation || !formData.organizationIndustry) {
      toast.error("Please complete all organization details");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (const member of formData.teamMembers) {
      if (!member.name || !member.email) {
        toast.error("Please complete all team member details");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        toast.error(`Invalid email address: ${member.email}`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Skip validation if user has already completed profile
      if (session?.user?.profileCompleted || validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create organization and update user profile
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userProfile: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              username: formData.username,
              location: formData.location,
              walletAddress: formData.walletAddress,
              website: formData.website,
              twitter: formData.twitter,
              linkedin: formData.linkedin,
              profileCompleted: true,
            },
            organization: {
              name: formData.organizationName,
              type: formData.organizationType,
              description: formData.organizationDescription,
              website: formData.organizationWebsite,
              logo: formData.organizationLogo,
              location: formData.organizationLocation,
              industry: formData.organizationIndustry,
            },
            teamMembers: formData.teamMembers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }

      toast.success("Organization created successfully!");
      // Redirect to dashboard
      const dashboardUrl =
        env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error("Organization creation failed:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || profileLoading) {
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
          <div className="text-sm font-medium font-heading font-bold text-white/70 tracking-[0.2em]">
            OPENTRIBE
          </div>
          <div className="flex items-center mr-4">
            <Button
              variant="outline"
              size="sm"
              className="text-white/60"
              onClick={() => window.open("mailto:support@opentribe.io", "_self")}
            >
              <Mail className="h-4 w-4 mr-1" />
              Contact
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
            <h1 className="text-2xl font-semibold text-white mb-2">
              Tell Us About Your Organization
            </h1>
            <p className="text-white/60 text-sm">
              This information will be displayed on your public profile and help
              us connect you with the right talent.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 1 || session?.user?.profileCompleted
                    ? "bg-[#E6007A]"
                    : "bg-white/20"
                }`}
              />
              {!session?.user?.profileCompleted && (
                <span className="text-xs text-white/60">Personal Details</span>
              )}
            </div>
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 2 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-xs text-white/60">
                Organization Details
              </span>
            </div>
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 3 ? "bg-white" : "bg-white/20"
                }`}
              />
              <span className="text-xs text-white/60">Team Members</span>
            </div>
          </div>

          {/* Form Steps */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {session?.user?.profileCompleted && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                  <p className="text-sm text-white/80">
                    We've pre-filled your personal details from your existing
                    profile. You can update them if needed.
                  </p>
                </div>
              )}
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
                  Your Location *
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
                  placeholder="0x..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
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
              {/* Organization Name */}
              <div>
                <Label
                  htmlFor="organizationName"
                  className="text-white/80 mb-2"
                >
                  Organization Name *
                </Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) =>
                    handleInputChange("organizationName", e.target.value)
                  }
                  placeholder="Enter organization name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Organization Type */}
                <div>
                  <Label className="text-white/80 mb-2">
                    Organization Type *
                  </Label>
                  <Select
                    value={formData.organizationType}
                    onValueChange={(value) =>
                      handleInputChange("organizationType", value)
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/20">
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-white"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div>
                  <Label className="text-white/80 mb-2">Industry *</Label>
                  <Select
                    value={formData.organizationIndustry}
                    onValueChange={(value) =>
                      handleInputChange("organizationIndustry", value)
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/20">
                      {INDUSTRIES.map((industry) => (
                        <SelectItem
                          key={industry.value}
                          value={industry.value}
                          className="text-white"
                        >
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Organization Description */}
              <div>
                <Label
                  htmlFor="organizationDescription"
                  className="text-white/80 mb-2"
                >
                  Organization Description *
                </Label>
                <Textarea
                  id="organizationDescription"
                  value={formData.organizationDescription}
                  onChange={(e) =>
                    handleInputChange("organizationDescription", e.target.value)
                  }
                  placeholder="Tell us about your organization"
                  rows={4}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Organization Website */}
              <div>
                <Label
                  htmlFor="organizationWebsite"
                  className="text-white/80 mb-2"
                >
                  Organization Website *
                </Label>
                <Input
                  id="organizationWebsite"
                  value={formData.organizationWebsite}
                  onChange={(e) =>
                    handleInputChange("organizationWebsite", e.target.value)
                  }
                  placeholder="https://your-organization.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Organization Location */}
              <div>
                <Label
                  htmlFor="organizationLocation"
                  className="text-white/80 mb-2"
                >
                  Organization Location *
                </Label>
                <Input
                  id="organizationLocation"
                  value={formData.organizationLocation}
                  onChange={(e) =>
                    handleInputChange("organizationLocation", e.target.value)
                  }
                  placeholder="City, Country"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <Label className="text-white/80 mb-4 block">
                  Organization Logo{" "}
                  <span className="text-xs text-white/40">(Optional)</span>
                </Label>
                <ImageUpload
                  currentImageUrl={formData.organizationLogo}
                  onImageChange={(url) =>
                    handleInputChange("organizationLogo", url || "")
                  }
                  uploadType="organization-logo"
                  entityId={session?.user?.id}
                  variant="logo"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white/80">
                    Team Members{" "}
                    <span className="text-xs text-white/40">(Optional)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTeamMember}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                {formData.teamMembers.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/60 text-sm mb-3">
                      No team members added yet
                    </p>
                    <p className="text-white/40 text-xs">
                      You can invite team members later from your dashboard
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                value={member.name}
                                onChange={(e) =>
                                  updateTeamMember(
                                    member.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Member name"
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              />
                              <Input
                                value={member.email}
                                onChange={(e) =>
                                  updateTeamMember(
                                    member.id,
                                    "email",
                                    e.target.value
                                  )
                                }
                                placeholder="Email address"
                                type="email"
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              />
                            </div>
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                updateTeamMember(
                                  member.id,
                                  "role",
                                  value as "admin" | "member"
                                )
                              }
                            >
                              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-white/20">
                                <SelectItem
                                  value="admin"
                                  className="text-white"
                                >
                                  Admin
                                </SelectItem>
                                <SelectItem
                                  value="member"
                                  className="text-white"
                                >
                                  Member
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-white/60 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="ghost"
              onClick={() =>
                router.push(
                  env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001"
                )
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
                  Creating...
                </>
              ) : currentStep < 3 ? (
                "Next"
              ) : (
                "Create Organization"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
