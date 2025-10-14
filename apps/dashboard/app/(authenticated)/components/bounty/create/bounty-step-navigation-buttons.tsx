import type { BountyDetails } from '@/hooks/use-bounty';
import { useBountyForm } from '@/hooks/use-manage-bounty';
import { Button } from '@packages/base/components/ui/button';
import type { Step } from '@stepperize/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import router from 'next/router';

interface BountyStepNavigationButtonsProps {
  formData: Partial<BountyDetails>;
  currentIndex: number;
  steps: Step[];
  stepper: {
    next: () => void;
    prev: () => void;
  };
}

export const BountyStepNavigationButtonsComponent: React.FC<
  BountyStepNavigationButtonsProps
> = ({ formData, currentIndex, steps, stepper }) => {
  const { submitting, handleNext, handleBack, handleSubmit } = useBountyForm();
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
          {!submitting && formData.visibility !== 'PUBLISHED' && 'Save Draft'}
        </Button>
      )}
    </div>
  );
};
