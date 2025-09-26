import { useQuery } from '@tanstack/react-query';
import { env } from '@/env';
import { useBountyContext } from '@/app/(authenticated)/components/bounty-provider';
import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface BountyDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  amount: number;
  token: string;
  split: string;
  winnings: Record<string, number>;
  deadline: string;
  resources?: Array<{ title: string; url: string; description?: string }>;
  screening?: Array<{
    question: string;
    type: 'text' | 'url' | 'file';
    optional: boolean;
  }>;
  status: string;
  visibility: string;
  submissionCount: number;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  publishedAt?: string;
  winnersAnnouncedAt?: string;
}

export interface Submission {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
  responses?: string;
  status: string;
  isWinner: boolean;
  position?: number;
  winningAmount?: string;
  submittedAt?: string;
  submitter: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    headline?: string;
    walletAddress?: string;
  };
  stats: {
    commentsCount: number;
    likesCount: number;
  };
  payments?: Array<{
    id: string;
    status: string;
    extrinsicHash?: string;
    amount: number;
    createdAt: string;
  }>;
}

const getDeadline = (dateStr?: string) => {
  if (!dateStr) {
    return '';
  }
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
};

const getString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

const getArray = <T>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? value : fallback;

const getObject = <T>(value: unknown, fallback: T) =>
  value && typeof value === 'object' ? (value as T) : fallback;

const createInitialFormData = (
  bounty: BountyDetails
): Partial<BountyDetails> => ({
  title: getString(bounty.title, ''),
  description: getString(bounty.description, ''),
  skills: getArray<string>(bounty.skills, []),
  amount: bounty.amount || 0,
  token: getString(bounty.token, 'DOT'),
  split: getString(bounty.split, 'FIXED') as
    | 'FIXED'
    | 'EQUAL_SPLIT'
    | 'VARIABLE',
  winnings: getObject<Record<string, number>>(bounty.winnings, {}),
  deadline: getDeadline(bounty.deadline),
  resources: getArray<{ title: string; url: string; description?: string }>(
    bounty.resources,
    []
  ),
  screening: getArray<{
    question: string;
    type: 'text' | 'url' | 'file';
    optional: boolean;
  }>(bounty.screening, []),
  visibility: getString(bounty.visibility, 'DRAFT') as 'DRAFT' | 'PUBLISHED',
  status: getString(bounty.status, 'OPEN') as
    | 'OPEN'
    | 'REVIEWING'
    | 'COMPLETED'
    | 'CLOSED'
    | 'CANCELLED',
});

export function useBounty(bountyId?: string) {
  return useQuery<BountyDetails, Error>({
    queryKey: ['bounty', bountyId],
    queryFn: async () => {
      if (!bountyId) {
        return Promise.reject(new Error('No organization ID'));
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch bounty ${bountyId}: ${res.statusText}`
        );
      }

      const data = await res.json();
      return data.bounty;
    },
    enabled: !!bountyId,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}

export function useBountySubmissions(bountyId?: string) {
  return useQuery<Submission, Error>({
    queryKey: ['bounty-submissions', bountyId],
    queryFn: async () => {
      if (!bountyId) {
        return Promise.reject(new Error('No Bounty ID'));
      }
      const res = await await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch bounty ${bountyId} submissions: ${res.statusText}`
        );
      }
      const data = await res.json();
      return data.submissions || [];
    },
    enabled: !!bountyId,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}

export function useBountySettings(bounty: BountyDetails | undefined) {
  const { refreshBounty } = useBountyContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from bounty
  const [formData, setFormData] = useState<Partial<BountyDetails>>({
    title: '',
    description: '',
    skills: [],
    amount: 0,
    token: 'DOT',
    split: 'FIXED',
    winnings: {},
    deadline: '',
    resources: [],
    screening: [],
    visibility: 'DRAFT',
    status: 'OPEN',
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
      updateFormData('winnings', newWinnings);
    },
    [formData.winnings, updateFormData]
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<BountyDetails>) => {
      if (!bounty) {
        throw new Error('No bounty found');
      }

      // Validate data
      const validatedData = data;

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
        throw new Error(error.error || 'Failed to update bounty');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Bounty updated successfully!');
      refreshBounty();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update bounty'
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!bounty) {
        throw new Error('No bounty found');
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete bounty');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully!');
      window.location.href = '/bounties';
    },
    onError: () => {
      toast.error('Failed to delete bounty');
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
