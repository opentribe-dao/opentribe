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
        className="border-white/20 text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        {currentStep > 1 ? "Back" : "Cancel"}
      </Button>

      {currentStep < maxStep ? (
        <Button
          onClick={onNext}
          className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
            </>
          ) : (
            "Update Grant"
          )}
        </Button>
      )}
    </div>
  );
}