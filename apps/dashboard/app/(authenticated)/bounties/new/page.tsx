'use client';

import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { MarkdownEditor } from '@packages/base';
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
import { useBountyForm, useBountySkills } from '@/hooks/use-manage-bounty';
import { defineStepper } from '@stepperize/react';

// NOTE: No Zod validation in Stepperize, just for navigation/step logic—this keeps your own logic unchanged for now!

// Define shared stepper with ids/names matching old STEPS
const { useStepper, steps, utils } = defineStepper(
  { id: 'details', label: 'Details' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'publish', label: 'Publish' }
);

const STEP_ID_MAP: Record<number, string> = {
  1: 'details',
  2: 'rewards',
  3: 'requirements',
  4: 'publish',
};

const CURRENT_STEP_TO_ID = (step: number) => STEP_ID_MAP[step] || 'details';

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

  const { data: SKILLS = [] } = useBountySkills();

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/sign-in');
    }
  }, [session, sessionLoading, router]);

   const stepper = useStepper({
    initialStep: CURRENT_STEP_TO_ID(currentStep) as "details" | "rewards" | "requirements" | "publish",
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
      <Header pages={['Overview', 'Bounties']} page="Create Bounty" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between px-8">
          <nav aria-label="Stepperize Steps" className="w-full">
            <ol className="flex w-full items-center justify-between gap-2">
              {stepper.all.map((step, index, array) => (
                <div key={step.id} className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <Button
                      type="button"
                      variant={
                        index < currentIndex
                          ? 'secondary'
                          : index === currentIndex
                            ? 'default'
                            : 'secondary'
                      }
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index < currentIndex
                          ? 'bg-green-500 text-white'
                          : index === currentIndex
                            ? 'bg-[#E6007A] text-white'
                            : 'bg-white/10 text-white/60'
                      }`}
                      // onClick={() => handleStepperNav(step.id, index)}
                      aria-current={index === currentIndex ? 'step' : undefined}
                      aria-selected={index === currentIndex}
                    >
                      {index < currentIndex ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </Button>
                    
                  </div>
                  <div className="mx-4  text-center">
                      <p
                        className={`font-medium text-sm ${
                          index <= currentIndex
                            ? 'text-white'
                            : 'text-white/60'
                        }`}
                      >
                        {step.label}
                      </p>
                      {/* <p className="text-white/40 text-xs">
                        {[
                          'Basic information',
                          'Prize distribution',
                          'Submission criteria',
                          'Review and publish',
                        ][index]}
                      </p> */}
                    </div>
                  {index < array.length - 1 && (
                    <div
                      className={`mx-2 h-px w-[200] ${
                        index < currentIndex ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <Card className="border-white/10 bg-white/10 backdrop-blur-[10px]">
          <CardContent>
            {stepper.switch({
              details: () =>
                // Your Step 1
                (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Bounty Title *</Label>
                      <div className="mt-2">
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData('title', e.target.value)}
                          placeholder="e.g., Build a Substrate Pallet for NFT Marketplace"
                          className="border-white/10 bg-white/5 text-white"
                        />
                      </div>
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
                ),
              rewards: () =>
                // Your Step 2
                (
                  <div className="space-y-6">
                    <PrizeDistributionCard
                      formData={formData}
                      updateFormData={updateFormData}
                      updateWinnings={updateWinnings}
                    />
                  </div>
                ),
              requirements: () =>
                // Your Step 3
                (
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
                          className="border-white/10 bg-white/5 text-white"
                        />
                        <CalendarIcon className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-white/40" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <Label>Resources</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addResource}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Resource
                        </Button>
                      </div>
                      {formData.resources && formData.resources.length > 0 ? (
                        <div className="space-y-3">
                          {formData.resources.map((resource, index) => (
                            <div
                              key={index}
                              className="space-y-3 rounded-lg bg-white/5 p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                  <Input
                                    value={resource.title}
                                    onChange={(e) =>
                                      updateResource(index, 'title', e.target.value)
                                    }
                                    placeholder="Resource title"
                                    className="border-white/10 bg-white/5 text-white"
                                  />
                                  <Input
                                    value={resource.url}
                                    onChange={(e) =>
                                      updateResource(index, 'url', e.target.value)
                                    }
                                    placeholder="https://..."
                                    className="border-white/10 bg-white/5 text-white"
                                  />
                                  <Input
                                    value={resource.description}
                                    onChange={(e) =>
                                      updateResource(index, 'description', e.target.value)
                                    }
                                    placeholder="Brief description (optional)"
                                    className="border-white/10 bg-white/5 text-white"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeResource(index)}
                                  className="ml-2 text-white/60 hover:text-white"
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
                      <div className="mb-3 flex items-center justify-between">
                        <Label>Screening Questions</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addScreeningQuestion}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      </div>
                      {formData.screening && formData.screening.length > 0 ? (
                        <div className="space-y-3">
                          {formData.screening.map((question, index) => (
                            <div
                              key={index}
                              className="space-y-3 rounded-lg bg-white/5 p-4"
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
                                    className="border-white/10 bg-white/5 text-white"
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
                                      <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="border-white/10 bg-zinc-900">
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
                                  className="ml-2 text-white/60 hover:text-white"
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
              publish: () =>
                // Your Step 4
                (
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-lg bg-white/5 p-6">
                      <h3 className="font-medium text-lg text-white">
                        Review Your Bounty
                      </h3>

                      <div>
                        <p className="text-sm text-white/60">Title</p>
                        <p className="text-white">{formData.title}</p>
                      </div>

                      <div>
                        <p className="text-sm text-white/60">Description</p>
                        <p className="whitespace-pre-wrap text-white">
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
                      <div className="mt-2 flex gap-4">
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
                ),
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentIndex > 0 ? () => { handleBackStep() } : () => router.back()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentIndex > 0 ? 'Back' : 'Cancel'}
          </Button>

          {currentIndex < steps.length - 1 ? (
            <Button
              onClick={() => {handleNextStep()}}
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
              {!submitting && formData.visibility === 'PUBLISHED' && 'Publish Bounty'}
              {!submitting && formData.visibility !== 'PUBLISHED' && 'Save Draft'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateBountyPage;