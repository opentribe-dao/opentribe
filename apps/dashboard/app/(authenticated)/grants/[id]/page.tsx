"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
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
import {
  Calendar,
  Users,
  DollarSign,
  ExternalLink,
  Edit,
  Loader2,
  FileText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../components/header";
import { env } from "@/env";
import { getSkillLabel } from "@packages/base/lib/skills";

interface Grant {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string;
  instructions?: string;
  logoUrl?: string;
  bannerUrl?: string;
  skills: string[];
  minAmount?: number;
  maxAmount?: number;
  totalFunds?: number;
  token: string;
  resources?: any[];
  screening?: any[];
  applicationUrl?: string;
  status: string;
  visibility: string;
  source: string;
  createdAt: string;
  publishedAt?: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    location?: string;
    industry?: string;
  };
  _count: {
    applications: number;
    rfps: number;
    curators: number;
  };
  curators: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      email: string;
      image?: string;
    };
  }>;
  rfps: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    _count: {
      votes: number;
      comments: number;
      applications: number;
    };
  }>;
  applications: Array<{
    id: string;
    title: string;
    status: string;
    budget?: number;
    submittedAt?: string;
    applicant: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      image?: string;
    };
  }>;
}

const GrantDetailPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchGrant = async () => {
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch grant");
        }

        const data = await response.json();
        setGrant(data.grant);
      } catch (error) {
        console.error("Error fetching grant:", error);
        router.push("/grants");
      } finally {
        setLoading(false);
      }
    };

    fetchGrant();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!grant) {
    return null;
  }

  const isOrganizationAdmin = grant.organization.id === activeOrg?.id;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "bg-green-500/20 text-green-400 border-0";
      case "PAUSED":
        return "bg-yellow-500/20 text-yellow-400 border-0";
      case "CLOSED":
        return "bg-red-500/20 text-red-400 border-0";
      default:
        return "bg-gray-500/20 text-gray-400 border-0";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toUpperCase()) {
      case "EXTERNAL":
        return "bg-blue-500/20 text-blue-400 border-0";
      case "NATIVE":
      default:
        return "bg-purple-500/20 text-purple-400 border-0";
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Header pages={["Overview", "Grants"]} page={grant.title} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Grant Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">
                {grant.title}
              </h1>
              <Badge className={getStatusColor(grant.status)}>
                {grant.status}
              </Badge>
              <Badge className={getSourceColor(grant.source)}>
                {grant.source}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(grant.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{grant._count.applications} applications</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{grant._count.rfps} RFPs</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>{grant._count.curators} curators</span>
              </div>
            </div>
          </div>
          {isOrganizationAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href={`/grants/${grant.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Grant
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#E6007A]/20 data-[state=active]:text-[#E6007A]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-[#E6007A]/20 data-[state=active]:text-[#E6007A]"
            >
              Applications ({grant._count.applications})
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#E6007A]/20 data-[state=active]:text-[#E6007A]"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Grant Details */}
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Grant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization */}
                <div>
                  <p className="text-sm text-white/60 mb-2">Organization</p>
                  <div className="flex items-center gap-3">
                    {grant.organization.logo && (
                      <img
                        src={grant.organization.logo}
                        alt={grant.organization.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {grant.organization.name}
                      </p>
                      {grant.organization.location && (
                        <p className="text-sm text-white/60">
                          {grant.organization.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Funding */}
                {(grant.minAmount || grant.maxAmount || grant.totalFunds) && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Funding</p>
                    <div className="space-y-2">
                      {grant.minAmount && grant.maxAmount && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-white/40" />
                          <span className="text-white">
                            {formatAmount(grant.minAmount)} -{" "}
                            {formatAmount(grant.maxAmount)} {grant.token}
                          </span>
                        </div>
                      )}
                      {grant.totalFunds && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-white/40" />
                          <span className="text-white">
                            Total Funds: {formatAmount(grant.totalFunds)}{" "}
                            {grant.token}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-sm text-white/60 mb-2">Description</p>
                  <p className="text-white whitespace-pre-wrap">
                    {grant.description}
                  </p>
                </div>

                {/* Summary */}
                {grant.summary && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Summary</p>
                    <p className="text-white">{grant.summary}</p>
                  </div>
                )}

                {/* Instructions */}
                {grant.instructions && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">
                      Application Instructions
                    </p>
                    <p className="text-white whitespace-pre-wrap">
                      {grant.instructions}
                    </p>
                  </div>
                )}

                {/* External Application */}
                {grant.applicationUrl && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">
                      External Application
                    </p>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      asChild
                    >
                      <a
                        href={grant.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Externally
                      </a>
                    </Button>
                  </div>
                )}

                {/* Skills */}
                {grant.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">
                      Required Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grant.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-white/10 text-white border-0"
                        >
                          {getSkillLabel(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {grant.resources && grant.resources.length > 0 && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Resources</p>
                    <div className="space-y-2">
                      {grant.resources.map((resource: any, index: number) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <p className="text-white font-medium">
                            {resource.title}
                          </p>
                          {resource.description && (
                            <p className="text-sm text-white/60 mt-1">
                              {resource.description}
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Curators */}
            {grant.curators.length > 0 && (
              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardTitle>Curators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {grant.curators.map((curator) => (
                      <div
                        key={curator.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {curator.user.image ? (
                            <img
                              src={curator.user.image}
                              alt={curator.user.username}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {curator.user.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {curator.user.firstName && curator.user.lastName
                                ? `${curator.user.firstName} ${curator.user.lastName}`
                                : curator.user.username}
                            </p>
                            <p className="text-sm text-white/60">
                              @{curator.user.username}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white/10 text-white border-0"
                        >
                          {curator.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related RFPs */}
            {grant.rfps.length > 0 && (
              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardTitle>Related RFPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {grant.rfps.map((rfp) => (
                      <Link
                        key={rfp.id}
                        href={`/rfps/${rfp.id}`}
                        className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-white font-medium">
                              {rfp.title}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <span>{rfp._count.votes} votes</span>
                              <span>{rfp._count.comments} comments</span>
                              <span>
                                {rfp._count.applications} applications
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(rfp.status)}>
                            {rfp.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications</CardTitle>
                  {grant.source === "NATIVE" && isOrganizationAdmin && (
                    <Button
                      className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
                      disabled={grant.status !== "OPEN"}
                    >
                      Review Applications
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {grant.applications.length > 0 ? (
                  <div className="space-y-3">
                    {grant.applications.map((application) => (
                      <div
                        key={application.id}
                        className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Link
                          href={`/grants/${grant.id}/applications/${application.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <p className="text-white font-medium">
                                {application.title}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-white/60">
                                <div className="flex items-center gap-2">
                                  {application.applicant.image ? (
                                    <img
                                      src={application.applicant.image}
                                      alt={application.applicant.username}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                      <span className="text-xs">
                                        {application.applicant.username[0].toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <span>@{application.applicant.username}</span>
                                </div>
                                {application.budget && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {formatAmount(application.budget)}{" "}
                                      {grant.token}
                                    </span>
                                  </>
                                )}
                                {application.submittedAt && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Submitted{" "}
                                      {formatDate(application.submittedAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-white/10 text-white border-0">
                              {application.status}
                            </Badge>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">No applications yet</p>
                    {grant.source === "EXTERNAL" && grant.applicationUrl && (
                      <p className="text-sm text-white/40 mt-2">
                        Applications are managed externally
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Grant Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-white/60 mb-2">Visibility</p>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-0"
                  >
                    {grant.visibility}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-2">Management Type</p>
                  <Badge className={getSourceColor(grant.source)}>
                    {grant.source === "NATIVE"
                      ? "Managed in Opentribe"
                      : "Managed Externally"}
                  </Badge>
                </div>

                {grant.publishedAt && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Published Date</p>
                    <p className="text-white">
                      {formatDate(grant.publishedAt)}
                    </p>
                  </div>
                )}

                {isOrganizationAdmin && (
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-lg font-medium text-white mb-4">
                      Actions
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                        disabled={grant.status === "CLOSED"}
                      >
                        {grant.status === "OPEN"
                          ? "Pause Grant"
                          : "Resume Grant"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                        disabled={grant._count.applications > 0}
                      >
                        Delete Grant
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default GrantDetailPage;
