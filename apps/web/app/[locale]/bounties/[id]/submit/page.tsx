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
import type { Bounty } from "@/hooks/use-bounties-data";
import { formatCurrency } from "@packages/base/lib/utils";

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
      <div className='flex min-h-screen items-center justify-center'>
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
        <div className='container relative z-10 mx-auto px-4 py-12'>
          <div className='mx-auto max-w-2xl'>
            {/* Header */}
            <div className='mb-8 text-center'>
              <h1 className='mb-4 font-bold text-3xl text-white'>
                Bounty Submission
              </h1>

              {/* Organization Info */}
              <div className="flex items-center justify-center gap-3 text-white/60">
                {bounty.organization.logo && (
                  <img
                    src={bounty.organization.logo}
                    alt={bounty.organization.name}
                    className='h-8 w-8 rounded-full'
                  />
                )}
                <span>{bounty.organization.name}</span>
              </div>
            </div>

            {/* Bounty Info Card */}
            <Card className='mb-8 border-white/10 bg-white/5 backdrop-blur-md'>
              <CardHeader>
                <h2 className='font-semibold text-white text-xl'>
                  {bounty.title}
                </h2>
                <div className='mt-2 flex items-center gap-4 text-sm text-white/60'>
                  <span>Bounty #{params.id?.slice(0, 8)}</span>
                  {bounty.amount && (
                    <span>
                      Prize: {formatCurrency(Number(bounty.amount), String(bounty.token))}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Submission Form */}
            <form onSubmit={handleSubmit}>
              <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
                <CardHeader>
                  <h3 className='font-medium text-lg text-white'>
                    Link to your submission
                  </h3>
                  <p className='mt-1 text-sm text-white/60'>
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
                      <Link2 className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
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
                        className='border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40'
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
                      className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
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
                    <p className='mt-1 mb-3 text-sm text-white/60'>
                      Upload supporting documents, images, or demo files (PDF,
                      ZIP, images, videos)
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
                    <div className='space-y-6 border-white/10 border-t pt-6'>
                      <h4 className='font-medium text-lg text-white'>
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
                              className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
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
                              className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
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
                              className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
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
                      className='w-full bg-[#E6007A] text-white hover:bg-[#E6007A]/90'
                    >
                      {submitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Submitting...
                        </>
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
