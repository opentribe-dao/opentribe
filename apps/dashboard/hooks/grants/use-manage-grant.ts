import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AppRouter } from "@/type";

export interface GrantFormData {
  title: string;
  description: string;
  summary: string;
  instructions: string;
  logoUrl: string;
  bannerUrl: string;
  skills: string[];
  minAmount: string;
  maxAmount: string;
  totalFunds: string;
  token: string;
  applicationUrl: string;
  resources: Array<{ title: string; url: string; description: string }>;
  resourceFiles: string[];
  screening: Array<{
    question: string;
    type: "text" | "url" | "file";
    optional: boolean;
  }>;
  visibility: "DRAFT" | "PUBLISHED";
  source: "NATIVE" | "EXTERNAL";
}

interface Org {
  id: string;
}

interface Session {
  user: { id: string };
}

interface GrantFormHookProps {
  session: Session | null | undefined;
  org: Org | null | undefined;
  router: AppRouter;
  env: Record<string, string>;
}

export function useGrantForm({
  session,
  org,
  router,
  env,
}: GrantFormHookProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const formMethods = useForm<GrantFormData>({
    defaultValues: {
      title: "",
      description: "",
      summary: "",
      instructions: "",
      logoUrl: "",
      bannerUrl: "",
      skills: [],
      minAmount: "",
      maxAmount: "",
      totalFunds: "",
      token: "DOT",
      applicationUrl: "",
      resources: [],
      resourceFiles: [],
      screening: [],
      visibility: "DRAFT",
      source: "NATIVE",
    },
    mode: "onBlur",
  });

  const watch = formMethods.watch;
  const values = watch();

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!(values.title && values.description)) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      case 2:
        if (values.minAmount && values.maxAmount) {
          const min = Number.parseFloat(values.minAmount);
          const max = Number.parseFloat(values.maxAmount);
          if (min > max) {
            toast.error("Minimum amount cannot be greater than maximum amount");
            return false;
          }
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      return true;
    }
    return false;
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const addSkill = (skills: string[]) => {
    formMethods.setValue("skills", skills);
  };

  const removeSkill = (skill: string) => {
    formMethods.setValue(
      "skills",
      values.skills.filter((s) => s !== skill)
    );
  };

  const addResource = () => {
    formMethods.setValue("resources", [
      ...values.resources,
      { title: "", url: "", description: "" },
    ]);
  };

  const removeResource = (index: number) => {
    formMethods.setValue(
      "resources",
      values.resources.filter((_, i) => i !== index)
    );
  };

  const updateResource = (
    index: number,
    field: keyof (typeof values.resources)[0],
    value: string
  ) => {
    formMethods.setValue(
      "resources",
      values.resources.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const addScreeningQuestion = () => {
    formMethods.setValue("screening", [
      ...values.screening,
      { question: "", type: "text" as const, optional: false },
    ]);
  };

  const removeScreeningQuestion = (index: number) => {
    formMethods.setValue(
      "screening",
      values.screening.filter((_, i) => i !== index)
    );
  };

  const updateScreeningQuestion = (
    index: number,
    field: keyof (typeof values.screening)[0],
    value: string | boolean
  ) => {
    formMethods.setValue(
      "screening",
      values.screening.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  };

  const handleSubmit = async (data: GrantFormData) => {
    if (!(validateStep(4) && org)) {
      return;
    }
    try {
      setSubmitting(true);

      const grantData = {
        title: data.title,
        description: data.description,
        summary: data.summary || undefined,
        instructions: data.instructions || undefined,
        logoUrl: data.logoUrl || undefined,
        bannerUrl: data.bannerUrl || undefined,
        skills: data.skills,
        minAmount: data.minAmount
          ? Number.parseFloat(data.minAmount)
          : undefined,
        maxAmount: data.maxAmount
          ? Number.parseFloat(data.maxAmount)
          : undefined,
        totalFunds: data.totalFunds
          ? Number.parseFloat(data.totalFunds)
          : undefined,
        token: data.token,
        applicationUrl: data.applicationUrl || undefined,
        resources: data.resources.filter((r) => r.title && r.url),
        resourceFiles: data.resourceFiles,
        screening: data.screening.filter((q) => q.question),
        visibility: data.visibility,
        source: data.source,
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${org.id}/grants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(grantData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create grant");
      }

      const result = await response.json();
      toast.success("Grant created successfully!");
      router.push(`/grants/${result.grant.id}`);
    } catch (_e) {
      toast.error("Failed to create grant. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    currentStep,
    setStep: setCurrentStep,
    canGoBack: currentStep > 1,
    canGoNext: currentStep < 4,
    submitting,
    formMethods,
    handleNext,
    handleBack,
    handleSubmit,
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
    addSkill,
    removeSkill,
  };
}
