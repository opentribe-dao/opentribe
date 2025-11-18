"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  ArrowLeft,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { env } from "@/env";
import { Header } from "../../components/header";

interface RFPDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  resources?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  status: string;
  visibility: string;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  grant: {
    id: string;
    title: string;
    slug: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  applications: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    applicant: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  _count: {
    comments: number;
    votes: number;
    applications: number;
  };
}

export default function RFPDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [rfp, setRfp] = useState<RFPDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      fetchRFPDetails();
    }
  }, [id]);

  const fetchRFPDetails = async () => {
    try {
      setLoading(true);

      if (!activeOrg?.id) {
        throw new Error("No organization selected");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/rfps/${id}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch RFP details");
      }

      const data = await response.json();
      setRfp(data.rfp);
    } catch (error) {
      console.error("Error fetching RFP:", error);
      toast.error("Failed to load RFP details");
      router.push("/rfps");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this RFP?")) return;

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete RFP");
      }

      toast.success("RFP deleted successfully");
      router.push("/rfps");
    } catch (error) {
      console.error("Error deleting RFP:", error);
      toast.error("Failed to delete RFP");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-500/20 text-green-400";
      case "CLOSED":
        return "bg-red-500/20 text-red-400";
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "PUBLISHED":
        return "bg-transparent text-green-400";
      case "DRAFT":
        return "bg-transparent text-yellow-400";
      case "ARCHIVED":
        return "bg-transparent text-gray-400";
      default:
        return "bg-transparent text-white/60";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!rfp) {
    return null;
  }

  return (
    <>
      <Header page={rfp.title} pages={["RFPs", rfp.title]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <Button
            className="text-white/60 hover:text-white"
            onClick={() => router.push("/rfps")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFPs
          </Button>
          <div className="flex items-center gap-2">
            <Button
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() =>
                window.open(
                  `${env.NEXT_PUBLIC_WEB_URL}/rfps/${rfp.slug}`,
                  "_blank"
                )
              }
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Public Page
            </Button>
            <Button
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push(`/rfps/${rfp.id}/edit`)}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              onClick={handleDelete}
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* RFP Header */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2 text-2xl text-white">
                  {rfp.title}
                </CardTitle>
                <CardDescription className="text-white/60">
                  <div className="flex items-center gap-4">
                    <span>Grant: </span>
                    <Link
                      className="text-[#E6007A] hover:underline"
                      href={`/grants/${rfp.grant.id}`}
                    >
                      {rfp.grant.title}
                    </Link>
                  </div>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(rfp.status)} border-0`}>
                  {rfp.status}
                </Badge>
                <Badge
                  className={`${getVisibilityColor(rfp.visibility)} border-0`}
                >
                  {rfp.visibility}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-2 text-white/60">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Views</span>
                </div>
                <p className="font-bold text-2xl text-white">{rfp.viewCount}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-2 text-white/60">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Comments</span>
                </div>
                <p className="font-bold text-2xl text-white">
                  {rfp._count.comments}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-2 text-white/60">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">Votes</span>
                </div>
                <p className="font-bold text-2xl text-white">
                  {rfp._count.votes}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-2 text-white/60">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Applications</span>
                </div>
                <p className="font-bold text-2xl text-white">
                  {rfp._count.applications}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="border-white/20 bg-white/10">
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="applications"
            >
              Applications ({rfp._count.applications})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="comments"
            >
              Comments ({rfp._count.comments})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="settings"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="overview">
            {/* Description */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-pink max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {rfp.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            {rfp.resources && rfp.resources.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">
                    Resources & Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rfp.resources.map((resource, index) => (
                      <div className="flex items-start gap-3" key={index}>
                        <Globe className="mt-0.5 h-5 w-5 text-white/40" />
                        <div>
                          <a
                            className="font-medium text-[#E6007A] hover:underline"
                            href={resource.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {resource.title}
                          </a>
                          {resource.description && (
                            <p className="mt-1 text-sm text-white/60">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-white/60">Created</dt>
                    <dd className="mt-1 text-white">
                      {formatDate(rfp.createdAt)}
                    </dd>
                  </div>
                  {rfp.publishedAt && (
                    <div>
                      <dt className="text-sm text-white/60">Published</dt>
                      <dd className="mt-1 text-white">
                        {formatDate(rfp.publishedAt)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-white/60">Slug</dt>
                    <dd className="mt-1 font-mono text-sm text-white">
                      /{rfp.slug}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/60">Organization</dt>
                    <dd className="mt-1 text-white">
                      {rfp.grant.organization.name}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6">
                {rfp.applications && rfp.applications.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.applications.map((application) => (
                      <div
                        className="flex items-center justify-between rounded-lg bg-white/5 p-4"
                        key={application.id}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                            {application.applicant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {application.title}
                            </p>
                            <p className="text-sm text-white/60">
                              by {application.applicant.name} •{" "}
                              {formatDate(application.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-white/20" />
                    <p className="text-white/60">No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6">
                {rfp.comments && rfp.comments.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.comments.map((comment) => (
                      <div
                        className="border-white/10 border-b pb-4 last:border-0"
                        key={comment.id}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-sm text-white">
                            {comment.author.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="font-medium text-white">
                                {comment.author.name}
                              </p>
                              <span className="text-white/40 text-xs">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-white/80">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12 text-white/20" />
                    <p className="text-white/60">No comments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">RFP Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Manage this RFP's configuration and visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="text-sm text-yellow-400">
                    Settings management is available in the edit page
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                    onClick={() => router.push(`/rfps/${rfp.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit RFP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
