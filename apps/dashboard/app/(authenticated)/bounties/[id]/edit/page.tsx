'use client';

import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { Textarea } from '@packages/base/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Badge } from '@packages/base/components/ui/badge';
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';
import { Header } from '../../../components/header';
import { env } from '@/env';
import { MarkdownEditor } from '@packages/base/components/ui/markdown-editor';
import SkillsOptions from '@packages/base/components/ui/skills-options';

const STEPS = [
  { id: 1, name: 'Details', description: 'Basic information' },
  { id: 2, name: 'Rewards', description: 'Prize distribution' },
  { id: 3, name: 'Requirements', description: 'Submission criteria' },
  { id: 4, name: 'Publish', description: 'Review and publish' },
];

const TOKENS = [
  { value: 'DOT', label: 'DOT' },
  { value: 'KSM', label: 'KSM' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

interface BountyFormData {
  // Step 1: Details
  title: string;
  description: string;
  skills: string[];

  // Step 2: Rewards
  totalAmount: string;
  token: string;
  split: 'FIXED' | 'EQUAL_SPLIT' | 'VARIABLE';
  winners: Array<{ position: number; amount: string; percentage?: number }>;

  // Step 3: Requirements
  deadline: string;
  resources: Array<{ title: string; url: string; description: string }>;
  screening: Array<{
    question: string;
    type: 'text' | 'url' | 'file';
    optional: boolean;
  }>;

  // Step 4: Publish
  visibility: 'DRAFT' | 'PUBLISHED';
}

const EditBountyPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<BountyFormData>({
    title: '',
    description: '',
    skills: [],
    totalAmount: '',
    token: 'DOT',
    split: 'FIXED',
    winners: [
      { position: 1, amount: '' },
      { position: 2, amount: '' },
      { position: 3, amount: '' },
    ],
    deadline: '',
    resources: [],
    screening: [],
    visibility: 'DRAFT',
  });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/sign-in');
    }
  }, [session, sessionLoading, router]);

  // Fetch existing bounty data
  useEffect(() => {
    const fetchBounty = async () => {
      if (!id) return;

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch bounty');
        }

        const data = await response.json();
        const bounty = data.bounty;

        // Transform bounty data to form data
        const winningsData = bounty.winnings || {};
        const winners = Object.entries(winningsData)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([position, amount]) => ({
            position: Number(position),
            amount: String(amount),
          }));

        setFormData({
          title: bounty.title,
          description: bounty.description,
          skills: bounty.skills || [],
          totalAmount: String(bounty.amount || ''),
          token: bounty.token,
          split: bounty.split,
          winners,
          deadline: bounty.deadline
            ? new Date(bounty.deadline).toISOString().split('T')[0]
            : '',
          resources: bounty.resources || [],
          screening: bounty.screening || [],
          visibility: bounty.visibility,
        });
      } catch (error) {
        console.error('Error fetching bounty:', error);
        toast.error('Failed to load bounty data');
        router.push('/bounties');
      } finally {
        setLoading(false);
      }
    };

    if (!sessionLoading && session?.user) {
      fetchBounty();
    }
  }, [id, sessionLoading, session, router]);

  // Show loading state while checking authentication
  if (sessionLoading || orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  // If user is not authenticated
  if (!session?.user) {
    return null;
  }

  // If still loading organization (shouldn't happen with auto-select, but just in case)
  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  const updateFormData = (field: keyof BountyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = (skills: string[]) => {
    updateFormData('skills', skills);
  };
  const removeSkill = (skill: string) => {
    updateFormData(
      'skills',
      formData.skills.filter((s) => s !== skill)
    );
  };

  const addWinner = () => {
    const newPosition = formData.winners.length + 1;
    updateFormData('winners', [
      ...formData.winners,
      { position: newPosition, amount: '' },
    ]);
  };

  const removeWinner = (position: number) => {
    updateFormData(
      'winners',
      formData.winners.filter((w) => w.position !== position)
    );
  };

  const updateWinner = (position: number, amount: string) => {
    updateFormData(
      'winners',
      formData.winners.map((w) =>
        w.position === position ? { ...w, amount } : w
      )
    );
  };

  const addResource = () => {
    updateFormData('resources', [
      ...formData.resources,
      { title: '', url: '', description: '' },
    ]);
  };

  const removeResource = (index: number) => {
    updateFormData(
      'resources',
      formData.resources.filter((_, i) => i !== index)
    );
  };

  const updateResource = (
    index: number,
    field: keyof (typeof formData.resources)[0],
    value: string
  ) => {
    updateFormData(
      'resources',
      formData.resources.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const addScreeningQuestion = () => {
    updateFormData('screening', [
      ...formData.screening,
      { question: '', type: 'text', optional: false },
    ]);
  };

  const removeScreeningQuestion = (index: number) => {
    updateFormData(
      'screening',
      formData.screening.filter((_, i) => i !== index)
    );
  };

  const updateScreeningQuestion = (
    index: number,
    field: keyof (typeof formData.screening)[0],
    value: any
  ) => {
    updateFormData(
      'screening',
      formData.screening.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (
          !formData.title ||
          !formData.description ||
          formData.skills.length === 0
        ) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        if (!formData.totalAmount || formData.winners.some((w) => !w.amount)) {
          toast.error('Please specify all reward amounts');
          return false;
        }
        // Check if winner amounts add up to total
        const total = parseFloat(formData.totalAmount);
        const winnersTotal = formData.winners.reduce(
          (sum, w) => sum + parseFloat(w.amount || '0'),
          0
        );
        if (Math.abs(total - winnersTotal) > 0.01) {
          toast.error('Winner rewards must add up to the total amount');
          return false;
        }
        return true;
      case 3:
        if (!formData.deadline) {
          toast.error('Please set a deadline');
          return false;
        }
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
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setSubmitting(true);

      // Prepare the bounty data for API
      const bountyData = {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        amount: Number.parseFloat(formData.totalAmount),
        token: formData.token,
        split: formData.split,
        winnings: formData.winners.reduce(
          (acc, w) => ({
            ...acc,
            [w.position]: Number.parseFloat(w.amount),
          }),
          {}
        ),
        deadline: new Date(formData.deadline).toISOString(),
        resources: formData.resources.filter((r) => r.title && r.url),
        screening: formData.screening.filter((q) => q.question),
        visibility: formData.visibility,
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(bountyData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update bounty');
      }

      const result = await response.json();
      toast.success('Bounty updated successfully!');
      router.push(`/bounties/${id}`);
    } catch (error) {
      console.error('Bounty update failed:', error);
      toast.error('Failed to update bounty. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header pages={['Overview', 'Bounties']} page="Edit Bounty" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-[#E6007A] text-white'
                        : 'bg-white/10 text-white/60'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-white' : 'text-white/60'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-white/40">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-px w-24 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Bounty Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder="e.g., Build a Substrate Pallet for NFT Marketplace"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <MarkdownEditor
                    value={formData.description}
                    onChange={(value) => updateFormData('description', value)}
                    placeholder="Provide a detailed description of what you're looking for..."
                    height={400}
                  />
                </div>

                <div>
                  <Label>Required Skills *</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <SkillsOptions
                        value={formData.skills ?? []}
                        onChange={(skills) => {
                          addSkill(skills);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Reward Amount *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        updateFormData('totalAmount', e.target.value)
                      }
                      placeholder="1000"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token *</Label>
                    <Select
                      value={formData.token}
                      onValueChange={(value) => updateFormData('token', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        {TOKENS.map((token) => (
                          <SelectItem
                            key={token.value}
                            value={token.value}
                            className="text-white"
                          >
                            {token.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Reward Distribution *</Label>
                  <p className="text-sm text-white/60 mb-4">
                    Specify how rewards will be distributed among winners
                  </p>
                  <div className="space-y-3">
                    {formData.winners.map((winner, index) => (
                      <div
                        key={winner.position}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-white/60 w-20">
                          {index === 0
                            ? '1st Place'
                            : index === 1
                              ? '2nd Place'
                              : index === 2
                                ? '3rd Place'
                                : `${winner.position}th Place`}
                        </span>
                        <Input
                          type="number"
                          value={winner.amount}
                          onChange={(e) =>
                            updateWinner(winner.position, e.target.value)
                          }
                          placeholder="Amount"
                          className="bg-white/5 border-white/10 text-white flex-1"
                        />
                        <span className="text-white/60">{formData.token}</span>
                        {index > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWinner(winner.position)}
                            className="text-white/60 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addWinner}
                    className="mt-3 border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Winner Tier
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Submission Deadline *</Label>
                  <div className="relative">
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        updateFormData('deadline', e.target.value)
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Resources</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addResource}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </div>
                  {formData.resources.length > 0 ? (
                    <div className="space-y-3">
                      {formData.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(index, 'title', e.target.value)
                                }
                                placeholder="Resource title"
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <Input
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(index, 'url', e.target.value)
                                }
                                placeholder="https://..."
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <Input
                                value={resource.description}
                                onChange={(e) =>
                                  updateResource(
                                    index,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Brief description (optional)"
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResource(index)}
                              className="text-white/60 hover:text-white ml-2"
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
                  <div className="flex items-center justify-between mb-3">
                    <Label>Screening Questions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addScreeningQuestion}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  {formData.screening.length > 0 ? (
                    <div className="space-y-3">
                      {formData.screening.map((question, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={question.question}
                                onChange={(e) =>
                                  updateScreeningQuestion(
                                    index,
                                    'question',
                                    e.target.value
                                  )
                                }
                                placeholder="Enter your question"
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <div className="flex items-center gap-3">
                                <Select
                                  value={question.type}
                                  onValueChange={(value) =>
                                    updateScreeningQuestion(
                                      index,
                                      'type',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-white/10">
                                    <SelectItem
                                      value="text"
                                      className="text-white"
                                    >
                                      Text
                                    </SelectItem>
                                    <SelectItem
                                      value="url"
                                      className="text-white"
                                    >
                                      URL
                                    </SelectItem>
                                    <SelectItem
                                      value="file"
                                      className="text-white"
                                    >
                                      File
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <label className="flex items-center gap-2 text-sm text-white/60">
                                  <input
                                    type="checkbox"
                                    checked={question.optional}
                                    onChange={(e) =>
                                      updateScreeningQuestion(
                                        index,
                                        'optional',
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-white/20"
                                  />
                                  Optional
                                </label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScreeningQuestion(index)}
                              className="text-white/60 hover:text-white ml-2"
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
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Review Your Bounty
                  </h3>

                  <div>
                    <p className="text-sm text-white/60">Title</p>
                    <p className="text-white">{formData.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Description</p>
                    <p className="text-white whitespace-pre-wrap">
                      {formData.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Skills Required</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-white/10 text-white border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Total Reward</p>
                    <p className="text-white">
                      {formData.totalAmount} {formData.token}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Winner Distribution</p>
                    <div className="space-y-1 mt-1">
                      {formData.winners.map((winner, index) => (
                        <p key={winner.position} className="text-white">
                          {index === 0
                            ? '1st'
                            : index === 1
                              ? '2nd'
                              : index === 2
                                ? '3rd'
                                : `${winner.position}th`}{' '}
                          Place: {winner.amount} {formData.token}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Deadline</p>
                    <p className="text-white">
                      {new Date(formData.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Visibility</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="DRAFT"
                        checked={formData.visibility === 'DRAFT'}
                        onChange={(e) =>
                          updateFormData('visibility', e.target.value)
                        }
                        className="text-[#E6007A]"
                      />
                      <span className="text-white">Save as Draft</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="PUBLISHED"
                        checked={formData.visibility === 'PUBLISHED'}
                        onChange={(e) =>
                          updateFormData('visibility', e.target.value)
                        }
                        className="text-[#E6007A]"
                      />
                      <span className="text-white">Publish Now</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep > 1 ? handleBack : () => router.back()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep > 1 ? 'Back' : 'Cancel'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Bounty'
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default EditBountyPage;
