"use client";

import { useSession } from "@packages/auth/client";
import { FileUpload, MarkdownEditor } from "@packages/base";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@packages/base/components/ui/radio-group";
import { Textarea } from "@packages/base/components/ui/textarea";
import { formatCurrency } from "@packages/base/lib/utils";
import { Link2, Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import type { Bounty } from "@/hooks/use-bounties-data";
import {
  useMySubmission,
  useUpdateSubmission,
} from "@/hooks/use-submission-mutations";
import { AuthModal } from "../../../components/auth-modal";

// Regex patterns for error parsing (defined at top level for performance)
const FIELD_NAME_REGEX = /^([^:]+):/;
const CAMEL_CASE_REGEX = /([A-Z])/g;
const WORD_BOUNDARY_REGEX = /\b\w/g;

const BountySubmissionPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if we're in edit mode
  const editSubmissionId = searchParams.get("edit");
  const isEditMode = !!editSubmissionId;

  // Fetch existing submission if in edit mode
  const { data: mySubmission, isLoading: submissionLoading } = useMySubmission(
    params.id as string
  );

  const updateSubmission = useUpdateSubmission(
    params.id as string,
    editSubmissionId || ""
  );

  const [formData, setFormData] = useState({
    submissionUrl: "",
    title: "",
    description: "",
    attachments: [] as string[],
    responses: {} as Record<string, any>,
  });

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEditMode && mySubmission) {
      setFormData({
        submissionUrl: mySubmission.submissionUrl || "",
        title: mySubmission.title || "",
        description: mySubmission.description || "",
        attachments: mySubmission.attachments || [],
        responses: mySubmission.responses || {},
      });
    }
  }, [isEditMode, mySubmission]);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${params.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bounty");
        }

        const data = await response.json();

        // Check if bounty is open for submissions (unless we're editing)
        if (
          !isEditMode &&
          (data.bounty.visibility !== "PUBLISHED" ||
            data.bounty.status !== "OPEN")
        ) {
          toast.error("This bounty is not accepting submissions");
          router.push(`/bounties/${params.id}`);
          return;
        }

        setBounty(data.bounty);
      } catch (error) {
        console.error("Error fetching bounty:", error);
        toast.error("Failed to load bounty details");
        router.push("/bounties");
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [params.id, router, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    // Validate submission URL
    if (!formData.submissionUrl) {
      toast.error("Please provide a submission link");
      return;
    }

    // Validate screening responses
    if (bounty?.screening) {
      for (const question of bounty.screening) {
        if (!(question.optional || formData.responses[question.question])) {
          toast.error(`Please answer: ${question.question}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      if (isEditMode && editSubmissionId) {
        // Update existing submission
        await updateSubmission.mutateAsync({
          submissionUrl: formData.submissionUrl,
          title: formData.title || undefined,
          description: formData.description || undefined,
          attachments:
            formData.attachments.length > 0
              ? formData.attachments
              : undefined,
          responses:
            Object.keys(formData.responses).length > 0
              ? formData.responses
              : undefined,
        });

        router.push(`/bounties/${params.id}`);
      } else {
        // Create new submission
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${params.id}/submissions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              submissionUrl: formData.submissionUrl,
              title: formData.title || undefined,
              description: formData.description || undefined,
              attachments:
                formData.attachments.length > 0
                  ? formData.attachments
                  : undefined,
              responses:
                Object.keys(formData.responses).length > 0
                  ? formData.responses
                  : undefined,
            }),
          }
        );

        const data = await response.json();

      if (!response.ok) {
        // Extract field name from Zod validation errors
        let errorMessage = data.error || "Failed to submit";

        if (data.message) {
          // Parse Zod error message format: "field: error message"
          const match = data.message.match(FIELD_NAME_REGEX);
          if (match) {
            const fieldName = match[1]?.trim() || "";
            const readableField = fieldName
              .replace(CAMEL_CASE_REGEX, " $1")
              .toLowerCase()
              .replace(WORD_BOUNDARY_REGEX, (c: string) => c.toUpperCase());
            errorMessage = `${readableField} has invalid value`;
          } else {
            // Fallback to the full message if format is different
            errorMessage = data.message;
          }
        } else if (data.details) {
          // Try to extract from details if message is not available
          const firstIssue = Array.isArray(data.details)
            ? data.details[0]
            : data.details;

          if (
            firstIssue?.path &&
            Array.isArray(firstIssue.path) &&
            firstIssue.path.length > 0
          ) {
            const fieldName = firstIssue.path.at(-1);
            if (fieldName) {
              const readableField = String(fieldName)
                .replace(CAMEL_CASE_REGEX, " $1")
                .toLowerCase()
                .replace(WORD_BOUNDARY_REGEX, (c: string) => c.toUpperCase());
              errorMessage = `${readableField} has invalid value`;
            }
          }
        }

        throw new Error(errorMessage);
      }

        toast.success("Submission created successfully!");
        router.push(`/bounties/${params.id}`);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateResponse = (question: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [question]: value,
      },
    }));
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!bounty) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="container relative z-10 mx-auto px-4 py-12">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-4 font-bold text-3xl text-white">
                {isEditMode ? "Edit Submission" : "Bounty Submission"}
              </h1>

              {/* Organization Info */}
              <div className="flex items-center justify-center gap-3 text-white/60">
                {bounty.organization.logo && (
                  <img
                    alt={bounty.organization.name}
                    className="h-8 w-8 rounded-full"
                    src={bounty.organization.logo}
                  />
                )}
                <span>{bounty.organization.name}</span>
              </div>
            </div>

            {/* Bounty Info Card */}
            <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <h2 className="font-semibold text-white text-xl">
                  {bounty.title}
                </h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-white/60">
                  <span>Bounty #{params.id?.slice(0, 8)}</span>
                  {bounty.amount && (
                    <span>
                      Prize:{" "}
                      {formatCurrency(
                        Number(bounty.amount),
                        String(bounty.token)
                      )}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Submission Form */}
            <form onSubmit={handleSubmit}>
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <h3 className="font-medium text-lg text-white">
                    Link to your submission
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    Make sure this link is accessible to everyone
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Submission URL */}
                  <div>
                    <Label className="text-white" htmlFor="submissionUrl">
                      Submission Link *
                    </Label>
                    <div className="relative mt-2">
                      <Link2 className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                      <Input
                        className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                        id="submissionUrl"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            submissionUrl: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        required
                        type="url"
                        value={formData.submissionUrl}
                      />
                    </div>
                  </div>

                  {/* Optional Title */}
                  <div>
                    <Label className="text-white" htmlFor="title">
                      Title (optional)
                    </Label>
                    <Input
                      className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      id="title"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Give your submission a title"
                      type="text"
                      value={formData.title}
                    />
                  </div>

                  {/* Optional Description */}
                  <div>
                    <Label className="text-white" htmlFor="description">
                      Description (optional)
                    </Label>
                    <div className="mt-2">
                      <MarkdownEditor
                        height={250}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        placeholder="Add any additional context or information..."
                        value={formData.description}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <Label className="text-white" htmlFor="attachments">
                      Attachments (optional)
                    </Label>
                    <p className="mt-1 mb-3 text-sm text-white/60">
                      Upload supporting documents, images, or demo files (PDF,
                      ZIP, images, videos)
                    </p>
                    <FileUpload
                      maxFiles={5}
                      onChange={(urls) =>
                        setFormData((prev) => ({
                          ...prev,
                          attachments: urls,
                        }))
                      }
                      type="submission"
                      value={formData.attachments}
                    />
                  </div>

                  {/* Screening Questions */}
                  {bounty.screening && bounty.screening.length > 0 && (
                    <div className="space-y-6 border-white/10 border-t pt-6">
                      <h4 className="font-medium text-lg text-white">
                        Screening Questions
                      </h4>
                      {bounty.screening.map((question, index) => (
                        <div key={index}>
                          <Label className="text-white">
                            {question.question} {!question.optional && "*"}
                          </Label>
                          {question.type === "text" ? (
                            <Textarea
                              className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="Enter your response..."
                              required={!question.optional}
                              rows={3}
                              value={
                                formData.responses[question.question] || ""
                              }
                            />
                          ) : question.type === "url" ? (
                            <Input
                              className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="https://..."
                              required={!question.optional}
                              type="url"
                              value={
                                formData.responses[question.question] || ""
                              }
                            />
                          ) : question.type === "boolean" ? (
                            <RadioGroup
                              className="mt-2"
                              onValueChange={(value) =>
                                updateResponse(
                                  question.question,
                                  value === "yes" ? "Yes" : "No"
                                )
                              }
                              required={!question.optional}
                              value={
                                formData.responses[question.question] === "Yes"
                                  ? "yes"
                                  : formData.responses[question.question] ===
                                      "No"
                                    ? "no"
                                    : undefined
                              }
                            >
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem
                                    className="border-white/20 text-white"
                                    id={`${index}-yes`}
                                    value="yes"
                                  />
                                  <Label
                                    className="text-white cursor-pointer"
                                    htmlFor={`${index}-yes`}
                                  >
                                    Yes
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem
                                    className="border-white/20 text-white"
                                    id={`${index}-no`}
                                    value="no"
                                  />
                                  <Label
                                    className="text-white cursor-pointer"
                                    htmlFor={`${index}-no`}
                                  >
                                    No
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          ) : (
                            <Input
                              className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="File URL or description..."
                              required={!question.optional}
                              type="text"
                              value={
                                formData.responses[question.question] || ""
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      className="w-full bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                      disabled={submitting}
                      type="submit"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? "Updating..." : "Submitting..."}
                        </>
                      ) : isEditMode ? (
                        "Update Submission"
                      ) : (
                        "Submit Now"
                      )}
                    </Button>
                    <p className="mt-4 text-center text-white/60 text-xs">
                      By submitting, you acknowledge that you have read the
                      description and agree with the submission guidelines
                      provided by the organization
                    </p>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          redirectTo={`/bounties/${params.id}/submit`}
        />
      )}
    </>
  );
};

export default BountySubmissionPage;
