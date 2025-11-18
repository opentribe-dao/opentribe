import { useActiveOrganization, useSession } from "@packages/auth/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBountyContext } from "@/app/(authenticated)/components/bounty-provider";
import { env } from "@/env";
import type { BountyDetails } from "./use-bounty";

const getDeadline = (dateStr?: string) => {
  if (!dateStr) {
    return "";
  }
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
};

const getString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const getArray = <T>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? value : fallback;

const getObject = <T>(value: unknown, fallback: T) =>
  value && typeof value === "object" ? (value as T) : fallback;

const createInitialFormData = (
  bounty: BountyDetails
): Partial<BountyDetails> => ({
  title: getString(bounty.title, ""),
  description: getString(bounty.description, ""),
  skills: getArray<string>(bounty.skills, []),
  amount: bounty.amount || 0,
  token: getString(bounty.token, "DOT"),
  split: getString(bounty.split, "FIXED") as
    | "FIXED"
    | "EQUAL_SPLIT"
    | "VARIABLE",
  winnings: getObject<Record<string, number>>(bounty.winnings, {}),
  deadline: getDeadline(bounty.deadline),
  resources: getArray<{ title: string; url: string; description?: string }>(
    bounty.resources,
    []
  ),
  screening: getArray<{
    question: string;
    type: "text" | "url" | "file";
    optional: boolean;
  }>(bounty.screening, []),
  visibility: getString(bounty.visibility, "DRAFT") as "DRAFT" | "PUBLISHED",
  status: getString(bounty.status, "OPEN") as
    | "OPEN"
    | "REVIEWING"
    | "COMPLETED"
    | "CLOSED"
    | "CANCELLED",
});

export function useBountySkills() {
  return useQuery({
    queryKey: ["bounty-skills"],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/skills`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch skills");
      }
      const json = await res.json();
      // API returns { data: [{ skill: string, count: number }] }
      if (!(json?.data && Array.isArray(json.data))) {
        return [];
      }
      return json.data.map((item: { skill: string }) => item.skill);
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useBountySettings(bounty: BountyDetails | undefined) {
  const { refreshBounty } = useBountyContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const organizationId = bounty?.organization?.id;

  // Initialize form data from bounty
  const [formData, setFormData] = useState<Partial<BountyDetails>>({
    title: "",
    description: "",
    skills: [],
    amount: 0,
    token: "DOT",
    split: "FIXED",
    winnings: {},
    deadline: "",
    resources: [],
    screening: [],
    visibility: "DRAFT",
    status: "OPEN",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when bounty loads
  useEffect(() => {
    if (!bounty) {
      return;
    }

    const initialData = createInitialFormData(bounty);

    setFormData(initialData);
  }, [bounty]);

  // Track changes
  useEffect(() => {
    if (!bounty) {
      return;
    }

    const initialData = createInitialFormData(bounty);

    setHasChanges(JSON.stringify(formData) !== JSON.stringify(initialData));
  }, [formData, bounty]);

  // Update form data
  const updateFormData = useCallback(
    <K extends keyof BountyDetails>(field: K, value: BountyDetails[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Update winnings
  const updateWinnings = useCallback(
    (position: string, amount: number) => {
      const newWinnings = { ...formData.winnings };
      if (amount > 0) {
        newWinnings[position] = amount;
      } else {
        delete newWinnings[position];
      }
      updateFormData("winnings", newWinnings);
    },
    [formData.winnings, updateFormData]
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<BountyDetails>) => {
      if (!bounty || !organizationId) {
        throw new Error("No bounty or organization found");
      }

      // Validate data
      const validatedData = data;

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/bounties/${bounty.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...validatedData,
            amount: Number(validatedData.amount),
            deadline: validatedData.deadline
              ? new Date(validatedData.deadline).toISOString()
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update bounty");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Bounty updated successfully!");
      refreshBounty();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update bounty"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!bounty || !organizationId) {
        throw new Error("No bounty or organization found");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/bounties/${bounty.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete bounty");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Bounty deleted successfully!");
      window.location.href = "/bounties";
    },
    onError: () => {
      toast.error("Failed to delete bounty");
    },
  });

  // Handlers
  const handleSave = useCallback(() => {
    saveMutation.mutate(formData);
  }, [formData, saveMutation]);

  const handleReset = useCallback(() => {
    if (!bounty) {
      return;
    }

    const initialData = createInitialFormData(bounty);

    setFormData(initialData);
    setHasChanges(false);
  }, [bounty]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    formData,
    hasChanges,
    isSaving: saveMutation.isPending,
    isResetting: false, // Reset is instant
    updateFormData,
    updateWinnings,
    handleSave,
    handleReset,
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
  };
}

export function useBountyForm() {
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<BountyDetails>>({
    title: "",
    description: "",
    skills: [],
    amount: undefined,
    token: "DOT",
    split: "FIXED",
    winnings: {},
    deadline: "",
    resources: [],
    screening: [],
    visibility: "DRAFT",
  });

  useEffect(() => {
    if (!(sessionLoading || session?.user)) {
      router.push("/sign-in");
    }
  }, [session, sessionLoading, router]);

  // Update form data
  const updateFormData = useCallback(
    <K extends keyof BountyDetails>(field: K, value: BountyDetails[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Update winnings
  const updateWinnings = useCallback(
    (position: string, amount: number) => {
      const newWinnings = { ...formData.winnings };
      if (amount > 0) {
        newWinnings[position] = amount;
      } else {
        delete newWinnings[position];
      }
      updateFormData("winnings", newWinnings);
    },
    [formData.winnings, updateFormData]
  );

  const addSkill = (skills: string[]) => {
    updateFormData("skills", skills);
  };

  const removeSkill = (skill: string) => {
    updateFormData(
      "skills",
      (formData.skills ?? []).filter((s) => s !== skill)
    );
  };

  // Split validation logic into smaller helpers to reduce complexity
  function validateStep1(formData: Partial<BountyDetails>): boolean {
    if (
      !(
        formData.title &&
        formData.description &&
        Array.isArray(formData.skills)
      ) ||
      formData.skills.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  }

  function validateStep2(formData: Partial<BountyDetails>): boolean {
    // Winners are stored in formData.winnings as an object: { [position: string]: number }
    const winnings = formData.winnings as Record<string, number> | undefined;
    const totalAmount = formData.amount as string | undefined;

    if (
      !(totalAmount && winnings) ||
      Object.keys(winnings).length === 0 ||
      Object.values(winnings).some(
        (amount) => !amount || Number.isNaN(Number(amount))
      )
    ) {
      toast.error("Please specify all reward amounts");
      return false;
    }
    const total = Number.parseFloat(totalAmount);
    const winnersTotal = Object.values(winnings).reduce(
      (sum: number, amount) => sum + Number.parseFloat(String(amount)),
      0
    );
    if (Math.abs(total - winnersTotal) > 0.01) {
      toast.error("Winner rewards must add up to the total amount");
      return false;
    }
    return true;
  }

  function validateStep3(formData: Partial<BountyDetails>): boolean {
    if (!formData.deadline) {
      toast.error("Please set a deadline");
      return false;
    }
    return true;
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return validateStep1(formData);
      case 2:
        return validateStep2(formData);
      case 3:
        return validateStep3(formData);
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

  const createMutation = useMutation({
    onMutate: () => {
      setSubmitting(true);
    },
    mutationFn: async () => {
      if (!activeOrg?.id) {
        throw new Error("No organization selected");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/bounties`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            amount: Number(formData.amount),
            deadline: formData.deadline
              ? new Date(formData.deadline).toISOString()
              : undefined,
          }),
        }
      );
      return response.json();
    },
    onSuccess: (result) => {
      toast.success("Bounty created successfully!");
      router.push(`/bounties/${result.bounty.id}/`);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create bounty. Please try again.";
      setError(errorMessage);
      toast.error("Failed to create bounty. Please try again.");
    },
  });

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setError(null);
    try {
      await createMutation.mutate();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create bounty. Please try again.";
      setError(errorMessage);
      toast.error("Failed to create bounty. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    session,
    sessionLoading,
    activeOrg,
    orgLoading,
    currentStep,
    setCurrentStep,
    submitting,
    formData,
    setFormData,
    updateFormData,
    handleNext,
    handleBack,
    handleSubmit,
    updateWinnings,
    error,
    addSkill,
    removeSkill,
  };
}
