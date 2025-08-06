"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { Textarea } from "@packages/base/components/ui/textarea";
import { MarkdownEditor, FileUpload } from "@packages/base";
import {
  RadioGroup,
  RadioGroupItem,
} from "@packages/base/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Loader2, Link2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "../../../components/header";
import { AuthModal } from "../../../components/auth-modal";
import { env } from "@/env";

interface Bounty {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: string;
  amount?: number;
  token: string;
  deadline?: string;
  screening?: Array<{
    question: string;
    type: "text" | "url" | "file";
    optional: boolean;
  }>;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
}

const BountySubmissionPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [formData, setFormData] = useState({
    submissionUrl: "",
    title: "",
    description: "",
    attachments: [] as string[],
    responses: {} as Record<string, any>,
  });

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

        // Check if bounty is open for submissions
        if (
          data.bounty.visibility !== "PUBLISHED" ||
          data.bounty.status !== "OPEN"
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
  }, [params.id, router]);

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
        if (!question.optional && !formData.responses[question.question]) {
          toast.error(`Please answer: ${question.question}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

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
            attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
            responses:
              Object.keys(formData.responses).length > 0
                ? formData.responses
                : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      toast.success("Submission created successfully!");
      router.push(`/bounties/${params.id}`);
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!bounty) {
    return null;
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Bounty Submission
              </h1>

              {/* Organization Info */}
              <div className="flex items-center justify-center gap-3 text-white/60">
                {bounty.organization.logo && (
                  <img
                    src={bounty.organization.logo}
                    alt={bounty.organization.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{bounty.organization.name}</span>
              </div>
            </div>

            {/* Bounty Info Card */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">
                  {bounty.title}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                  <span>Bounty #{params.id.slice(0, 8)}</span>
                  {bounty.amount && (
                    <span>
                      Prize: {formatAmount(bounty.amount)} {bounty.token}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Submission Form */}
            <form onSubmit={handleSubmit}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <h3 className="text-lg font-medium text-white">
                    Link to your submission
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    Make sure this link is accessible to everyone
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Submission URL */}
                  <div>
                    <Label htmlFor="submissionUrl" className="text-white">
                      Submission Link *
                    </Label>
                    <div className="relative mt-2">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="submissionUrl"
                        type="url"
                        value={formData.submissionUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            submissionUrl: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Title */}
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Title (optional)
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Give your submission a title"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-2"
                    />
                  </div>

                  {/* Optional Description */}
                  <div>
                    <Label htmlFor="description" className="text-white">
                      Description (optional)
                    </Label>
                    <div className="mt-2">
                      <MarkdownEditor
                        value={formData.description}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        placeholder="Add any additional context or information..."
                        height={250}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <Label htmlFor="attachments" className="text-white">
                      Attachments (optional)
                    </Label>
                    <p className="text-sm text-white/60 mt-1 mb-3">
                      Upload supporting documents, images, or demo files (PDF, ZIP, images, videos)
                    </p>
                    <FileUpload
                      type="submission"
                      maxFiles={5}
                      value={formData.attachments}
                      onChange={(urls) =>
                        setFormData((prev) => ({
                          ...prev,
                          attachments: urls,
                        }))
                      }
                    />
                  </div>

                  {/* Screening Questions */}
                  {bounty.screening && bounty.screening.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-white/10">
                      <h4 className="text-lg font-medium text-white">
                        Screening Questions
                      </h4>
                      {bounty.screening.map((question, index) => (
                        <div key={index}>
                          <Label className="text-white">
                            {question.question} {!question.optional && "*"}
                          </Label>
                          {question.type === "text" ? (
                            <Textarea
                              value={
                                formData.responses[question.question] || ""
                              }
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="Enter your response..."
                              rows={3}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-2"
                              required={!question.optional}
                            />
                          ) : question.type === "url" ? (
                            <Input
                              type="url"
                              value={
                                formData.responses[question.question] || ""
                              }
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="https://..."
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-2"
                              required={!question.optional}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={
                                formData.responses[question.question] || ""
                              }
                              onChange={(e) =>
                                updateResponse(
                                  question.question,
                                  e.target.value
                                )
                              }
                              placeholder="File URL or description..."
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-2"
                              required={!question.optional}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Now"
                      )}
                    </Button>
                    <p className="text-xs text-white/60 text-center mt-4">
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
