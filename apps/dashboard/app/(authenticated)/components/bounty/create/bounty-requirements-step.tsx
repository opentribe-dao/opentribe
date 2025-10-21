import type { BountyDetails } from '@/hooks/use-bounty';
import { useBountyForm } from '@/hooks/use-manage-bounty';
import { Button } from '@packages/base/components/ui/button';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@packages/base/components/ui/select';
import { CalendarIcon, Plus, X } from 'lucide-react';

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
  const {
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
  } = useBountyForm();

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="deadline">Submission Deadline *</Label>
        <div className="relative mt-2">
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => updateFormData('deadline', e.target.value)}
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
              <div key={index} className="space-y-3 rounded-lg bg-white/5 p-4">
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
          <p className="text-sm text-white/40">No resources added yet</p>
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
              <div key={index} className="space-y-3 rounded-lg bg-white/5 p-4">
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
                          updateScreeningQuestion(index, 'type', value)
                        }
                      >
                        <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-zinc-900">
                          <SelectItem value="text" className="text-white">
                            Text
                          </SelectItem>
                          <SelectItem value="url" className="text-white">
                            URL
                          </SelectItem>
                          <SelectItem value="file" className="text-white">
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
  );
};
