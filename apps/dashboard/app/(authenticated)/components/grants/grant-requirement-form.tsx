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
import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

export function GrantRequirementsForm() {
  const { register, control, setValue, watch } = useFormContext();
  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
    update: updateResource,
  } = useFieldArray({
    control,
    name: "resources",
  });
  const {
    fields: screeningFields,
    append: appendScreening,
    remove: removeScreening,
    update: updateScreening,
  } = useFieldArray({
    control,
    name: "screening",
  });

  const applicationUrl = watch("applicationUrl");

  return (
    <div className="space-y-6">
      <div>
        <Label>External Application URL</Label>
        <Input
          {...register("applicationUrl")}
          className="border-white/10 bg-white/5 text-white"
          placeholder="https://..."
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
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() =>
              appendResource({ title: "", url: "", description: "" })
            }
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
        {resourceFields.length > 0 ? (
          <div className="space-y-3">
            {resourceFields.map((field, index) => (
              <div
                className="flex flex-col space-y-3 rounded-lg bg-white/5 p-4"
                key={index}
              >
                <Input
                  {...register(`resources.${index}.title`)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="Resource title"
                />
                <Input
                  {...register(`resources.${index}.url`)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="https://..."
                />
                <Input
                  {...register(`resources.${index}.description`)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="Brief description (optional)"
                />
                <Button
                  className="self-end text-white/60 hover:text-white"
                  onClick={() => removeResource(index)}
                  size="sm"
                  variant="ghost"
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
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() =>
              appendScreening({ question: "", type: "text", optional: false })
            }
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
        {screeningFields.length > 0 ? (
          <div className="space-y-3">
            {screeningFields.map((question, index) => (
              <div
                className="flex flex-col space-y-3 rounded-lg bg-white/5 p-4"
                key={index}
              >
                <Input
                  {...register(`screening.${index}.question`)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="Enter your question"
                />
                <div className="flex items-center gap-3">
                  <Select
                    onValueChange={(value) =>
                      setValue(`screening.${index}.type`, value)
                    }
                    value={watch(`screening.${index}.type`)}
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
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input
                      checked={watch(`screening.${index}.optional`)}
                      className="rounded border-white/20"
                      onChange={(e) =>
                        setValue(
                          `screening.${index}.optional`,
                          e.target.checked
                        )
                      }
                      type="checkbox"
                    />
                    Optional
                  </label>
                  <Button
                    className="ml-2 text-white/60 hover:text-white"
                    onClick={() => removeScreening(index)}
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
}
