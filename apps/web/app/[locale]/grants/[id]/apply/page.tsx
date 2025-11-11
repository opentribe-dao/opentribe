"use client";

import { useSession } from "@packages/auth/client";
import { FileUpload } from "@packages/base";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@packages/base/components/ui/accordion";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Textarea } from "@packages/base/components/ui/textarea";
import { formatCurrency, getTokenLogo } from "@packages/base/lib/utils";
import { DollarSign, Loader2, Plus, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { GrantCard } from "@/app/[locale]/components/cards/grant-card";
import { env } from "@/env";
import { AuthModal } from "../../../components/auth-modal";

interface Grant {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions?: string;
  status: string;
  visibility: string;
  source: string;
  bannerUrl: string | null;
  minAmount: string | null;
  maxAmount: string | null;
  applicationCount: number;
  token: string;
  skills: string[];
  summary: string;
  createdAt: string;

  screening?: Array<{
    question: string;
    type: "text" | "url" | "file";
    optional: boolean;
  }>;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  rfps: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

interface Milestone {
  title: string;
  description: string;
  deliverables: string[];
}

interface TimelineItem {
  milestone: string;
  date: string;
}

const GrantApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfpId = searchParams.get("rfp");

  const { data: session, isPending: sessionLoading } = useSession();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    budget: "",
    rfpId: rfpId || "none",
    attachments: [] as string[],
    responses: {} as Record<string, any>,
    timeline: [] as TimelineItem[],
    milestones: [] as Milestone[],
  });

  useEffect(() => {
    const fetchGrant = async () => {
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${params.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch grant");
        }

        const data = await response.json();

        // Check if grant is open for applications
        if (
          data.grant.visibility !== "PUBLISHED" ||
          data.grant.status !== "OPEN"
        ) {
          toast.error("This grant is not accepting applications");
          router.push(`/grants/${grant?.slug || params.id}`);
          return;
        }

        // Check if grant uses external applications
        if (data.grant.source === "EXTERNAL" && data.grant.applicationUrl) {
          window.location.href = data.grant.applicationUrl;
          return;
        }

        setGrant(data.grant);
      } catch (error) {
        console.error("Error fetching grant:", error);
        toast.error("Failed to load grant details");
        router.push("/grants");
      } finally {
        setLoading(false);
      }
    };

    fetchGrant();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    // Validate required fields
    if (!(formData.title && formData.description)) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate budget if provided
    if (formData.budget && grant) {
      const budget = Number.parseFloat(formData.budget);
      const minAmount = Number.parseFloat(grant.minAmount || "0");
      const maxAmount = Number.parseFloat(grant.maxAmount || "0");
      if (minAmount && budget < minAmount) {
        toast.error(`Budget must be at least ${minAmount} ${grant.token}`);
        return;
      }
      if (maxAmount && budget > maxAmount) {
        toast.error(`Budget cannot exceed ${maxAmount} ${grant.token}`);
        return;
      }
    }

    // Validate screening responses
    if (grant?.screening) {
      for (const question of grant.screening) {
        if (!(question.optional || formData.responses[question.question])) {
          toast.error(`Please answer: ${question.question}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      const applicationData = {
        title: formData.title,
        summary: formData.summary || undefined,
        description: formData.description,
        budget: formData.budget
          ? Number.parseFloat(formData.budget)
          : undefined,
        rfpId:
          formData.rfpId && formData.rfpId !== "none"
            ? formData.rfpId
            : undefined,
        responses:
          Object.keys(formData.responses).length > 0
            ? formData.responses
            : undefined,
        timeline: formData.timeline.length > 0 ? formData.timeline : undefined,
        milestones:
          formData.milestones.length > 0 ? formData.milestones : undefined,
        attachments:
          formData.attachments.length > 0 ? formData.attachments : undefined,
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${params.id}/applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(applicationData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully!");
      router.push(`/grants/${grant?.slug || params.id}`);
    } catch (error: any) {
      console.error("Application error:", error);
      toast.error(
        error.message || "Failed to submit application. Please try again."
      );
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

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: "", description: "", deliverables: [] },
      ],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const updateMilestone = (
    index: number,
    field: keyof Milestone,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const addDeliverable = (milestoneIndex: number) => {
    const milestone = formData.milestones[milestoneIndex];
    updateMilestone(milestoneIndex, "deliverables", [
      ...milestone.deliverables,
      "",
    ]);
  };

  const updateDeliverable = (
    milestoneIndex: number,
    deliverableIndex: number,
    value: string
  ) => {
    const milestone = formData.milestones[milestoneIndex];
    const newDeliverables = [...milestone.deliverables];
    newDeliverables[deliverableIndex] = value;
    updateMilestone(milestoneIndex, "deliverables", newDeliverables);
  };

  const removeDeliverable = (
    milestoneIndex: number,
    deliverableIndex: number
  ) => {
    const milestone = formData.milestones[milestoneIndex];
    updateMilestone(
      milestoneIndex,
      "deliverables",
      milestone.deliverables.filter((_, i) => i !== deliverableIndex)
    );
  };

  const addTimelineItem = () => {
    setFormData((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { milestone: "", date: "" }],
    }));
  };

  const removeTimelineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index),
    }));
  };

  const updateTimelineItem = (
    index: number,
    field: keyof TimelineItem,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!grant) {
    return null;
  }

  const hasMinAmount = grant.minAmount !== null;
  const hasMaxAmount = grant.maxAmount !== null;
  const minAmountStr = hasMinAmount
    ? formatCurrency(Number.parseFloat(grant.minAmount || "0"), grant.token)
    : null;
  const maxAmountStr = hasMaxAmount
    ? formatCurrency(Number.parseFloat(grant.maxAmount || "0"), grant.token)
    : null;
  const budgetPlaceholder =
    hasMinAmount && hasMaxAmount
      ? `${minAmountStr} - ${maxAmountStr}`
      : hasMinAmount
        ? `Minimum: ${minAmountStr}`
        : hasMaxAmount
          ? `Maximum: ${maxAmountStr}`
          : "";

  return (
    <>
      <div className="min-h-screen">
        <div className="container relative z-10 mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-4 font-bold text-3xl text-white">
                Grant Application
              </h1>

              {/* Organization Info */}
              <div className="flex items-center justify-center gap-3 text-white/60">
                {grant.organization.logo && (
                  <img
                    alt={grant.organization.name}
                    className="h-8 w-8 rounded-full bg-white"
                    src={grant.organization.logo}
                  />
                )}
                <span>{grant.organization.name}</span>
              </div>
            </div>

            {/* Grant Info Card */}
            {/* <Card className='mb-8 border-white/10 bg-white/5 backdrop-blur-md'>
              <CardHeader>
                <h2 className='font-semibold text-white text-xl'>
                  {grant.title}
                </h2>
                <div className='mt-2 flex items-center gap-4 text-sm text-white/60'>
                  <span>Grant #{params?.id?.slice(0, 8)}</span>
                  {(hasMinAmount || hasMaxAmount) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className='h-4 w-4' />
                      {hasMinAmount && hasMaxAmount ? (
                        <>
                          {minAmountStr} - {maxAmountStr} {grant.token}
                        </>
                      ) : hasMinAmount ? (
                        <>
                          Min: {minAmountStr} {grant.token}
                        </>
                      ) : (
                        <>
                          Max: {maxAmountStr} {grant.token}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card> */}

            {/* Grant card */}
            <GrantCard
              applicationCount={grant.applicationCount}
              bannerUrl={grant.bannerUrl}
              createdAt={grant.createdAt}
              id={grant.id}
              key={grant.id}
              maxAmount={grant.maxAmount}
              minAmount={grant.minAmount}
              organization={grant.organization}
              rfpCount={grant.rfps.length}
              skills={grant.skills}
              slug={grant.slug}
              status={grant.status}
              summary={grant.summary}
              title={grant.title}
              token={grant.token}
            />

            <div className="mb-8" />

            {/* Application Form */}
            <form onSubmit={handleSubmit}>
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <h3 className="font-medium text-lg text-white">
                    Application Details
                  </h3>
                  {grant.instructions && (
                    <Accordion className="mt-4" collapsible type="single">
                      <AccordionItem
                        className="border-white/10"
                        value="instructions"
                      >
                        <AccordionTrigger className="text-white hover:no-underline">
                          Application Instructions
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown>{grant.instructions}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* RFP Selection (if applicable) */}
                  {grant.rfps && grant.rfps.length > 0 && (
                    <div>
                      <Label className="text-white" htmlFor="rfpId">
                        Select RFP (optional)
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, rfpId: value }))
                        }
                        value={formData.rfpId}
                      >
                        <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Select an RFP" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-zinc-900">
                          <SelectItem className="text-white" value="none">
                            None
                          </SelectItem>
                          {grant.rfps.map((rfp) => (
                            <SelectItem
                              className="text-white"
                              key={rfp.id}
                              value={rfp.id}
                            >
                              {rfp.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <Label className="text-white" htmlFor="title">
                      Project Title *
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
                      placeholder="Enter your project title"
                      required
                      type="text"
                      value={formData.title}
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <Label className="text-white" htmlFor="summary">
                      Summary (optional)
                    </Label>
                    <Textarea
                      className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      id="summary"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      placeholder="Brief summary of your project (2-3 sentences)"
                      rows={3}
                      value={formData.summary}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-white" htmlFor="description">
                      Project Description *
                    </Label>
                    <Textarea
                      className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      id="description"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Provide a detailed description of your project, including objectives, methodology, and expected outcomes..."
                      required
                      rows={8}
                      value={formData.description}
                    />
                  </div>

                  {/* Budget */}
                  {(hasMinAmount || hasMaxAmount) && (
                    <div>
                      <Label className="text-white" htmlFor="budget">
                        Budget Request ({grant.token})
                      </Label>
                      <div className="relative mt-2">
                        {getTokenLogo(grant.token) ? (
                          // Show token logo if available
                          <img
                            alt={grant.token || "Token"}
                            className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 rounded-full bg-white/10 object-contain"
                            src={getTokenLogo(grant.token) || ""}
                          />
                        ) : (
                          <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40" />
                        )}
                        <Input
                          className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                          id="budget"
                          max={grant.maxAmount || undefined}
                          min={grant.minAmount || 0}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                          placeholder={budgetPlaceholder}
                          type="number"
                          value={formData.budget}
                        />
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Label className="text-white">Project Timeline</Label>
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={addTimelineItem}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Timeline Item
                      </Button>
                    </div>
                    {formData.timeline.length > 0 ? (
                      <div className="space-y-3">
                        {formData.timeline.map((item, index) => (
                          <div
                            className="space-y-3 rounded-lg bg-white/5 p-4"
                            key={index}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      index,
                                      "milestone",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Milestone name"
                                  value={item.milestone}
                                />
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      index,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  type="date"
                                  value={item.date}
                                />
                              </div>
                              <Button
                                className="ml-2 text-white/60 hover:text-white"
                                onClick={() => removeTimelineItem(index)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">
                        No timeline items added yet
                      </p>
                    )}
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Label className="text-white">
                        Milestones & Deliverables
                      </Label>
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={addMilestone}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Milestone
                      </Button>
                    </div>
                    {formData.milestones.length > 0 ? (
                      <div className="space-y-4">
                        {formData.milestones.map((milestone, index) => (
                          <div
                            className="space-y-3 rounded-lg bg-white/5 p-4"
                            key={index}
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm text-white">
                                Milestone {index + 1}
                              </h4>
                              <Button
                                className="text-white/60 hover:text-white"
                                onClick={() => removeMilestone(index)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              className="border-white/10 bg-white/5 text-white"
                              onChange={(e) =>
                                updateMilestone(index, "title", e.target.value)
                              }
                              placeholder="Milestone title"
                              value={milestone.title}
                            />
                            <Textarea
                              className="border-white/10 bg-white/5 text-white"
                              onChange={(e) =>
                                updateMilestone(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Milestone description"
                              rows={2}
                              value={milestone.description}
                            />
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <Label className="text-sm text-white/80">
                                  Deliverables
                                </Label>
                                <Button
                                  className="h-auto py-1 text-white/60 hover:text-white"
                                  onClick={() => addDeliverable(index)}
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Add
                                </Button>
                              </div>
                              {milestone.deliverables.map(
                                (deliverable, dIndex) => (
                                  <div
                                    className="mb-2 flex items-center gap-2"
                                    key={dIndex}
                                  >
                                    <Input
                                      className="border-white/10 bg-white/5 text-sm text-white"
                                      onChange={(e) =>
                                        updateDeliverable(
                                          index,
                                          dIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Deliverable"
                                      value={deliverable}
                                    />
                                    <Button
                                      className="text-white/60 hover:text-white"
                                      onClick={() =>
                                        removeDeliverable(index, dIndex)
                                      }
                                      size="sm"
                                      type="button"
                                      variant="ghost"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">
                        No milestones added yet
                      </p>
                    )}
                  </div>

                  {/* Attachments */}
                  <div>
                    <Label className="text-white" htmlFor="attachments">
                      Supporting Documents (optional)
                    </Label>
                    <p className="mt-1 mb-3 text-sm text-white/60">
                      Upload any supporting documents, mockups, or technical
                      specifications
                    </p>
                    <FileUpload
                      maxFiles={10}
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
                  {grant.screening && grant.screening.length > 0 && (
                    <div className="space-y-6 border-white/10 border-t pt-6">
                      <h4 className="font-medium text-lg text-white">
                        Additional Questions
                      </h4>
                      {grant.screening.map((question, index) => (
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
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                    <p className="mt-4 text-center text-white/60 text-xs">
                      By submitting, you acknowledge that you have read the
                      grant description and meet all eligibility requirements
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
          redirectTo={`/grants/${grant?.slug || params.id}/apply${
            rfpId ? `?rfp=${rfpId}` : ""
          }`}
        />
      )}
    </>
  );
};

export default GrantApplicationPage;
