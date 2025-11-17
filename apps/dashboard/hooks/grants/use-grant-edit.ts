import { useEffect, useState } from "react";
import { env } from "@/env";
import type { AppRouter, GrantFormData } from "@/type";
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
  activeOrg: GrantOrganization | null | undefined,
  router: AppRouter
): {
  defaultValues: GrantFormData;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (
    data: GrantFormData,
    opts: {
      setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
      router: AppRouter;
      toast: typeof import("sonner").toast;
    }
  ) => Promise<void>;
} {
  const [defaultValues, setDefaultValues] =
    useState<GrantFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!activeOrg) {
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch grant");
        }
        const data = await res.json();
        const grant = data.grant;
        // permission check
        if (grant.organization.id !== activeOrg.id) {
          setError("You do not have permission to edit this grant.");
          return;
        }
        setDefaultValues({
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
  }, [activeOrg, id]);

  async function handleSubmit(
    data: GrantFormData,
    {
      setSubmitting,
      router,
      toast,
    }: {
      setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
      router: AppRouter;
      toast: typeof import("sonner").toast;
    }
  ): Promise<void> {
    setSubmitting(true);
    try {
      const grantData = {
        ...data,
        minAmount: data.minAmount ? Number.parseFloat(data.minAmount) : null,
        maxAmount: data.maxAmount ? Number.parseFloat(data.maxAmount) : null,
        totalFunds: data.totalFunds ? Number.parseFloat(data.totalFunds) : null,
        resources: data.resources.filter((r) => r.title && r.url),
        screening: data.screening.filter((q) => q.question),
      };
      if (!activeOrg?.id) {
        throw new Error("No organization selected");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/grants/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(grantData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update grant");
      }
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
    defaultValues,
    loading,
    error,
    submitting,
    setSubmitting,
    handleSubmit,
  };
}
