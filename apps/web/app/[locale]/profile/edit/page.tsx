"use client";

import { useSession } from "@packages/auth/client";
import { ImageUpload } from "@packages/base";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
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
import { Switch } from "@packages/base/components/ui/switch";
import { Textarea } from "@packages/base/components/ui/textarea";
import {
  ChevronLeft,
  Github,
  Globe,
  Linkedin,
  Loader2,
  MapPin,
  Save,
  Send,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { validateWalletAddress } from "../../lib/validations/wallet";

const WORK_PREFERENCES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];

const CRYPTO_EXPERIENCE = ["Beginner", "Intermediate", "Advanced", "Expert"];

const EditProfilePage = () => {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    image: "",
    headline: "",
    bio: "",
    location: "",
    skills: [] as string[],
    interests: [] as string[],
    walletAddress: "",
    twitter: "",
    github: "",
    linkedin: "",
    website: "",
    telegram: "",
    discord: "",
    employer: "",
    workExperience: "",
    cryptoExperience: "",
    workPreference: "",
    private: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/users/${session.user.id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            username: user.username || "",
            image: user.image || "",
            headline: user.headline || "",
            bio: user.bio || "",
            location: user.location || "",
            skills: user.skills || [],
            interests: user.interests || [],
            walletAddress: user.walletAddress || "",
            twitter: user.twitter || "",
            github: user.github || "",
            linkedin: user.linkedin || "",
            website: user.website || "",
            telegram: user.telegram || "",
            discord: user.discord || "",
            employer: user.employer || "",
            workExperience: user.workExperience || "",
            cryptoExperience: user.cryptoExperience || "",
            workPreference: user.workPreference || "",
            private: user.private,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (!sessionLoading && session?.user) {
      fetchProfile();
    } else if (!(sessionLoading || session?.user)) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) return;

    // Validate wallet address if provided
    if (formData.walletAddress) {
      const walletValidation = validateWalletAddress(formData.walletAddress);
      if (!walletValidation.isValid) {
        toast.error(walletValidation.error || "Invalid wallet address");
        return;
      }
    }

    try {
      setSaving(true);

      // Prepare the data for submission
      const submitData = {
        ...formData,
        skills: formData.skills,
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/users/${session.user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      router.push(`/profile/${formData.username || session.user.id}`);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              className="mb-4 flex items-center gap-2 text-white/60 hover:text-white"
              href={`/profile/${formData.username || session?.user?.id}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Profile
            </Link>
            <h1 className="font-bold text-3xl text-white">Edit Profile</h1>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-white/60">
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div>
                <Label className="mb-4 block text-white">Profile Picture</Label>
                <ImageUpload
                  currentImageUrl={formData.image}
                  entityId={session?.user?.id}
                  onImageChange={(url) =>
                    setFormData((prev) => ({
                      ...prev,
                      image: url || "",
                    }))
                  }
                  uploadType="profile-avatar"
                  variant="avatar"
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 text-white" htmlFor="firstName">
                    First Name
                  </Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    id="firstName"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    value={formData.firstName}
                  />
                </div>
                <div>
                  <Label className="mb-2 text-white" htmlFor="lastName">
                    Last Name
                  </Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    id="lastName"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    value={formData.lastName}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <Label className="mb-2 text-white" htmlFor="username">
                  Username
                </Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  id="username"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="johndoe"
                  value={formData.username}
                />
                <p className="mt-1 text-white/40 text-xs">
                  Your unique username for your profile URL
                </p>
              </div>

              {/* Headline */}
              <div>
                <Label className="mb-2 text-white" htmlFor="headline">
                  Headline
                </Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  id="headline"
                  maxLength={100}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headline: e.target.value,
                    }))
                  }
                  placeholder="Full Stack Developer | Substrate Enthusiast"
                  value={formData.headline}
                />
              </div>

              {/* Bio */}
              <div>
                <Label className="text-white" htmlFor="bio">
                  Bio
                </Label>
                <Textarea
                  className="mt-2 border-white/10 bg-white/5 text-white"
                  id="bio"
                  maxLength={500}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={formData.bio}
                />
                <p className="mt-1 text-white/40 text-xs">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <Label className="text-white" htmlFor="location">
                  Location
                </Label>
                <div className="relative mt-2">
                  <MapPin className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="location"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="San Francisco, CA"
                    value={formData.location}
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white" htmlFor="private">
                    Private Profile
                  </Label>
                  <p className="text-sm text-white/60">
                    Only show basic information to other users
                  </p>
                </div>
                <Switch
                  checked={formData.private}
                  id="private"
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, private: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Skills</CardTitle>
              <CardDescription className="text-white/60">
                Add your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Work Information</CardTitle>
              <CardDescription className="text-white/60">
                Tell us about your work experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 text-white" htmlFor="employer">
                  Current Employer
                </Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  id="employer"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employer: e.target.value,
                    }))
                  }
                  placeholder="Parity Technologies"
                  value={formData.employer}
                />
              </div>

              <div>
                <Label className="text-white" htmlFor="workExperience">
                  Work Experience
                </Label>
                <Textarea
                  className="mt-2 border-white/10 bg-white/5 text-white"
                  id="workExperience"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: e.target.value,
                    }))
                  }
                  placeholder="Describe your professional experience..."
                  rows={3}
                  value={formData.workExperience}
                />
              </div>

              <div>
                <Label className="text-white" htmlFor="cryptoExperience">
                  Crypto Experience Level
                </Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      cryptoExperience: value,
                    }))
                  }
                  value={formData.cryptoExperience}
                >
                  <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-900">
                    {CRYPTO_EXPERIENCE.map((level) => (
                      <SelectItem
                        className="text-white"
                        key={level}
                        value={level}
                      >
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white" htmlFor="workPreference">
                  Work Preference
                </Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      workPreference: value,
                    }))
                  }
                  value={formData.workPreference}
                >
                  <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select your work preference" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-900">
                    {WORK_PREFERENCES.map((pref) => (
                      <SelectItem
                        className="text-white"
                        key={pref}
                        value={pref}
                      >
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Social Links</CardTitle>
              <CardDescription className="text-white/60">
                Connect your social profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white" htmlFor="twitter">
                  Twitter
                </Label>
                <div className="relative mt-2">
                  <Twitter className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="twitter"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        twitter: e.target.value,
                      }))
                    }
                    placeholder="username"
                    value={formData.twitter}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white" htmlFor="github">
                  GitHub
                </Label>
                <div className="relative mt-2">
                  <Github className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="github"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        github: e.target.value,
                      }))
                    }
                    placeholder="username"
                    value={formData.github}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white" htmlFor="linkedin">
                  LinkedIn
                </Label>
                <div className="relative mt-2">
                  <Linkedin className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="linkedin"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    placeholder="username"
                    value={formData.linkedin}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white" htmlFor="website">
                  Website
                </Label>
                <div className="relative mt-2">
                  <Globe className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="website"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                    type="url"
                    value={formData.website}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white" htmlFor="telegram">
                  Telegram
                </Label>
                <div className="relative mt-2">
                  <Send className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    id="telegram"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telegram: e.target.value,
                      }))
                    }
                    placeholder="username"
                    value={formData.telegram}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web3 Information */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Web3 Information</CardTitle>
              <CardDescription className="text-white/60">
                Your blockchain identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="mb-2 text-white" htmlFor="walletAddress">
                  Wallet Address
                </Label>
                <Input
                  className="border-white/10 bg-white/5 font-mono text-white"
                  id="walletAddress"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      walletAddress: e.target.value,
                    }))
                  }
                  placeholder="Enter your Polkadot or Kusama address"
                  value={formData.walletAddress}
                />
                {formData.walletAddress ? (
                  <p
                    className={`mt-1 text-xs ${
                      validateWalletAddress(formData.walletAddress).isValid
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}
                  >
                    {validateWalletAddress(formData.walletAddress).isValid
                      ? `✓ Valid ${
                          validateWalletAddress(formData.walletAddress).network
                        } address`
                      : validateWalletAddress(formData.walletAddress).error}
                  </p>
                ) : (
                  <p className="mt-1 text-white/40 text-xs">
                    Your Polkadot, Kusama, or Substrate wallet address
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/profile/${formData.username || session?.user?.id}`}>
              <Button
                className="border-white/20 text-white hover:bg-white/10"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </Link>
            <Button
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
