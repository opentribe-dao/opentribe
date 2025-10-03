"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { parseSkillsArray, stringifySkillsArray } from "@/lib/utils/skills-parser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { Textarea } from "@packages/base/components/ui/textarea";
import { Switch } from "@packages/base/components/ui/switch";
import { Badge } from "@packages/base/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { ImageUpload } from "@packages/base";
import {
  Camera,
  ChevronLeft,
  Github,
  Globe,
  Linkedin,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Twitter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import Image from "next/image";
import { validateWalletAddress } from "../../lib/validations/wallet";

const SKILLS = [
  "Rust",
  "Substrate",
  "Polkadot SDK",
  "Smart Contracts",
  "ink!",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Web3.js",
  "UI/UX Design",
  "Technical Writing",
  "Marketing",
  "Community Management",
  "DeFi",
  "NFTs",
  "Governance",
  "Research",
  "Data Analysis",
];

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
            skills: parseSkillsArray(user.skill),
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
            private: user.private || false,
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
    } else if (!sessionLoading && !session?.user) {
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
        skills: stringifySkillsArray(formData.skills), // Convert to JSON string for API
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
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className='container relative z-10 mx-auto max-w-4xl px-4 py-12'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <Link
              href={`/profile/${formData.username || session?.user?.id}`}
              className='mb-4 flex items-center gap-2 text-white/60 hover:text-white'
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Profile
            </Link>
            <h1 className='font-bold text-3xl text-white'>Edit Profile</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-white/60">
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div>
                <Label className='mb-4 block text-white'>Profile Picture</Label>
                <ImageUpload
                  currentImageUrl={formData.image}
                  onImageChange={(url) =>
                    setFormData((prev) => ({
                      ...prev,
                      image: url || "",
                    }))
                  }
                  uploadType="profile-avatar"
                  entityId={session?.user?.id}
                  variant="avatar"
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className='mt-2 border-white/10 bg-white/5 text-white'
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className='mt-2 border-white/10 bg-white/5 text-white'
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username" className="text-white">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="johndoe"
                  className='mt-2 border-white/10 bg-white/5 text-white'
                />
                <p className='mt-1 text-white/40 text-xs'>
                  Your unique username for your profile URL
                </p>
              </div>

              {/* Headline */}
              <div>
                <Label htmlFor="headline" className="text-white">
                  Headline
                </Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headline: e.target.value,
                    }))
                  }
                  placeholder="Full Stack Developer | Substrate Enthusiast"
                  maxLength={100}
                  className='mt-2 border-white/10 bg-white/5 text-white'
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="text-white">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className='mt-2 border-white/10 bg-white/5 text-white'
                />
                <p className='mt-1 text-white/40 text-xs'>
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-white">
                  Location
                </Label>
                <div className="relative mt-2">
                  <MapPin className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="San Francisco, CA"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="private" className="text-white">
                    Private Profile
                  </Label>
                  <p className="text-sm text-white/60">
                    Only show basic information to other users
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={formData.private}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, private: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
            <CardHeader>
              <CardTitle className="text-white">Skills</CardTitle>
              <CardDescription className="text-white/60">
                Add your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className='border-0 bg-[#E6007A]/20 text-[#FFFFFF]'
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.filter((s) => !formData.skills.includes(s)).map(
                    (skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                        onClick={() => addSkill(skill)}
                      >
                        <Plus className='mr-1 h-3 w-3' />
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
            <CardHeader>
              <CardTitle className="text-white">Work Information</CardTitle>
              <CardDescription className="text-white/60">
                Tell us about your work experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="employer" className="text-white">
                  Current Employer
                </Label>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employer: e.target.value,
                    }))
                  }
                  placeholder="Parity Technologies"
                  className='mt-2 border-white/10 bg-white/5 text-white'
                />
              </div>

              <div>
                <Label htmlFor="workExperience" className="text-white">
                  Work Experience
                </Label>
                <Textarea
                  id="workExperience"
                  value={formData.workExperience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: e.target.value,
                    }))
                  }
                  placeholder="Describe your professional experience..."
                  rows={3}
                  className='mt-2 border-white/10 bg-white/5 text-white'
                />
              </div>

              <div>
                <Label htmlFor="cryptoExperience" className="text-white">
                  Crypto Experience Level
                </Label>
                <Select
                  value={formData.cryptoExperience}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      cryptoExperience: value,
                    }))
                  }
                >
                  <SelectTrigger className='mt-2 border-white/10 bg-white/5 text-white'>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className='border-white/10 bg-zinc-900'>
                    {CRYPTO_EXPERIENCE.map((level) => (
                      <SelectItem
                        key={level}
                        value={level}
                        className="text-white"
                      >
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="workPreference" className="text-white">
                  Work Preference
                </Label>
                <Select
                  value={formData.workPreference}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      workPreference: value,
                    }))
                  }
                >
                  <SelectTrigger className='mt-2 border-white/10 bg-white/5 text-white'>
                    <SelectValue placeholder="Select your work preference" />
                  </SelectTrigger>
                  <SelectContent className='border-white/10 bg-zinc-900'>
                    {WORK_PREFERENCES.map((pref) => (
                      <SelectItem
                        key={pref}
                        value={pref}
                        className="text-white"
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
          <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
            <CardHeader>
              <CardTitle className="text-white">Social Links</CardTitle>
              <CardDescription className="text-white/60">
                Connect your social profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="twitter" className="text-white">
                  Twitter
                </Label>
                <div className="relative mt-2">
                  <Twitter className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        twitter: e.target.value,
                      }))
                    }
                    placeholder="username"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="github" className="text-white">
                  GitHub
                </Label>
                <div className="relative mt-2">
                  <Github className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        github: e.target.value,
                      }))
                    }
                    placeholder="username"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="linkedin" className="text-white">
                  LinkedIn
                </Label>
                <div className="relative mt-2">
                  <Linkedin className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    placeholder="username"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="text-white">
                  Website
                </Label>
                <div className="relative mt-2">
                  <Globe className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telegram" className="text-white">
                  Telegram
                </Label>
                <div className="relative mt-2">
                  <Send className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                  <Input
                    id="telegram"
                    value={formData.telegram}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telegram: e.target.value,
                      }))
                    }
                    placeholder="username"
                    className='border-white/10 bg-white/5 pl-10 text-white'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web3 Information */}
          <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
            <CardHeader>
              <CardTitle className="text-white">Web3 Information</CardTitle>
              <CardDescription className="text-white/60">
                Your blockchain identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="walletAddress" className="text-white">
                  Wallet Address
                </Label>
                <Input
                  id="walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      walletAddress: e.target.value,
                    }))
                  }
                  placeholder="Enter your Polkadot or Kusama address"
                  className='mt-2 border-white/10 bg-white/5 font-mono text-white'
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
                  <p className='mt-1 text-white/40 text-xs'>
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
                type="button"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className='bg-[#E6007A] text-white hover:bg-[#E6007A]/90'
            >
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
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
