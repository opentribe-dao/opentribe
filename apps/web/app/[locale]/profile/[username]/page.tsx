"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Badge } from "@packages/base/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/base/components/ui/tabs";
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Edit,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Twitter,
  Github,
  Linkedin,
  Send,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { env } from "@/env";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  image?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: any;
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
  email?: string; // Only visible to profile owner
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
      title: string;
      token: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
  }>;
}

interface Stats {
  totalApplications: number;
  totalSubmissions: number;
  totalWins: number;
  organizations: number;
}

const ProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // First try to find user by username (which could be username or ID)
        const usersResponse = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/users?username=${params.username}`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!usersResponse.ok) {
          throw new Error("User not found");
        }

        const usersData = await usersResponse.json();
        if (!usersData.users || usersData.users.length === 0) {
          throw new Error("User not found");
        }

        const userId = usersData.users[0].id;

        // Then fetch full profile
        const profileResponse = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}`,
          {
            credentials: "include",
          }
        );

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({}));
          console.error("Profile fetch error:", profileResponse.status, errorData);
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const profileData = await profileResponse.json();
        setProfile(profileData.user);
        setStats(profileData.stats);
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (params.username) {
      fetchProfile();
    }
  }, [params.username, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = profile.isOwnProfile;
  const isPrivateProfile = profile.private && !isOwnProfile;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const getSkillsArray = (skills: any) => {
    if (Array.isArray(skills)) return skills;
    if (typeof skills === "object" && skills !== null) {
      return Object.keys(skills);
    }
    return [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "WINNER":
        return "bg-green-500/20 text-green-400 border-0";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-0";
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400 border-0";
      default:
        return "bg-white/10 text-white/60 border-0";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Profile Header */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatarUrl || profile.image ? (
                  <Image
                    src={profile.avatarUrl || profile.image || ""}
                    alt={profile.name}
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-full"
                  />
                ) : (
                  <div className="w-30 h-30 rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
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
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profile.name}
                    </h1>
                    {profile.username ? (
                      <p className="text-white/60 mb-3">@{profile.username}</p>
                    ) : (
                      <p className="text-white/40 mb-3 text-sm">No username set</p>
                    )}
                    {profile.headline && (
                      <p className="text-lg text-white/80 mb-4">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Link href="/profile/edit">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && !isPrivateProfile && (
                  <p className="text-white/70 mb-4 max-w-3xl">{profile.bio}</p>
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
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {profile.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Twitter className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.github && (
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Github className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Linkedin className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Globe className="h-4 w-4 text-white" />
                      </a>
                    )}
                    {profile.telegram && (
                      <a
                        href={`https://t.me/${profile.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalApplications}</p>
                  <p className="text-sm text-white/60">Applications</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
                  <p className="text-sm text-white/60">Submissions</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalWins}</p>
                  <p className="text-sm text-white/60">Wins</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.organizations}</p>
                  <p className="text-sm text-white/60">Organizations</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Private Profile Message */}
        {isPrivateProfile ? (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-12 text-center">
              <Lock className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">
                This Profile is Private
              </h2>
              <p className="text-white/60">
                This user has chosen to keep their profile private.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Skills & Organizations */}
            <div className="space-y-6">
              {/* Skills */}
              {profile.skills && getSkillsArray(profile.skills).length > 0 && (
                <Card className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getSkillsArray(profile.skills).map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-[#E6007A]/20 text-[#E6007A] border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Organizations */}
              {profile.members && profile.members.length > 0 && (
                <Card className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Organizations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.members.map((member) => (
                      <div
                        key={member.organization.id}
                        className="flex items-center gap-3"
                      >
                        {member.organization.logo ? (
                          <img
                            src={member.organization.logo}
                            alt={member.organization.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white/60" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {member.organization.name}
                          </p>
                          <p className="text-xs text-white/60 capitalize">
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
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white/10 border-white/20">
                      <TabsTrigger
                        value="activity"
                        className="data-[state=active]:bg-white/20"
                      >
                        All Activity
                      </TabsTrigger>
                      <TabsTrigger
                        value="applications"
                        className="data-[state=active]:bg-white/20"
                      >
                        Applications
                      </TabsTrigger>
                      <TabsTrigger
                        value="submissions"
                        className="data-[state=active]:bg-white/20"
                      >
                        Submissions
                      </TabsTrigger>
                      <TabsTrigger
                        value="wins"
                        className="data-[state=active]:bg-white/20"
                      >
                        Wins
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="mt-6 space-y-4">
                      {/* Combined activity feed */}
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
                            key={`${item.type}-${item.id}`}
                            className="bg-white/5 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                  {item.type === "application" ? (
                                    <FileText className="h-4 w-4 text-white" />
                                  ) : (
                                    <Award className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-white font-medium">
                                    {item.title ||
                                      (item.type === "application"
                                        ? item.grant.title
                                        : item.bounty.title)}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {item.type === "application"
                                      ? `Applied to ${item.grant.organization.name}`
                                      : `Submitted to ${item.bounty.organization.name}`}
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">
                                    {formatDate(item.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="applications" className="mt-6 space-y-4">
                      {profile.applications && profile.applications.length > 0 ? (
                        profile.applications.map((app) => (
                          <Link
                            key={app.id}
                            href={`/grants/${app.grant.id}`}
                            className="block"
                          >
                            <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">
                                    {app.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {app.grant.title} • {app.grant.organization.name}
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">
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
                        <p className="text-white/60 text-center py-8">
                          No applications yet
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="submissions" className="mt-6 space-y-4">
                      {profile.submissions && profile.submissions.length > 0 ? (
                        profile.submissions.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/bounties/${sub.bounty.id}`}
                            className="block"
                          >
                            <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">
                                    {sub.title || sub.bounty.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {sub.bounty.organization.name}
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">
                                    {formatDate(sub.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {sub.isWinner && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
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
                        <p className="text-white/60 text-center py-8">
                          No submissions yet
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="wins" className="mt-6 space-y-4">
                      {profile.wonSubmissions && profile.wonSubmissions.length > 0 ? (
                        profile.wonSubmissions.map((win) => (
                          <Link
                            key={win.id}
                            href={`/bounties/${win.bounty.id}`}
                            className="block"
                          >
                            <div className="bg-gradient-to-r from-yellow-500/10 to-green-500/10 rounded-lg p-4 border border-yellow-500/20">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">
                                    {win.title || win.bounty.title}
                                  </p>
                                  <p className="text-sm text-white/60">
                                    {win.bounty.organization.name}
                                  </p>
                                  {win.winningAmount && (
                                    <p className="text-lg font-semibold text-green-400 mt-2">
                                      {win.winningAmount} {win.bounty.token}
                                    </p>
                                  )}
                                </div>
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                                  #{win.position} Place
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="text-white/60 text-center py-8">
                          No wins yet
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;