import { Button } from "@packages/base/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export function FormNavigation({
  currentStep,
  maxStep,
  onBack,
  onNext,
  onSubmit,
  submitting,
}: {
  currentStep: number;
  maxStep: number;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex justify-between pt-4">
      <Button
        className="border-white/20 text-white hover:bg-white/10"
        onClick={onBack}
        type="button"
        variant="outline"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {currentStep > 1 ? "Back" : "Cancel"}
      </Button>

      {currentStep < maxStep ? (
        <Button
          className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
          onClick={onNext}
          type="button"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
          disabled={submitting}
          onClick={onSubmit}
          type="button"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Grant"
          )}
        </Button>
      )}
    </div>
  );
}
