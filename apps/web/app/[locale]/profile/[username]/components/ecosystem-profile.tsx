"use client";

import { useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { getSkillLabel } from "@packages/base/lib/skills";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Twitter,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { env } from "@/env";

interface Contribution {
  id: string;
  title: string;
  role?: string;
  status: string;
  milestoneCount?: number;
  completedMilestones?: number;
  grant?: {
    id: string;
    slug: string;
    title: string;
    organization?: {
      name: string;
      logo?: string;
    };
  };
}

interface EcosystemProfileData {
  id: string;
  slug: string;
  displayName: string;
  bio?: string | null;
  skills?: string[];
  location?: string | null;
  github?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  website?: string | null;
  image?: string | null;
  source?: string | null;
  contributions?: Contribution[];
  claimedByUserId?: string | null;
}

interface EcosystemProfileProps {
  profile: EcosystemProfileData;
}

type ClaimUIState = "unclaimed" | "own_profile" | "pending" | "loading";

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getStatusColor = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
      return "bg-green-500/20 text-green-400 border-0";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-yellow-500/20 text-yellow-400 border-0";
    case "REJECTED":
    case "SPAM":
      return "bg-red-500/20 text-red-400 border-0";
    default:
      return "bg-white/10 text-white/60 border-0";
  }
};

export function EcosystemProfile({ profile }: EcosystemProfileProps) {
  const { data: session } = useSession();
  const [claimUIState, setClaimUIState] = useState<ClaimUIState>("loading");

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Check claim status for the current user
  useEffect(() => {
    async function checkClaimStatus() {
      // If profile is already claimed
      if (profile.claimedByUserId) {
        // Check if it's the current user's profile
        if (session?.user && profile.claimedByUserId === session.user.id) {
          setClaimUIState("own_profile");
        } else {
          // Claimed by someone else - don't show CTA
          setClaimUIState("unclaimed"); // Will be hidden because claimedByUserId is set
        }
        return;
      }

      // Profile not claimed - check if user has a pending claim
      if (session?.user && profile.id) {
        try {
          const res = await fetch(
            `${env.NEXT_PUBLIC_API_URL}/api/v1/ecosystem/profiles/${profile.id}/claim`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            const pendingClaim = data.claims?.find(
              (c: any) => c.status === "PENDING"
            );
            const verifiedClaim = data.claims?.find(
              (c: any) => c.status === "VERIFIED"
            );
            if (verifiedClaim) {
              setClaimUIState("own_profile");
            } else if (pendingClaim) {
              setClaimUIState("pending");
            } else {
              setClaimUIState("unclaimed");
            }
            return;
          }
        } catch {
          // Silently fail - just show default state
        }
      }

      setClaimUIState("unclaimed");
    }

    checkClaimStatus();
  }, [session, profile.id, profile.claimedByUserId]);

  return (
    <div className="min-h-screen">
      <div className="container relative z-10 mx-auto px-4 py-12">
        {/* Profile Header */}
        <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.image ? (
                  <img
                    alt={profile.displayName}
                    className="h-30 w-30 rounded-full"
                    height={120}
                    src={profile.image}
                    width={120}
                  />
                ) : (
                  <div className="flex h-30 w-30 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-4xl text-white">
                    {initials}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h1 className="font-bold text-3xl text-white">
                        {profile.displayName}
                      </h1>
                      {profile.source && (
                        <Badge
                          className="border-0 bg-purple-500/20 text-purple-300"
                          variant="secondary"
                        >
                          {profile.source}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 text-white/60">@{profile.slug}</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mb-4 max-w-3xl text-white/70">{profile.bio}</p>
                )}

                {/* Location */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-1 text-white/60">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {profile.twitter && (
                    <a
                      className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      href={
                        profile.twitter.startsWith("http")
                          ? profile.twitter
                          : `https://twitter.com/${profile.twitter}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Twitter className="h-4 w-4 text-white" />
                    </a>
                  )}
                  {profile.github && (
                    <a
                      className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      href={
                        profile.github.startsWith("http")
                          ? profile.github
                          : `https://github.com/${profile.github}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Github className="h-4 w-4 text-white" />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      href={
                        profile.linkedin.startsWith("http")
                          ? profile.linkedin
                          : `https://linkedin.com/in/${profile.linkedin}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Linkedin className="h-4 w-4 text-white" />
                    </a>
                  )}
                  {profile.website && (
                    <a
                      className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Globe className="h-4 w-4 text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Skills & Claim CTA */}
          <div className="space-y-6">
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        className="border-0 bg-[#E6007A]/20 text-[#FFFFFF]"
                        key={skill}
                        variant="secondary"
                      >
                        {getSkillLabel(skill)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Claim Profile CTA - Unclaimed */}
            {!profile.claimedByUserId && claimUIState === "unclaimed" && (
              <Card className="border-[#E6007A]/30 bg-gradient-to-br from-[#E6007A]/10 to-purple-600/10 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-[#E6007A]/20 p-2">
                      <UserCheck className="h-5 w-5 text-[#E6007A]" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">
                      Is this you?
                    </h3>
                  </div>
                  <p className="mb-4 text-sm text-white/70">
                    Claim this profile to link your ecosystem contributions to
                    your Opentribe account and build your reputation.
                  </p>
                  <Link href={`/profile/claim/${profile.slug}`}>
                    <Button className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Claim this profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Own Profile - Already claimed by this user */}
            {claimUIState === "own_profile" && (
              <Card className="border-green-500/30 bg-green-500/5 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/20 p-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        This is your profile
                      </h3>
                      <p className="text-sm text-white/60">
                        This ecosystem profile is linked to your account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Claim */}
            {claimUIState === "pending" && (
              <Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-yellow-500/20 p-2">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        Claim pending review
                      </h3>
                      <p className="text-sm text-white/60">
                        Your claim for this profile is being reviewed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contributions */}
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.contributions && profile.contributions.length > 0 ? (
                  <div className="space-y-4">
                    {profile.contributions.map((contribution) => (
                      <div
                        className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                        key={contribution.id}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-white/10 p-2">
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {contribution.title}
                              </p>
                              {contribution.grant && (
                                <Link
                                  className="text-sm text-[#E6007A] hover:underline"
                                  href={`/grants/${contribution.grant.slug || contribution.grant.id}`}
                                >
                                  {contribution.grant.title}
                                  {contribution.grant.organization && (
                                    <span className="text-white/60">
                                      {" "}
                                      - {contribution.grant.organization.name}
                                    </span>
                                  )}
                                </Link>
                              )}
                              {contribution.role && (
                                <p className="mt-1 text-white/50 text-xs">
                                  Role: {contribution.role}
                                </p>
                              )}
                              {contribution.milestoneCount != null &&
                                contribution.milestoneCount > 0 && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 rounded-full bg-white/10">
                                      <div
                                        className="h-1.5 rounded-full bg-[#E6007A]"
                                        style={{
                                          width: `${((contribution.completedMilestones || 0) / contribution.milestoneCount) * 100}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-white/50 text-xs">
                                      {contribution.completedMilestones || 0}/
                                      {contribution.milestoneCount} milestones
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                          <Badge
                            className={getStatusColor(contribution.status)}
                          >
                            {formatStatus(contribution.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-white/60">
                    No contributions recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
