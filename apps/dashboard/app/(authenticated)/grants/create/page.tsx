"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { FileUpload, ImageUpload, MarkdownEditor } from "@packages/base";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Card, CardContent } from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import SkillsOptions from "@packages/base/components/ui/skills-options";
import { Textarea } from "@packages/base/components/ui/textarea";
import { getSkillLabel } from "@packages/base/lib/skills";
import { defineStepper } from "@stepperize/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { env } from "@/env";
import { useGrantForm } from "@/hooks/grants/use-manage-grant";
import { Header } from "../../components/header";

const { useStepper, steps, utils } = defineStepper(
  { id: "details", label: "Details" },
  { id: "funding", label: "Funding" },
  { id: "requirements", label: "Requirements" },
  { id: "publish", label: "Publish" }
);

const STEP_ID_MAP: Record<number, string> = {
  1: "details",
  2: "funding",
  3: "requirements",
  4: "publish",
};

const CURRENT_STEP_TO_ID = (step: number) => STEP_ID_MAP[step] || "details";

const TOKENS = [
  { value: "DOT", label: "DOT" },
  { value: "KSM", label: "KSM" },
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT" },
];

const CreateGrantPage = () => {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();

  const {
    currentStep,
    submitting,
    formMethods,
    handleBack,
    handleNext,
    handleSubmit,
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
    addSkill,
    removeSkill,
  } = useGrantForm({ session, org: activeOrg, router, env });

  useEffect(() => {
    if (!(sessionLoading || session?.user)) {
      router.push("/sign-in");
    }
  }, [session, sessionLoading, router]);

  const stepper = useStepper({
    initialStep: CURRENT_STEP_TO_ID(currentStep) as
      | "details"
      | "funding"
      | "requirements"
      | "publish",
  });

  if (sessionLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!activeOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  const { watch, control, setValue, getValues } = formMethods;
  const formData = watch();

  const onSubmit = formMethods.handleSubmit((data) => handleSubmit(data));

  const currentIndex = utils.getIndex(stepper.current.id);

  const handleNextStep = () => {
    const advanced = handleNext();
    if (advanced) {
      stepper.next();
    }
  };

  const handleBackStep = () => {
    handleBack();
    stepper.prev();
  };

  return (
    <>
      <Header page="Create Grant" pages={["Overview", "Grants"]} />
      <form autoComplete="off" className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between px-8">
          <nav aria-label="Stepperize Steps" className="w-full">
            <ol className="flex w-full items-center justify-between gap-2">
              {stepper.all.map((step, index, array) => (
                <div
                  className="flex items-center justify-between"
                  key={step.id}
                >
                  <div className="flex flex-col items-center">
                    <Button
                      aria-current={index === currentIndex ? "step" : undefined}
                      aria-selected={index === currentIndex}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index < currentIndex
                          ? "bg-green-500 text-white"
                          : index === currentIndex
                            ? "bg-[#E6007A] text-white"
                            : "bg-white/10 text-white/60"
                      }`}
                      type="button"
                      variant={
                        index < currentIndex
                          ? "secondary"
                          : index === currentIndex
                            ? "default"
                            : "secondary"
                      }
                    >
                      {index < currentIndex ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </Button>
                  </div>
                  <div className="mx-4 text-center">
                    <p
                      className={`font-medium text-sm ${
                        index <= currentIndex ? "text-white" : "text-white/60"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < array.length - 1 && (
                    <div
                      className={`mx-2 h-px w-[200] ${
                        index < currentIndex ? "bg-green-500" : "bg-white/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </ol>
          </nav>
        </div>

        <Card className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-[10px]">
          <CardContent>
            {stepper.switch({
              details: () => (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title">Grant Title *</Label>
                    <Input
                      {...formMethods.register("title", { required: true })}
                      className="border-white/10 bg-white/5 text-white"
                      id="title"
                      placeholder="e.g., Polkadot Ecosystem Development Grant"
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      {...formMethods.register("summary")}
                      className="border-white/10 bg-white/5 text-white"
                      id="summary"
                      placeholder="A brief summary of your grant program..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <div className="mt-2">
                      <MarkdownEditor
                        height={350}
                        onChange={(val) => setValue("description", val)}
                        placeholder="Describe your grant program, what you're looking to fund, and the impact you want to create..."
                        value={formData.description}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instructions">
                      Application Instructions
                    </Label>
                    <div className="mt-2">
                      <MarkdownEditor
                        height={300}
                        onChange={(val) => setValue("instructions", val)}
                        placeholder="Provide detailed instructions on how to apply, what to include, etc..."
                        value={formData.instructions}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-4 block text-white">Grant Logo</Label>
                    <ImageUpload
                      currentImageUrl={formData.logoUrl}
                      entityId={activeOrg?.id}
                      onImageChange={(url) => setValue("logoUrl", url || "")}
                      uploadType="organization-logo"
                      variant="logo"
                    />
                  </div>

                  <div>
                    <Label className="mb-4 block text-white">
                      Grant Banner
                    </Label>
                    <ImageUpload
                      currentImageUrl={formData.bannerUrl}
                      entityId={activeOrg?.id}
                      onImageChange={(url) => setValue("bannerUrl", url || "")}
                      placeholder="Upload a banner image for your grant (1200x400px recommended)"
                      uploadType="grant-banner"
                      variant="banner"
                    />
                  </div>

                  <div>
                    <Label>Skills</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <SkillsOptions
                          onChange={(skills) => addSkill(skills)}
                          value={formData.skills ?? []}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
              funding: () => (
                <div className="space-y-6">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-blue-400 text-sm">
                      Funding information is optional. Leave blank if funding
                      amounts are not predetermined.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minAmount">Minimum Amount</Label>
                      <Input
                        {...formMethods.register("minAmount")}
                        className="border-white/10 bg-white/5 text-white"
                        id="minAmount"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAmount">Maximum Amount</Label>
                      <Input
                        {...formMethods.register("maxAmount")}
                        className="border-white/10 bg-white/5 text-white"
                        id="maxAmount"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalFunds">Total Available Funds</Label>
                      <Input
                        {...formMethods.register("totalFunds")}
                        className="border-white/10 bg-white/5 text-white"
                        id="totalFunds"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="token">Token</Label>
                      <Select
                        onValueChange={(val) => setValue("token", val)}
                        value={formData.token}
                      >
                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-zinc-900">
                          {TOKENS.map((token) => (
                            <SelectItem
                              className="text-white"
                              key={token.value}
                              value={token.value}
                            >
                              {token.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ),
              requirements: () => (
                <div className="space-y-6">
                  <div>
                    <Label>Source</Label>
                    <div className="mt-2 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...formMethods.register("source")}
                          checked={formData.source === "NATIVE"}
                          className="text-[#E6007A]"
                          value="NATIVE"
                        />
                        <span className="font-sans text-white">
                          Native (managed in Opentribe)
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...formMethods.register("source")}
                          checked={formData.source === "EXTERNAL"}
                          className="text-[#E6007A]"
                          value="EXTERNAL"
                        />
                        <span className="font-sans text-white">
                          External (managed externally)
                        </span>
                      </label>
                    </div>
                  </div>
                  {formData.source === "EXTERNAL" && (
                    <div>
                      <Label htmlFor="applicationUrl">
                        External Application URL
                      </Label>
                      <Input
                        {...formMethods.register("applicationUrl")}
                        className="border-white/10 bg-white/5 text-white"
                        id="applicationUrl"
                        placeholder="https://..."
                        type="url"
                      />
                      <p className="mt-1 text-sm text-white/40">
                        If you have an external application form, provide the
                        URL here.
                      </p>
                    </div>
                  )}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Label>Resources</Label>
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={addResource}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Resource
                      </Button>
                    </div>
                    {formData.resources.length > 0 ? (
                      <div className="space-y-3">
                        {formData.resources.map((resource, index) => (
                          <div
                            className="space-y-3 rounded-lg bg-white/5 p-4"
                            key={index}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateResource(
                                      index,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Resource title"
                                  value={resource.title}
                                />
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateResource(index, "url", e.target.value)
                                  }
                                  placeholder="https://..."
                                  value={resource.url}
                                />
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateResource(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Brief description (optional)"
                                  value={resource.description}
                                />
                              </div>
                              <Button
                                className="ml-2 text-white/60 hover:text-white"
                                onClick={() => removeResource(index)}
                                size="sm"
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
                        No resources added yet
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Resource Files</Label>
                    <p className="mb-3 text-sm text-white/40">
                      Upload PDF documents, images, or other files as resources
                      for applicants
                    </p>
                    <FileUpload
                      className="mt-2"
                      maxFiles={10}
                      onChange={(urls) => setValue("resourceFiles", urls)}
                      type="resource"
                      value={formData.resourceFiles}
                    />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Label>Screening Questions</Label>
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={addScreeningQuestion}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                    {formData.screening.length > 0 ? (
                      <div className="space-y-3">
                        {formData.screening.map((question, index) => (
                          <div
                            className="space-y-3 rounded-lg bg-white/5 p-4"
                            key={index}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <Input
                                  className="border-white/10 bg-white/5 text-white"
                                  onChange={(e) =>
                                    updateScreeningQuestion(
                                      index,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter your question"
                                  value={question.question}
                                />
                                <div className="flex items-center gap-3">
                                  <Select
                                    onValueChange={(val) =>
                                      updateScreeningQuestion(
                                        index,
                                        "type",
                                        val as "text" | "url" | "file"
                                      )
                                    }
                                    value={question.type}
                                  >
                                    <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-zinc-900">
                                      <SelectItem
                                        className="text-white"
                                        value="text"
                                      >
                                        Text
                                      </SelectItem>
                                      <SelectItem
                                        className="text-white"
                                        value="url"
                                      >
                                        URL
                                      </SelectItem>
                                      <SelectItem
                                        className="text-white"
                                        value="file"
                                      >
                                        File
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <label className="flex items-center gap-2 text-sm text-white/60">
                                    <input
                                      checked={question.optional}
                                      className="rounded border-white/20"
                                      onChange={(e) =>
                                        updateScreeningQuestion(
                                          index,
                                          "optional",
                                          e.target.checked
                                        )
                                      }
                                      type="checkbox"
                                    />
                                    Optional
                                  </label>
                                </div>
                              </div>
                              <Button
                                className="ml-2 text-white/60 hover:text-white"
                                onClick={() => removeScreeningQuestion(index)}
                                size="sm"
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
                        No screening questions added yet
                      </p>
                    )}
                  </div>
                </div>
              ),
              publish: () => (
                <div className="space-y-6">
                  <div className="space-y-4 rounded-lg bg-white/5 p-6">
                    <h3 className="font-heading font-medium text-lg text-white">
                      Review Your Grant
                    </h3>
                    <div>
                      <p className="text-sm text-white/60">Title</p>
                      <p className="text-white">{formData.title}</p>
                    </div>
                    {formData.summary && (
                      <div>
                        <p className="text-sm text-white/60">Summary</p>
                        <p className="text-white">{formData.summary}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white/60">Description</p>
                      <p className="whitespace-pre-wrap text-white">
                        {formData.description}
                      </p>
                    </div>
                    {formData.skills.length > 0 && (
                      <div>
                        <p className="text-sm text-white/60">Skills</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {formData.skills.map((skill) => (
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
                    {(formData.minAmount ||
                      formData.maxAmount ||
                      formData.totalFunds) && (
                      <div>
                        <p className="text-sm text-white/60">Funding</p>
                        <div className="mt-1 space-y-1">
                          {formData.minAmount && formData.maxAmount && (
                            <p className="text-white">
                              Range: {formData.minAmount} - {formData.maxAmount}{" "}
                              {formData.token}
                            </p>
                          )}
                          {formData.totalFunds && (
                            <p className="text-white">
                              Total Funds: {formData.totalFunds}{" "}
                              {formData.token}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Visibility</Label>
                    <div className="mt-2 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...formMethods.register("visibility")}
                          checked={formData.visibility === "DRAFT"}
                          className="text-[#E6007A]"
                          value="DRAFT"
                        />
                        <span className="text-white">Save as Draft</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...formMethods.register("visibility")}
                          checked={formData.visibility === "PUBLISHED"}
                          className="text-[#E6007A]"
                          value="PUBLISHED"
                        />
                        <span className="text-white">Publish Now</span>
                      </label>
                    </div>
                  </div>
                </div>
              ),
            })}
          </CardContent>
        </Card>
        <div className="flex justify-between">
          <Button
            className="border-white/20 text-white hover:bg-white/10"
            onClick={
              currentIndex > 0
                ? () => {
                    handleBackStep();
                  }
                : () => router.push("/grants")
            }
            type="button"
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentIndex > 0 ? "Back" : "Cancel"}
          </Button>
          {currentIndex < steps.length - 1 ? (
            <Button
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
              onClick={() => {
                handleNextStep();
              }}
              type="button"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
              disabled={submitting}
              onClick={() => onSubmit()}
              type="button"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : formData.visibility === "PUBLISHED" ? (
                "Publish Grant"
              ) : (
                "Save Draft"
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default CreateGrantPage;
