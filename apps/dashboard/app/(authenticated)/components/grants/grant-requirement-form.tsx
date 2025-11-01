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
import { Plus, X } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

export function GrantRequirementsForm() {
  const { register, control, setValue, watch } = useFormContext();
  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
    update: updateResource,
  } = useFieldArray({
    control,
    name: 'resources',
  });
  const {
    fields: screeningFields,
    append: appendScreening,
    remove: removeScreening,
    update: updateScreening,
  } = useFieldArray({
    control,
    name: 'screening',
  });

  const applicationUrl = watch('applicationUrl');

  return (
    <div className="space-y-6">
      <div>
        <Label>External Application URL</Label>
        <Input
          {...register('applicationUrl')}
          placeholder="https://..."
          className="border-white/10 bg-white/5 text-white"
        />
        <p className="mt-1 text-sm text-white/40">
          If you have an external application form, provide the URL here.
        </p>
      </div>

      {/* Resources */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Resources</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              appendResource({ title: '', url: '', description: '' })
            }
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
        {resourceFields.length > 0 ? (
          <div className="space-y-3">
            {resourceFields.map((field, index) => (
              <div
                key={index}
                className="flex flex-col space-y-3 rounded-lg bg-white/5 p-4"
              >
                <Input
                  {...register(`resources.${index}.title`)}
                  placeholder="Resource title"
                  className="border-white/10 bg-white/5 text-white"
                />
                <Input
                  {...register(`resources.${index}.url`)}
                  placeholder="https://..."
                  className="border-white/10 bg-white/5 text-white"
                />
                <Input
                  {...register(`resources.${index}.description`)}
                  placeholder="Brief description (optional)"
                  className="border-white/10 bg-white/5 text-white"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResource(index)}
                  className="self-end text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No resources added yet</p>
        )}
      </div>

      {/* Screening Qs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Screening Questions</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              appendScreening({ question: '', type: 'text', optional: false })
            }
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
        {screeningFields.length > 0 ? (
          <div className="space-y-3">
            {screeningFields.map((question, index) => (
              <div
                key={index}
                className="flex flex-col space-y-3 rounded-lg bg-white/5 p-4"
              >
                <Input
                  {...register(`screening.${index}.question`)}
                  placeholder="Enter your question"
                  className="border-white/10 bg-white/5 text-white"
                />
                <div className="flex items-center gap-3">
                  <Select
                    value={watch(`screening.${index}.type`)}
                    onValueChange={(value) =>
                      setValue(`screening.${index}.type`, value)
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
                      checked={watch(`screening.${index}.optional`)}
                      onChange={(e) =>
                        setValue(
                          `screening.${index}.optional`,
                          e.target.checked
                        )
                      }
                      className="rounded border-white/20"
                    />
                    Optional
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScreening(index)}
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
}
