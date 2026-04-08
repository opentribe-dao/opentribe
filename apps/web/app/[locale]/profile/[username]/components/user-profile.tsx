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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import { getSkillLabel } from "@packages/base/lib/skills";
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Edit,
  FileText,
  Github,
  Globe,
  Linkedin,
  Lock,
  MapPin,
  Send,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { env } from "@/env";

interface UserProfileData {
  id: string;
  name: string;
  username?: string;
  image?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  walletAddress?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  telegram?: string;
  discord?: string;
  employer?: string;
  workExperience?: string;
  cryptoExperience?: string;
  workPreference?: string;
  profileCompleted: boolean;
  private?: boolean;
  createdAt: string;
  email?: string;
  isOwnProfile?: boolean;
  members?: Array<{
    organization: {
      id: string;
      name: string;
      slug: string;
      logo?: string;
    };
    role: string;
  }>;
  applications?: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    grant: {
      id: string;
      slug: string;
      title: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
  }>;
  submissions?: Array<{
    id: string;
    title?: string;
    status: string;
    isWinner?: boolean;
    position?: number;
    createdAt: string;
    bounty: {
      id: string;
      slug: string;
      title: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
  }>;
  wonSubmissions?: Array<{
    id: string;
    title?: string;
    position?: number;
    winningAmount?: string;
    bounty: {
      id: string;
      slug: string;
      title: string;
      token: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
  }>;
}

interface UserProfileStats {
  totalApplications: number;
  totalSubmissions: number;
  totalWins: number;
  organizations: number;
}

interface UserProfileProps {
  profile: UserProfileData;
  stats: UserProfileStats | null;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

const getStatusColor = (status: string) => {
  switch (status) {
    case "SPAM":
      return "bg-red-500/20 text-red-400 border-0";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-yellow-500/20 text-yellow-400 border-0";
    default:
      return "bg-white/10 text-white/60 border-0";
  }
};

export function UserProfile({ profile: initialProfile, stats: initialStats }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const [profile, setProfile] = useState(initialProfile);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(!initialProfile?.applications);

  // Fetch full profile data with applications/submissions if not provided
  useEffect(() => {
    if (initialProfile?.applications) {
      setLoading(false);
      return;
    }
    const username = initialProfile?.username;
    if (!username) {
      setLoading(false);
      return;
    }
    async function fetchFullProfile() {
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/users/${username}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          const fullProfile = data.user || data;
          setProfile((prev: any) => ({
            ...prev,
            ...fullProfile,
            // Keep server-provided fields that the user API might not have
            claimableProfile: prev?.claimableProfile,
            claimedProfiles: prev?.claimedProfiles,
          }));
          if (data.stats) setStats(data.stats);
          else {
            setStats({
              totalApplications: (fullProfile.applications || []).length,
              totalSubmissions: (fullProfile.submissions || []).length,
              totalWins: (fullProfile.wonSubmissions || []).length,
              organizations: (fullProfile.members || []).length,
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch full profile:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchFullProfile();
  }, [initialProfile]);

  const isOwnProfile = profile?.isOwnProfile ?? false;
  const isPrivateProfile = profile?.private && !isOwnProfile;
  const claimableProfile = (profile as any)?.claimableProfile;

  return (
    <div className="min-h-screen">
      <div className="container relative z-10 mx-auto px-4 py-12">
        {/* Claimable ecosystem profile banner */}
        {claimableProfile && (
          <div className="mb-6 rounded-xl border border-[#E6007A]/30 bg-[#E6007A]/10 p-4 backdrop-blur-md">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium text-white">
                  An ecosystem profile matching your username was found
                </p>
                <p className="text-sm text-white/60">
                  Claim it to link your {claimableProfile.source?.replace(/_/g, " ")} contributions to your account.
                </p>
              </div>
              <a
                href={`/profile/claim/${claimableProfile.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E6007A] px-4 py-2 text-sm font-medium text-white hover:bg-[#E6007A]/90"
              >
                Claim Profile
              </a>
            </div>
          </div>
        )}
        {/* Profile Header */}
        <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.image ? (
                  <Image
                    alt={profile.name}
                    className="h-30 w-30 rounded-full"
                    height={120}
                    src={profile.image || ""}
                    width={120}
                  />
                ) : (
                  <div className="flex h-30 w-30 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-4xl text-white">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="mb-2 font-bold text-3xl text-white">
                      {profile.name}
                    </h1>
                    {profile.username ? (
                      <p className="mb-3 text-white/60">@{profile.username}</p>
                    ) : (
                      <p className="mb-3 text-sm text-white/40">
                        No username set
                      </p>
                    )}
                    {profile.headline && (
                      <p className="mb-4 text-lg text-white/80">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Link href="/profile/edit">
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        variant="outline"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && !isPrivateProfile && (
                  <p className="mb-4 max-w-3xl text-white/70">{profile.bio}</p>
                )}

                {/* Location and Links */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-1 text-white/60">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.employer && !isPrivateProfile && (
                    <div className="flex items-center gap-1 text-white/60">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.employer}</span>
                    </div>
                  )}
                  {profile.createdAt && (
                    <div className="flex items-center gap-1 text-white/60">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(profile.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {!isPrivateProfile && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {profile.twitter && (
                      <a
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                        href={`https://twitter.com/${profile.twitter}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Twitter className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.github && (
                      <a
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                        href={`https://github.com/${profile.github}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Github className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.linkedin && (
                      <a
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                        href={`https://linkedin.com/in/${profile.linkedin}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Linkedin className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.website && (
                      <a
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                        href={profile.website}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Globe className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.telegram && (
                      <a
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                        href={`https://t.me/${profile.telegram}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && !isPrivateProfile && (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="font-bold text-2xl text-white">
                    {stats.totalApplications}
                  </p>
                  <p className="text-sm text-white/60">Applications</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="font-bold text-2xl text-white">
                    {stats.totalSubmissions}
                  </p>
                  <p className="text-sm text-white/60">Submissions</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="font-bold text-2xl text-white">
                    {stats.totalWins}
                  </p>
                  <p className="text-sm text-white/60">Wins</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="font-bold text-2xl text-white">
                    {stats.organizations}
                  </p>
                  <p className="text-sm text-white/60">Organizations</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Private Profile Message */}
        {isPrivateProfile ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="p-12 text-center">
              <Lock className="mx-auto mb-4 h-16 w-16 text-white/40" />
              <h2 className="mb-2 font-semibold text-2xl text-white">
                This Profile is Private
              </h2>
              <p className="text-white/60">
                This user has chosen to keep their profile private.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Skills & Organizations */}
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

              {/* Organizations */}
              {profile.members && profile.members.length > 0 && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-white">Organizations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.members.map((member) => (
                      <div
                        className="flex items-center gap-3"
                        key={member.organization.id}
                      >
                        {member.organization.logo ? (
                          <img
                            alt={member.organization.name}
                            className="h-10 w-10 rounded-full"
                            src={member.organization.logo}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                            <Building2 className="h-5 w-5 text-white/60" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {member.organization.name}
                          </p>
                          <p className="text-white/60 text-xs capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Activity */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs onValueChange={setActiveTab} value={activeTab}>
                    <TabsList className="border-white/20 bg-white/10">
                      <TabsTrigger
                        className="data-[state=active]:bg-white/20"
                        value="activity"
                      >
                        All Activity
                      </TabsTrigger>
                      <TabsTrigger
                        className="data-[state=active]:bg-white/20"
                        value="applications"
                      >
                        Applications
                      </TabsTrigger>
                      <TabsTrigger
                        className="data-[state=active]:bg-white/20"
                        value="submissions"
                      >
                        Submissions
                      </TabsTrigger>
                      <TabsTrigger
                        className="data-[state=active]:bg-white/20"
                        value="wins"
                      >
                        Wins
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent className="mt-6 space-y-4" value="activity">
                      {[
                        ...(profile.applications || []).map((app) => ({
                          ...app,
                          type: "application",
                        })),
                        ...(profile.submissions || []).map((sub) => ({
                          ...sub,
                          type: "submission",
                        })),
                      ]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .slice(0, 10)
                        .map((item: any) => (
                          <div
                            className="rounded-lg bg-white/5 p-4"
                            key={`${item.type}-${item.id}`}
                          >
                            <Link
                              className="block"
                              href={
                                item.type === "application"
                                  ? `/grants/${item.grant?.slug || item.grant?.id || item.grantId || "#"}`
                                  : `/bounties/${item.bounty?.slug || item.bounty?.id || item.bountyId || "#"}`
                              }
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="rounded-lg bg-white/10 p-2">
                                    {item.type === "application" ? (
                                      <FileText className="h-4 w-4 text-white" />
                                    ) : (
                                      <Award className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">
                                      {item.title ||
                                        (item.type === "application"
                                          ? item.grant?.title
                                          : item.bounty?.title) ||
                                        "Untitled"}
                                    </p>
                                    <p className="text-sm text-white/60">
                                      {item.type === "application"
                                        ? `Applied to ${item.grant?.organization?.name || item.grant?.title || "Grant"}`
                                        : `Submitted to ${item.bounty?.organization?.name || item.bounty?.title || "Bounty"}`}
                                    </p>
                                    <p className="mt-1 text-white/40 text-xs">
                                      {formatDate(item.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </div>
                            </Link>
                          </div>
                        ))}
                    </TabsContent>

                    <TabsContent
                      className="mt-6 space-y-4"
                      value="applications"
                    >
                      {profile.applications &&
                      profile.applications.length > 0 ? (
                        profile.applications.map((app) => (
                          <Link
                            className="block"
                            href={`/grants/${app.grant.slug || app.grant.id}/`}
                            key={app.id}
                          >
                            <div className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    {app.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {app.grant.title} •{" "}
                                    {app.grant.organization.name}
                                  </p>
                                  <p className="mt-1 text-white/40 text-xs">
                                    {formatDate(app.createdAt)}
                                  </p>
                                </div>
                                <Badge className={getStatusColor(app.status)}>
                                  {app.status}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="py-8 text-center text-white/60">
                          No applications yet
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent className="mt-6 space-y-4" value="submissions">
                      {profile.submissions && profile.submissions.length > 0 ? (
                        profile.submissions.map((sub) => (
                          <Link
                            className="block"
                            href={`/bounties/${sub.bounty.slug || sub.bounty.id}/submissions/${sub.id}`}
                            key={sub.id}
                          >
                            <div className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    {sub.title || sub.bounty.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {sub.bounty.organization.name}
                                  </p>
                                  <p className="mt-1 text-white/40 text-xs">
                                    {formatDate(sub.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {sub.isWinner && (
                                    <Badge className="border-0 bg-yellow-500/20 text-yellow-400">
                                      #{sub.position} Winner
                                    </Badge>
                                  )}
                                  <Badge className={getStatusColor(sub.status)}>
                                    {sub.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="py-8 text-center text-white/60">
                          No submissions yet
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent className="mt-6 space-y-4" value="wins">
                      {profile.wonSubmissions &&
                      profile.wonSubmissions.length > 0 ? (
                        profile.wonSubmissions.map((win) => (
                          <Link
                            className="block"
                            href={`/bounties/${win.bounty.slug || win.bounty.id}/submissions/${win.id}`}
                            key={win.id}
                          >
                            <div className="rounded-lg border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-green-500/10 p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    {win.title || win.bounty.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {win.bounty.organization.name}
                                  </p>
                                  {win.winningAmount && (
                                    <p className="mt-2 font-semibold text-green-400 text-lg">
                                      {win.winningAmount} {win.bounty.token}
                                    </p>
                                  )}
                                </div>
                                <Badge className="border-0 bg-yellow-500/20 text-yellow-400">
                                  #{win.position} Place
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="py-8 text-center text-white/60">
                          No wins yet
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Ecosystem Contributions — only show for contributions
                  NOT already backfilled into the Activity section */}
              {(() => {
                const claimedProfiles = (profile as any)?.claimedProfiles || [];
                const backfilledAppIds = new Set(
                  (profile.applications || []).map((a: any) => a.id)
                );
                const unshownContributions = claimedProfiles.flatMap((ep: any) =>
                  (ep.contributions || []).filter(
                    (c: any) => c.grantApplication && !backfilledAppIds.has(c.grantApplication.id)
                  ).map((c: any) => ({ ...c, source: ep.source }))
                );
                if (unshownContributions.length === 0) return null;
                return (
                  <Card className="mt-6 border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Ecosystem Contributions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {unshownContributions.map((c: any) => (
                        <div
                          key={c.id || c.grantApplication?.id}
                          className="rounded-lg bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-[#E6007A]/20 p-2">
                                <FileText className="h-4 w-4 text-[#E6007A]" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {c.grantApplication?.title || "Grant Application"}
                                </p>
                                <p className="text-sm text-white/60">
                                  {c.grantApplication?.grant?.title || c.source?.replace(/_/g, " ")}
                                  {" · "}{c.role?.replace(/_/g, " ")}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-0">
                              {c.grantApplication?.status || "VERIFIED"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
