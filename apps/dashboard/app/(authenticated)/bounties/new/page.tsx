'use client';

import { Button } from '@packages/base/components/ui/button';
import { Card, CardContent } from '@packages/base/components/ui/card';
import {
} from '@packages/base/components/ui/select';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '../../components/header';
import { PrizeDistributionCard } from '../../components/bounty/settings/prize-distribution-card';
import { useBountyForm, useBountySkills } from '@/hooks/use-manage-bounty';
import { defineStepper } from '@stepperize/react';
import { BountyDetailStepComponent } from '../../components/bounty/create/bounty-detail-step';
import { BountyRequirementsStepComponent } from '../../components/bounty/create/bounty-requirements-step';
import { BountyReviewStepComponent } from '../../components/bounty/create/bounty-review-step';


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
  } = useBountyForm();

  const { data: SKILLS = [] } = useBountySkills();

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/sign-in');
    }
  }, [session, sessionLoading, router]);

  const stepper = useStepper({
    initialStep: CURRENT_STEP_TO_ID(currentStep) as
      | 'details'
      | 'rewards'
      | 'requirements'
      | 'publish',
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
                <div
                  key={step.id}
                  className="flex items-center justify-between"
                >
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
                  <div className="mx-4 text-center">
                    <p
                      className={`font-medium text-sm ${
                        index <= currentIndex ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {step.label}
                    </p>
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
              details: () => (
                <BountyDetailStepComponent
                  formData={formData}
                  updateFormData={updateFormData}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                  skills={SKILLS}
                />
              ),
              rewards: () => (
                // Your Step 2
                <div className="space-y-6">
                  <PrizeDistributionCard
                    formData={formData}
                    updateFormData={updateFormData}
                    updateWinnings={updateWinnings}
                  />
                </div>
              ),

              requirements: () => (
                <BountyRequirementsStepComponent
                  formData={formData}
                  updateFormData={updateFormData}
                />
              ),
              publish: () => (
                <BountyReviewStepComponent
                  formData={formData}
                  updateFormData={updateFormData}
                />
              ),
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={
              currentIndex > 0
                ? () => {
                    handleBackStep();
                  }
                : () => router.back()
            }
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentIndex > 0 ? 'Back' : 'Cancel'}
          </Button>

          {currentIndex < steps.length - 1 ? (
            <Button
              onClick={() => {
                handleNextStep();
              }}
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
