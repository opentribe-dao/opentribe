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
import { FileUpload } from "@packages/base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Loader2, Plus, X, Calendar, DollarSign } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "../../../components/header";
import { AuthModal } from "../../../components/auth-modal";
import { env } from "@/env";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@packages/base/components/ui/accordion";
import { formatCurrency } from "@packages/base/lib/utils";
import { GrantCard } from "@/app/[locale]/components/cards/grant-card";

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
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate budget if provided
    if (formData.budget && grant) {
      const budget = Number.parseFloat(formData.budget);
      const minAmount = Number.parseFloat(grant.minAmount || "0");
      const maxAmount = Number.parseFloat(grant.maxAmount || "0");
      if (minAmount && budget < minAmount) {
        toast.error(
          `Budget must be at least ${minAmount} ${grant.token}`
        );
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
        if (!question.optional && !formData.responses[question.question]) {
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
        budget: formData.budget ? Number.parseFloat(formData.budget) : undefined,
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
      <div className='flex min-h-screen items-center justify-center'>
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
  const budgetPlaceholder = hasMinAmount && hasMaxAmount
    ? `${minAmountStr} - ${maxAmountStr}`
    : hasMinAmount
      ? `Minimum: ${minAmountStr}`
      : hasMaxAmount
        ? `Maximum: ${maxAmountStr}`
        : "";

  return (
    <>
      <div className="min-h-screen">
        <div className='container relative z-10 mx-auto px-4 py-12'>
          <div className='mx-auto max-w-3xl'>
            {/* Header */}
            <div className='mb-8 text-center'>
              <h1 className='mb-4 font-bold text-3xl text-white'>
                Grant Application
              </h1>

              {/* Organization Info */}
              <div className="flex items-center justify-center gap-3 text-white/60">
                {grant.organization.logo && (
                  <img
                    src={grant.organization.logo}
                    alt={grant.organization.name}
                    className='h-8 w-8 rounded-full bg-white'
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
              key={grant.id}
              id={grant.id}
              slug={grant.slug}
              title={grant.title}
              organization={grant.organization}
              bannerUrl={grant.bannerUrl}
              minAmount={grant.minAmount}
              maxAmount={grant.maxAmount}
              token={grant.token}
              rfpCount={grant.rfps.length}
              applicationCount={grant.applicationCount}
              status={grant.status}
              summary={grant.summary}
              skills={grant.skills}
              createdAt={grant.createdAt}
            />

            <div className='mb-8'>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit}>
              <Card className='border-white/10 bg-white/5 backdrop-blur-md'>
                <CardHeader>
                  <h3 className='font-medium text-lg text-white'>
                    Application Details
                  </h3>
                  {grant.instructions && (
                    <Accordion type="single" collapsible className="mt-4">
                      <AccordionItem
                        value="instructions"
                        className="border-white/10"
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
                      <Label htmlFor="rfpId" className="text-white">
                        Select RFP (optional)
                      </Label>
                      <Select
                        value={formData.rfpId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, rfpId: value }))
                        }
                      >
                        <SelectTrigger className='mt-2 border-white/10 bg-white/5 text-white'>
                          <SelectValue placeholder="Select an RFP" />
                        </SelectTrigger>
                        <SelectContent className='border-white/10 bg-zinc-900'>
                          <SelectItem value="none" className="text-white">
                            None
                          </SelectItem>
                          {grant.rfps.map((rfp) => (
                            <SelectItem
                              key={rfp.id}
                              value={rfp.id}
                              className="text-white"
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
                    <Label htmlFor="title" className="text-white">
                      Project Title *
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
                      placeholder="Enter your project title"
                      className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
                      required
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <Label htmlFor="summary" className="text-white">
                      Summary (optional)
                    </Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      placeholder="Brief summary of your project (2-3 sentences)"
                      rows={3}
                      className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-white">
                      Project Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Provide a detailed description of your project, including objectives, methodology, and expected outcomes..."
                      rows={8}
                      className='mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40'
                      required
                    />
                  </div>

                  {/* Budget */}
                  {(hasMinAmount || hasMaxAmount) && (
                    <div>
                      <Label htmlFor="budget" className="text-white">
                        Budget Request ({grant.token})
                      </Label>
                      <div className="relative mt-2">
                        <DollarSign className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-white/40' />
                        <Input
                          id="budget"
                          type="number"
                          value={formData.budget}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                          placeholder={budgetPlaceholder}
                          className='border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40'
                          min={grant.minAmount || 0}
                          max={grant.maxAmount || undefined}
                        />
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <div className='mb-3 flex items-center justify-between'>
                      <Label className="text-white">Project Timeline</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTimelineItem}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Add Timeline Item
                      </Button>
                    </div>
                    {formData.timeline.length > 0 ? (
                      <div className="space-y-3">
                        {formData.timeline.map((item, index) => (
                          <div
                            key={index}
                            className='space-y-3 rounded-lg bg-white/5 p-4'
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={item.milestone}
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      index,
                                      "milestone",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Milestone name"
                                  className='border-white/10 bg-white/5 text-white'
                                />
                                <Input
                                  type="date"
                                  value={item.date}
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      index,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  className='border-white/10 bg-white/5 text-white'
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimelineItem(index)}
                                className='ml-2 text-white/60 hover:text-white'
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
                    <div className='mb-3 flex items-center justify-between'>
                      <Label className="text-white">
                        Milestones & Deliverables
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMilestone}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Add Milestone
                      </Button>
                    </div>
                    {formData.milestones.length > 0 ? (
                      <div className="space-y-4">
                        {formData.milestones.map((milestone, index) => (
                          <div
                            key={index}
                            className='space-y-3 rounded-lg bg-white/5 p-4'
                          >
                            <div className="flex items-start justify-between">
                              <h4 className='font-medium text-sm text-white'>
                                Milestone {index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                                className="text-white/60 hover:text-white"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={milestone.title}
                              onChange={(e) =>
                                updateMilestone(index, "title", e.target.value)
                              }
                              placeholder="Milestone title"
                              className='border-white/10 bg-white/5 text-white'
                            />
                            <Textarea
                              value={milestone.description}
                              onChange={(e) =>
                                updateMilestone(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Milestone description"
                              rows={2}
                              className='border-white/10 bg-white/5 text-white'
                            />
                            <div>
                              <div className='mb-2 flex items-center justify-between'>
                                <Label className="text-sm text-white/80">
                                  Deliverables
                                </Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addDeliverable(index)}
                                  className='h-auto py-1 text-white/60 hover:text-white'
                                >
                                  <Plus className='mr-1 h-3 w-3' />
                                  Add
                                </Button>
                              </div>
                              {milestone.deliverables.map(
                                (deliverable, dIndex) => (
                                  <div
                                    key={dIndex}
                                    className='mb-2 flex items-center gap-2'
                                  >
                                    <Input
                                      value={deliverable}
                                      onChange={(e) =>
                                        updateDeliverable(
                                          index,
                                          dIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Deliverable"
                                      className='border-white/10 bg-white/5 text-sm text-white'
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeDeliverable(index, dIndex)
                                      }
                                      className="text-white/60 hover:text-white"
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
                    <Label htmlFor="attachments" className="text-white">
                      Supporting Documents (optional)
                    </Label>
                    <p className='mt-1 mb-3 text-sm text-white/60'>
                      Upload any supporting documents, mockups, or technical
                      specifications
                    </p>
                    <FileUpload
                      type="submission"
                      maxFiles={10}
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
                  {grant.screening && grant.screening.length > 0 && (
                    <div className='space-y-6 border-white/10 border-t pt-6'>
                      <h4 className='font-medium text-lg text-white'>
                        Additional Questions
                      </h4>
                      {grant.screening.map((question, index) => (
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
                        "Submit Application"
                      )}
                    </Button>
                    <p className='mt-4 text-center text-white/60 text-xs'>
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
