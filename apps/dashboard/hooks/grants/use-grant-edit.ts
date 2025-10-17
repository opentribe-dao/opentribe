import { useEffect, useState } from "react";
import { env } from "@/env";
import type { AppRouter, GrantEditHookReturn, GrantFormData, UserSession } from "@/type";
import type { GrantOrganization } from "./use-grant";

const INITIAL_FORM_DATA: GrantFormData = {
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
  screening: [],
  visibility: "DRAFT",
  source: "NATIVE",
  status: "OPEN",
};

export function useGrantEdit(
  id: string,
  session: UserSession | null | undefined,
  activeOrg: GrantOrganization | null | undefined,
  router: AppRouter
): GrantEditHookReturn {
  const [formData, setFormData] = useState<GrantFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!session?.user || !activeOrg) {return;}
      setLoading(true);
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`,
          { credentials: "include" }
        );
        if (!res.ok){ throw new Error("Failed to fetch grant");}
        const data = await res.json();
        const grant = data.grant;
        // permission check
        if (grant.organization.id !== activeOrg.id) {
          setError("You do not have permission to edit this grant.");
          return;
        }
        setFormData({
          title: grant.title ?? "",
          description: grant.description ?? "",
          summary: grant.summary ?? "",
          instructions: grant.instructions ?? "",
          logoUrl: grant.logoUrl ?? "",
          bannerUrl: grant.bannerUrl ?? "",
          skills: grant.skills ?? [],
          minAmount: grant.minAmount?.toString() ?? "",
          maxAmount: grant.maxAmount?.toString() ?? "",
          totalFunds: grant.totalFunds?.toString() ?? "",
          token: grant.token ?? "DOT",
          applicationUrl: grant.applicationUrl ?? "",
          resources: grant.resources ?? [],
          screening: grant.screening ?? [],
          visibility: grant.visibility ?? "DRAFT",
          source: grant.source ?? "NATIVE",
          status: grant.status ?? "OPEN",
        });
      } catch (_e) {
        setError("Failed to load grant details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, activeOrg, id]);

  // SKILL
  function addSkill(skill: string) {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));
  }
  function removeSkill(skill: string) {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  // RESOURCES
  function addResource() {
    setFormData((p) => ({
      ...p,
      resources: [...p.resources, { title: "", url: "", description: "" }],
    }));
  }
  function removeResource(index: number) {
    setFormData((p) => ({
      ...p,
      resources: p.resources.filter((_, i) => i !== index),
    }));
  }
  function updateResource(
    index: number,
    field: keyof GrantFormData["resources"][0],
    value: string
  ) {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  }

  // SCREENING
  function addScreeningQuestion() {
    setFormData((p) => ({
      ...p,
      screening: [
        ...p.screening,
        { question: "", type: "text", optional: false },
      ],
    }));
  }
  function removeScreeningQuestion(index: number) {
    setFormData((p) => ({
      ...p,
      screening: p.screening.filter((_, i) => i !== index),
    }));
  }
  function updateScreeningQuestion(
    index: number,
    field: keyof GrantFormData["screening"][0],
    value: string
  ) {
    setFormData((prev) => ({
      ...prev,
      screening: prev.screening.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  }

  // SUBMIT
  async function handleSubmit({
    setSubmitting,
    router,
    toast,
  }: {
    setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
    router: AppRouter;
    toast: typeof import("sonner").toast;
  }): Promise<void> {
    setSubmitting(true);
    try {
      // Prepare the grant data for API
      const grantData = {
        title: formData.title,
        description: formData.description,
        summary: formData.summary || undefined,
        instructions: formData.instructions || undefined,
        logoUrl: formData.logoUrl || null,
        bannerUrl: formData.bannerUrl || null,
        skills: formData.skills,
        minAmount: formData.minAmount ? Number.parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? Number.parseFloat(formData.maxAmount) : null,
        totalFunds: formData.totalFunds
          ? Number.parseFloat(formData.totalFunds)
          : null,
        token: formData.token,
        applicationUrl: formData.applicationUrl || null,
        resources: formData.resources.filter((r) => r.title && r.url),
        screening: formData.screening.filter((q) => q.question),
        visibility: formData.visibility,
        source: formData.source,
        status: formData.status,
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(grantData),
        }
      );
      if (!response.ok){ throw new Error("Failed to update grant");}
      await response.json();
      toast.success("Grant updated successfully!");
      router.push(`/grants/${id}`);
    } catch (_err) {
      toast.error("Failed to update grant. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    formData,
    setFormData,
    loading,
    error,
    submitting,
    setSubmitting,
    handleSubmit,
    addSkill,
    removeSkill,
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
  };
}