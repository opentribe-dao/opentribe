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
import { Label } from "@packages/base/components/ui/label";
import { Textarea } from "@packages/base/components/ui/textarea";
import { getSkillLabel } from "@packages/base/lib/skills";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { env } from "@/env";
import { Header } from "../../../../components/header";

interface ApplicationDetails {
  id: string;
  title: string;
  content: string;
  budget?: number;
  timeline?: Array<{
    milestone: string;
    date: string;
  }>;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
  answers?: Array<{
    question: string;
    answer: string;
    type: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  grant: {
    id: string;
    slug: string;
    title: string;
    organizationId: string;
    token: string;
    minAmount?: number;
    maxAmount?: number;
  };
  applicant: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export default function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const { id, applicationId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [application, setApplication] = useState<ApplicationDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (id && applicationId) {
      fetchApplicationDetails();
    }
  }, [id, applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}/applications/${applicationId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch application details");
      }

      const data = await response.json();

      // Check if user has access to review this application
      if (data.application.grant.organizationId !== activeOrg?.id) {
        toast.error("You do not have access to review this application");
        router.push("/grants");
        return;
      }

      setApplication(data.application);
      setFeedback(data.application.feedback || "");
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
      router.push(`/grants/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!feedback && newStatus === "REJECTED") {
      toast.error("Please provide feedback when rejecting an application");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}/applications/${applicationId}/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            feedback: feedback || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      toast.success(`Application ${newStatus.toLowerCase()} successfully`);
      router.push(`/grants/${id}`);
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application status");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US").format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/20 text-blue-400";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <>
      <Header
        page="Review Application"
        pages={[
          "Grants",
          application.grant.title,
          "Applications",
          application.title,
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <Button
            className="text-white/60 hover:text-white"
            onClick={() => router.push(`/grants/${id}`)}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grant
          </Button>
          <Badge className={`${getStatusColor(application.status)} border-0`}>
            {application.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Application Header */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  {application.title}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Submitted on {formatDate(application.submittedAt)}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Application Content */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-pink max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {application.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Screening Questions */}
            {application.answers && application.answers.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">
                    Screening Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.answers.map((answer, index) => (
                    <div className="space-y-2" key={index}>
                      <p className="font-medium text-sm text-white/80">
                        {answer.question}
                      </p>
                      {answer.type === "url" ? (
                        <a
                          className="flex items-center gap-2 text-[#E6007A] hover:underline"
                          href={answer.answer}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {answer.answer}
                        </a>
                      ) : (
                        <p className="text-white/60">{answer.answer}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Attached Files */}
            {application.files && application.files.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Attached Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {application.files.map((file, index) => (
                      <a
                        className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                        href={file.url}
                        key={index}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <FileText className="h-5 w-5 text-white/60" />
                        <div className="flex-1">
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-white/40">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-white/60" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Actions */}
            {application.status === "SUBMITTED" && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Review Decision</CardTitle>
                  <CardDescription className="text-white/60">
                    Provide feedback and make a decision on this application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="feedback">
                      Feedback (Required for rejection)
                    </Label>
                    <Textarea
                      className="mt-2 border-white/10 bg-white/5 text-white"
                      id="feedback"
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the applicant..."
                      rows={4}
                      value={feedback}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate("APPROVED")}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve Application
                    </Button>
                    <Button
                      disabled={actionLoading || !feedback}
                      onClick={() => handleStatusUpdate("REJECTED")}
                      variant="destructive"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Decision */}
            {(application.status === "APPROVED" ||
              application.status === "REJECTED") &&
              application.feedback && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Review Decision
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Reviewed on{" "}
                      {application.reviewedAt
                        ? formatDate(application.reviewedAt)
                        : "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">{application.feedback}</p>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Applicant Info */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Applicant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {application.applicant.image ? (
                    <img
                      alt={application.applicant.username}
                      className="h-12 w-12 rounded-full"
                      src={application.applicant.image}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                      {application.applicant.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {application.applicant.firstName}{" "}
                      {application.applicant.lastName}
                    </p>
                    <p className="text-sm text-white/60">
                      @{application.applicant.username}
                    </p>
                  </div>
                </div>

                {application.applicant.bio && (
                  <div>
                    <p className="mb-1 text-sm text-white/60">Bio</p>
                    <p className="text-sm text-white/80">
                      {application.applicant.bio}
                    </p>
                  </div>
                )}

                {application.applicant.location && (
                  <div className="flex items-center gap-2 text-white/60">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      {application.applicant.location}
                    </span>
                  </div>
                )}

                {application.applicant.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="h-4 w-4" />
                    <a
                      className="text-sm hover:text-white"
                      href={`mailto:${application.applicant.email}`}
                    >
                      {application.applicant.email}
                    </a>
                  </div>
                )}

                {application.applicant.skills &&
                  Array.isArray(application.applicant.skills) &&
                  application.applicant.skills.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-white/60">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {application.applicant.skills.map((skill: string) => (
                          <Badge
                            className="border-0 bg-white/10 text-white"
                            key={skill}
                            variant="secondary"
                          >
                            {getSkillLabel(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-2 pt-2">
                  {application.applicant.github && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        application.applicant.github.startsWith("http")
                          ? application.applicant.github
                          : `https://github.com/${application.applicant.github}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  )}
                  {application.applicant.linkedin && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        application.applicant.linkedin.startsWith("http")
                          ? application.applicant.linkedin
                          : `https://linkedin.com/in/${application.applicant.linkedin}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {application.applicant.twitter && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        application.applicant.twitter.startsWith("http")
                          ? application.applicant.twitter
                          : `https://twitter.com/${application.applicant.twitter}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Twitter Profile
                    </a>
                  )}
                  {application.applicant.website && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        application.applicant.website.startsWith("http")
                          ? application.applicant.website
                          : `https://${application.applicant.website}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Metadata */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Application Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-white/60" />
                    <div>
                      <p className="text-sm text-white/60">Budget Request</p>
                      <p className="font-medium text-white">
                        {formatAmount(application.budget)}{" "}
                        {application.grant.token}
                      </p>
                    </div>
                  </div>
                )}

                {application.timeline &&
                  Array.isArray(application.timeline) &&
                  application.timeline.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <p className="text-sm text-white/60">Timeline</p>
                      </div>
                      <div className="space-y-1">
                        {application.timeline.map((milestone, index) => (
                          <div
                            className="flex items-center justify-between text-sm"
                            key={index}
                          >
                            <span className="text-white">
                              {milestone.milestone}
                            </span>
                            <span className="text-white/60">
                              {milestone.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-white">
                      {formatDate(application.submittedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
