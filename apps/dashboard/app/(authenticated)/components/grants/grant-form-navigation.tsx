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
        variant="outline"
        onClick={onBack}
        type="button"
        className="border-white/20 text-white hover:bg-white/10"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {currentStep > 1 ? "Back" : "Cancel"}
      </Button>

      {currentStep < maxStep ? (
        <Button
          onClick={onNext}
          type ="button"
          className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          type="button"
          disabled={submitting}
          className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
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