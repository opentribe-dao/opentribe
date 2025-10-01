'use client';

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
import { MarkdownEditor, FileUpload } from '@packages/base';
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
import { useEffect } from 'react';
import { Header } from '../../components/header';
import { PrizeDistributionCard } from '../../components/bounty/settings/prize-distribution-card';
import { useBountyForm } from '@/hooks/use-bounty';

const STEPS = [
  { id: 1, name: 'Details', description: 'Basic information' },
  { id: 2, name: 'Rewards', description: 'Prize distribution' },
  { id: 3, name: 'Requirements', description: 'Submission criteria' },
  { id: 4, name: 'Publish', description: 'Review and publish' },
];

const SKILLS = [
  'Rust',
  'Substrate',
  'Polkadot SDK',
  'Smart Contracts',
  'ink!',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Web3.js',
  'UI/UX Design',
  'Technical Writing',
  'Marketing',
  'Community Management',
  'DeFi',
  'NFTs',
  'Governance',
  'Research',
  'Data Analysis',
];

const CreateBountyPage = () => {
  const router = useRouter();

  const {
    session,
    sessionLoading,
    activeOrg,
    orgLoading,
    currentStep,
    submitting,
    formData,
    updateFormData,
    handleNext,
    updateWinnings,
    handleBack,
    handleSubmit,
    addSkill,
    removeSkill,
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
  } = useBountyForm();

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/sign-in');
    }
  }, [session, sessionLoading, router]);

  // Show loading state while checking authentication
  if (sessionLoading || orgLoading) {
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header pages={['Overview', 'Bounties']} page="Create Bounty" />
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
                    className={`font-medium text-sm ${
                      currentStep >= step.id ? 'text-white' : 'text-white/60'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className='text-white/40 text-xs'>{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-px w-24 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="border-white/10 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Bounty Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder="e.g., Build a Substrate Pallet for NFT Marketplace"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <div className="mt-2">
                    <MarkdownEditor
                      value={formData.description ?? ''}
                      onChange={(value) => updateFormData('description', value)}
                      placeholder="Describe what you need built, the problem it solves, and any specific requirements..."
                      height={350}
                    />
                  </div>
                </div>

                <div>
                  <Label>Required Skills *</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(formData.skills ?? []).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="border-0 bg-[#E6007A]/20 text-[#E6007A]"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.filter(
                        (s) => formData.skills && !formData.skills.includes(s)
                      ).map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                          onClick={() => addSkill(skill)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <PrizeDistributionCard
                  formData={formData}
                  updateFormData={updateFormData}
                  updateWinnings={updateWinnings}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
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
                      className='border-white/10 bg-white/5 text-white'
                    />
                    <CalendarIcon className='-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-white/40' />
                  </div>
                </div>

                <div>
                  <div className='mb-3 flex items-center justify-between'>
                    <Label>Resources</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addResource}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Resource
                    </Button>
                  </div>
                  {formData.resources && formData.resources.length > 0 ? (
                    <div className="space-y-3">
                      {formData.resources.map((resource, index) => (
                        <div
                          key={index}
                          className='space-y-3 rounded-lg bg-white/5 p-4'
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(index, 'title', e.target.value)
                                }
                                placeholder="Resource title"
                                className='border-white/10 bg-white/5 text-white'
                              />
                              <Input
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(index, 'url', e.target.value)
                                }
                                placeholder="https://..."
                                className='border-white/10 bg-white/5 text-white'
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
                                className='border-white/10 bg-white/5 text-white'
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResource(index)}
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
                      No resources added yet
                    </p>
                  )}
                </div>

                <div>
                  <Label>Resource Files</Label>
                  <p className='mb-3 text-sm text-white/40'>
                    Upload PDF documents, images, or other files as resources
                    for participants
                  </p>
                  <FileUpload
                    type="resource"
                    maxFiles={10}
                    value={formData.resourceFiles}
                    onChange={(urls) => updateFormData('resourceFiles', urls)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <div className='mb-3 flex items-center justify-between'>
                    <Label>Screening Questions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addScreeningQuestion}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Question
                    </Button>
                  </div>
                  {formData.screening && formData.screening.length > 0 ? (
                    <div className="space-y-3">
                      {formData.screening.map((question, index) => (
                        <div
                          key={index}
                          className='space-y-3 rounded-lg bg-white/5 p-4'
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
                                className='border-white/10 bg-white/5 text-white'
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
                                  <SelectTrigger className='w-32 border-white/10 bg-white/5 text-white'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className='border-white/10 bg-zinc-900'>
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
                      No screening questions added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className='space-y-4 rounded-lg bg-white/5 p-6'>
                  <h3 className='font-medium text-lg text-white'>
                    Review Your Bounty
                  </h3>

                  <div>
                    <p className="text-sm text-white/60">Title</p>
                    <p className="text-white">{formData.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Description</p>
                    <p className='whitespace-pre-wrap text-white'>
                      {formData.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Skills Required</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(formData.skills ?? []).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="border-0 bg-white/10 text-white"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Total Reward</p>
                    <p className="text-white">
                      {formData.amount} {formData.token}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Winner Distribution</p>
                    <div className="mt-1 space-y-1">
                      {formData.winnings &&
                        Object.entries(formData.winnings).map(
                          ([position, amount], index) => (
                            <p key={position} className="text-white">
                              {index === 0
                                ? '1st'
                                : index === 1
                                  ? '2nd'
                                  : index === 2
                                    ? '3rd'
                                    : `${position}th`}{' '}
                              Place: {amount} {formData.token}
                            </p>
                          )
                        )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Deadline</p>
                    <p className="text-white">
                      {formData.deadline &&
                        new Date(formData.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Visibility</Label>
                  <div className='mt-2 flex gap-4'>
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
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep > 1 ? 'Back' : 'Cancel'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
            >
              {submitting && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              )}
              {!submitting &&
                formData.visibility === 'PUBLISHED' &&
                'Publish Bounty'}
              {!submitting &&
                formData.visibility !== 'PUBLISHED' &&
                'Save Draft'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateBountyPage;
