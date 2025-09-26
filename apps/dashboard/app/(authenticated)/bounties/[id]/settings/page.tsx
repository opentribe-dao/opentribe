'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Button } from '@packages/base/components/ui/button';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { useBountyContext } from '../../../components/bounty-provider';
import { toast } from 'sonner';
import { env } from '@/env';
import {
  Save,
  Loader2,
  Eye,
  Trash2,
  Award,
  Clock,
  Plus,
  FileWarning,
  TriangleAlert,
  Undo2,
} from 'lucide-react';

interface BountyFormData {
  title: string;
  description: string;
  skills: string[];
  amount: number;
  token: string;
  split: 'FIXED' | 'EQUAL_SPLIT' | 'VARIABLE';
  winnings: Record<string, number>;
  deadline: string;
  resources: Array<{ title: string; url: string; description?: string }>;
  screening: Array<{
    question: string;
    type: 'text' | 'url' | 'file';
    optional: boolean;
  }>;
  visibility: 'DRAFT' | 'PUBLISHED';
  status: 'OPEN' | 'REVIEWING' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
}

export default function SettingsPage() {
  const { bounty, refreshBounty } = useBountyContext();
  const [formData, setFormData] = useState<BountyFormData>({
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

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from bounty
  useEffect(() => {
    if (!bounty) {
      return;
    }
    const getDeadline = (dateStr?: string) => {
      if (!dateStr) {
        return '';
      }
      const date = new Date(dateStr);
      return Number.isNaN(date.getTime())
        ? ''
        : date.toISOString().slice(0, 16);
    };

    const getString = (value: unknown, fallback: string) =>
      typeof value === 'string' && value.length > 0 ? value : fallback;

    const getArray = <T,>(value: unknown, fallback: T[]) =>
      Array.isArray(value) ? value : fallback;

    const getObject = <T,>(value: unknown, fallback: T) =>
      value && typeof value === 'object' ? (value as T) : fallback;

    setFormData({
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
      visibility: getString(bounty.visibility, 'DRAFT') as
        | 'DRAFT'
        | 'PUBLISHED',
      status: getString(bounty.status, 'OPEN') as
        | 'OPEN'
        | 'REVIEWING'
        | 'COMPLETED'
        | 'CLOSED'
        | 'CANCELLED',
    });
  }, [bounty]);

  // Track changes
  useEffect(() => {
    if (!bounty) {
      return;
    }
    const getDeadline = (dateStr?: string) => {
      if (!dateStr) {
        return '';
      }
      const date = new Date(dateStr);
      return Number.isNaN(date.getTime())
        ? ''
        : date.toISOString().slice(0, 16);
    };

    const getString = (value: unknown, fallback: string) =>
      typeof value === 'string' && value.length > 0 ? value : fallback;

    const getArray = <T,>(value: unknown, fallback: T[]) =>
      Array.isArray(value) ? value : fallback;

    const getObject = <T,>(value: unknown, fallback: T) =>
      value && typeof value === 'object' ? (value as T) : fallback;

    const initialFormData = {
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
      visibility: getString(bounty.visibility, 'DRAFT') as
        | 'DRAFT'
        | 'PUBLISHED',
      status: getString(bounty.status, 'OPEN') as
        | 'OPEN'
        | 'REVIEWING'
        | 'COMPLETED'
        | 'CLOSED'
        | 'CANCELLED',
    };

    setHasChanges(JSON.stringify(formData) !== JSON.stringify(initialFormData));
  }, [formData, bounty]);

  const handleInputChange = (field: keyof BountyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWinnings = (position: string, amount: number) => {
    const newWinnings = { ...formData.winnings };
    if (amount > 0) {
      newWinnings[position] = amount;
    } else {
      delete newWinnings[position];
    }
    handleInputChange('winnings', newWinnings);
  };

  const saveBounty = async () => {
    if (!bounty) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            amount: Number(formData.amount),
            deadline: formData.deadline
              ? new Date(formData.deadline).toISOString()
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bounty');
      }

      toast.success('Bounty updated successfully!');
      refreshBounty();
      setHasChanges(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update bounty'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    if (!bounty) {
      return;
    }
    const getDeadline = (dateStr?: string) => {
      if (!dateStr) {
        return '';
      }
      const date = new Date(dateStr);
      return Number.isNaN(date.getTime())
        ? ''
        : date.toISOString().slice(0, 16);
    };

    const getString = (value: unknown, fallback: string) =>
      typeof value === 'string' && value.length > 0 ? value : fallback;

    const getArray = <T,>(value: unknown, fallback: T[]) =>
      Array.isArray(value) ? value : fallback;

    const getObject = <T,>(value: unknown, fallback: T) =>
      value && typeof value === 'object' ? (value as T) : fallback;
    setFormData({
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
      visibility: getString(bounty.visibility, 'DRAFT') as
        | 'DRAFT'
        | 'PUBLISHED',
      status: getString(bounty.status, 'OPEN') as
        | 'OPEN'
        | 'REVIEWING'
        | 'COMPLETED'
        | 'CLOSED'
        | 'CANCELLED',
    });
    
    setHasChanges(false);
  };

  const deleteBounty = async () => {
    if (!bounty) {
      return;
    }

    setIsLoading(true);
    try {
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

      toast.success('Bounty deleted successfully!');
      // Redirect to bounties list
      window.location.href = '/bounties';
    } catch (error) {
      toast.error('Failed to delete bounty');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!bounty) {
    return <div className="text-white">Bounty not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex justify-end gap-2">
        {hasChanges && (
          <Button
            onClick={saveBounty}
            disabled={isSaving}
            className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
          >
            {isSaving ? (
              <Loader2 className=" h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        )}
        {hasChanges && (
          <Button
          variant="ghost"
            onClick={resetChanges}
            className="text-white hover:bg-[#E6007A]/90"
          >
            {<Undo2 className="size-4" />}
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Basic Settings */}
        <div className="space-y-6">
          {/* Prize Distribution */}
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="size-4" />
                Prize Distribution
              </CardTitle>
              <CardDescription className="text-white/60">
                Set the total amount and how it's distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white/80">
                    Total Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange('amount', Number(e.target.value))
                    }
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-white/80">
                    Token
                  </Label>
                  <Select
                    value={formData.token}
                    onValueChange={(value) => handleInputChange('token', value)}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="DOT" className="text-white">
                        DOT
                      </SelectItem>
                      <SelectItem value="USDT" className="text-white">
                        USDT
                      </SelectItem>
                      <SelectItem value="USDC" className="text-white">
                        USDC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Distribution Type</Label>
                <Select
                  value={formData.split}
                  onValueChange={(value: string) =>
                    handleInputChange('split', value)
                  }
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-900">
                    <SelectItem value="FIXED" className="text-white">
                      Fixed Amounts
                    </SelectItem>
                    <SelectItem value="EQUAL_SPLIT" className="text-white">
                      Equal Split
                    </SelectItem>
                    <SelectItem value="VARIABLE" className="text-white">
                      Variable
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.split === 'FIXED' && (
                <div className="space-y-4">
                  <Label className="text-white/80">Winner Prizes</Label>
                  <div className="space-y-2">
                    {Object.keys(formData.winnings)
                      .sort((a, b) => Number(a) - Number(b))
                      .map((position) => (
                        <div key={position} className="flex items-center gap-2">
                          <span className="w-16 text-sm text-white/60">
                            {position}
                            {position === '1'
                              ? 'st'
                              : position === '2'
                                ? 'nd'
                                : position === '3'
                                  ? 'rd'
                                  : 'th'}{' '}
                            Place
                          </span>
                          <Input
                            type="number"
                            value={formData.winnings[position] || ''}
                            onChange={(e) =>
                              updateWinnings(position, Number(e.target.value))
                            }
                            className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            placeholder="0"
                          />
                          <span className="text-sm text-white/60">
                            {formData.token}
                          </span>
                          {Object.keys(formData.winnings).length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="ml-2 text-white/40 hover:text-white"
                              onClick={() => {
                                const newWinnings = { ...formData.winnings };
                                delete newWinnings[position];
                                handleInputChange('winnings', newWinnings);
                              }}
                              aria-label="Remove tier"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
                      onClick={() => {
                        // Find the next available position number
                        const existing = Object.keys(formData.winnings).map(
                          Number
                        );
                        let next = 1;
                        while (existing.includes(next)) {
                          next++;
                        }
                        const newWinnings = {
                          ...formData.winnings,
                          [next]: '',
                        };
                        handleInputChange('winnings', newWinnings);
                      }}
                    >
                      <Plus className="size-4" />
                      Add Winning Tier
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="size-4" />
                Timeline
              </CardTitle>
              <CardDescription className="text-white/60">
                Set submission deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-white/80">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange('deadline', e.target.value)
                  }
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Advanced Settings */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="size-4" />
                Status & Visibility
              </CardTitle>
              <CardDescription className="text-white/60">
                Control bounty visibility and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-2">
                    <Label className="text-white/80">Status</Label>
                    {(() => {
                      if (formData.status === 'OPEN') {
                        return (
                          <Select
                            value={formData.status}
                            onValueChange={(value: string) =>
                              handleInputChange('status', value)
                            }
                          >
                            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-zinc-900">
                              <SelectItem value="OPEN" className="text-white">
                                Open
                              </SelectItem>
                              <SelectItem value="CLOSED" className="text-white">
                                Closed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      }

                      if (formData.status === 'REVIEWING') {
                        return (
                          <Select
                            value={formData.status}
                            onValueChange={(value: string) =>
                              handleInputChange('status', value)
                            }
                          >
                            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-zinc-900">
                              <SelectItem
                                value="REVIEWING"
                                className="text-white"
                              >
                                Reviewing
                              </SelectItem>
                              <SelectItem
                                value="CANCELLED"
                                className="text-white"
                              >
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      }

                      return (
                        <Select value={formData.status} disabled>
                          <SelectTrigger className="w-full cursor-not-allowed border-white/10 bg-white/5 text-white opacity-60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-zinc-900">
                            <SelectItem
                              value={formData.status}
                              className="text-white"
                            >
                              {formData.status.charAt(0) +
                                formData.status.slice(1).toLowerCase()}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-white/80">Visibility</Label>
                    <Select
                      value={formData.visibility}
                      onValueChange={(value: string) =>
                        handleInputChange('visibility', value)
                      }
                    >
                      <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-900">
                        <SelectItem value="DRAFT" className="text-white">
                          Draft (Private)
                        </SelectItem>
                        <SelectItem value="PUBLISHED" className="text-white">
                          Published (Public)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(formData.status === 'CLOSED' || formData.status === 'CANCELLED') && (
                  <div className="flex items-center  ml-2 mt-2 text-xs text-[#E6007A] gap-1">
                    <TriangleAlert className="size-4" />
                    Warning: {(formData.status === 'CLOSED' ? 'Closing' : 'Canceling')} the bounty is{' '}
                    <span className="font-semibold">irreversible</span>.
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white/5 p-3">
                <div className="mb-2 text-sm text-white/60">Current Info</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/80">Created:</span>
                    <span className="text-white">
                      {new Date(bounty.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {bounty.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-white/80">Published:</span>
                      <span className="text-white">
                        {new Date(bounty.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/80">Submissions:</span>
                    <span className="text-white">{bounty.submissionCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/30 bg-red-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                Delete Bounty
              </CardTitle>
              <CardDescription className="text-red-400/60">
                This will permanently delete the bounty and all associated data.
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {showDeleteConfirm ? (
                    <div className="space-y-2">
                      <p className="text-red-400/80 text-sm">
                        Are you sure? Type "DELETE" to confirm.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Type DELETE to confirm"
                          className="border-red-500/50 bg-white/5 text-white placeholder:text-white/40"
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' &&
                              e.currentTarget.value === 'DELETE'
                            ) {
                              deleteBounty();
                            }
                          }}
                        />
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="size-4" />
                      Delete Bounty
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
