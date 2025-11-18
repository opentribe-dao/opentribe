import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { CalendarIcon, Plus, X } from "lucide-react";
import type { BountyDetails } from "@/hooks/use-bounty";

interface BountyRequirementsProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
}

export const BountyRequirementsStepComponent: React.FC<
  BountyRequirementsProps
> = ({ formData, updateFormData }) => {
  // const {
  //   addResource,
  //   removeResource,
  //   updateResource,
  //   addScreeningQuestion,
  //   removeScreeningQuestion,
  //   updateScreeningQuestion,
  // } = useBountyForm();

  const addResource = () => {
    updateFormData("resources", [
      ...(formData.resources ?? []),
      { title: "", url: "", description: "" },
    ]);
  };

  const removeResource = (index: number) => {
    updateFormData(
      "resources",
      (formData.resources ?? []).filter((_, i) => i !== index)
    );
  };

  const updateResource = (
    index: number,
    field: keyof NonNullable<BountyDetails["resources"]>[number],
    value: string
  ) => {
    updateFormData(
      "resources",
      (formData.resources ?? []).map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const addScreeningQuestion = () => {
    updateFormData("screening", [
      ...(formData.screening ?? []),
      { question: "", type: "text", optional: false },
    ]);
  };

  const removeScreeningQuestion = (index: number) => {
    updateFormData(
      "screening",
      (formData.screening ?? []).filter((_, i) => i !== index)
    );
  };

  const updateScreeningQuestion = (
    index: number,
    field: keyof NonNullable<typeof formData.screening>[number],
    value: string | boolean
  ) => {
    updateFormData(
      "screening",
      (formData.screening ?? []).map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="deadline">Submission Deadline *</Label>
        <div className="relative mt-2">
          <Input
            className="border-white/10 bg-white/5 text-white"
            id="deadline"
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => updateFormData("deadline", e.target.value)}
            type="date"
            value={formData.deadline}
          />
          <CalendarIcon className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-white/40" />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Resources</Label>
          <Button
            className="border-white/20 text-white hover:bg-white/10"
            onClick={addResource}
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
        {formData.resources && formData.resources.length > 0 ? (
          <div className="space-y-3">
            {formData.resources.map((resource, index) => (
              <div className="space-y-3 rounded-lg bg-white/5 p-4" key={index}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <Input
                      className="border-white/10 bg-white/5 text-white"
                      onChange={(e) =>
                        updateResource(index, "title", e.target.value)
                      }
                      placeholder="Resource title"
                      value={resource.title}
                    />
                    <Input
                      className="border-white/10 bg-white/5 text-white"
                      onChange={(e) =>
                        updateResource(index, "url", e.target.value)
                      }
                      placeholder="https://..."
                      value={resource.url}
                    />
                    <Input
                      className="border-white/10 bg-white/5 text-white"
                      onChange={(e) =>
                        updateResource(index, "description", e.target.value)
                      }
                      placeholder="Brief description (optional)"
                      value={resource.description}
                    />
                  </div>
                  <Button
                    className="ml-2 text-white/60 hover:text-white"
                    onClick={() => removeResource(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No resources added yet</p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Screening Questions</Label>
          <Button
            className="border-white/20 text-white hover:bg-white/10"
            onClick={addScreeningQuestion}
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
        {formData.screening && formData.screening.length > 0 ? (
          <div className="space-y-3">
            {formData.screening.map((question, index) => (
              <div className="space-y-3 rounded-lg bg-white/5 p-4" key={index}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <Input
                      className="border-white/10 bg-white/5 text-white"
                      onChange={(e) =>
                        updateScreeningQuestion(
                          index,
                          "question",
                          e.target.value
                        )
                      }
                      placeholder="Enter your question"
                      value={question.question}
                    />
                    <div className="flex items-center gap-3">
                      <Select
                        onValueChange={(value) =>
                          updateScreeningQuestion(index, "type", value)
                        }
                        value={question.type}
                      >
                        <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-zinc-900">
                          <SelectItem className="text-white" value="text">
                            Text
                          </SelectItem>
                          <SelectItem className="text-white" value="url">
                            URL
                          </SelectItem>
                          <SelectItem className="text-white" value="file">
                            File
                          </SelectItem>
                          <SelectItem className="text-white" value="boolean">
                            Boolean
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-2 text-sm text-white/60">
                        <input
                          checked={question.optional}
                          className="rounded border-white/20"
                          onChange={(e) =>
                            updateScreeningQuestion(
                              index,
                              "optional",
                              e.target.checked
                            )
                          }
                          type="checkbox"
                        />
                        Optional
                      </label>
                    </div>
                  </div>
                  <Button
                    className="ml-2 text-white/60 hover:text-white"
                    onClick={() => removeScreeningQuestion(index)}
                    size="sm"
                    variant="ghost"
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
  );
};
