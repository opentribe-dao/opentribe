
import type { GrantFormData } from "@/type";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@packages/base/components/ui/select";
import { Plus, X } from "lucide-react";

export function GrantRequirementsForm({
  formData,
  setFormData,
  addResource,
  removeResource,
  updateResource,
  addScreeningQuestion,
  removeScreeningQuestion,
  updateScreeningQuestion,
}: {
  formData: GrantFormData;
  setFormData: any;
  addResource: () => void;
  removeResource: (idx: number) => void;
  updateResource: (idx: number, field: keyof GrantFormData["resources"][0], val: string) => void;
  addScreeningQuestion: () => void;
  removeScreeningQuestion: (idx: number) => void;
  updateScreeningQuestion: (idx: number, field: keyof GrantFormData["screening"][0], val: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>External Application URL</Label>
        <Input
          value={formData.applicationUrl}
          onChange={(e) => setFormData(f => ({ ...f, applicationUrl: e.target.value }))}
          placeholder="https://..."
          className="bg-white/5 border-white/10 text-white"
        />
        <p className="text-sm text-white/40 mt-1">If you have an external application form, provide the URL here.</p>
      </div>

      {/* Resources */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Resources</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addResource}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
        {formData.resources.length > 0 ? (
          <div className="space-y-3">
            {formData.resources.map((resource, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3 flex flex-col">
                <Input
                  value={resource.title}
                  onChange={(e) => updateResource(index, "title", e.target.value)}
                  placeholder="Resource title"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={resource.url}
                  onChange={(e) => updateResource(index, "url", e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={resource.description}
                  onChange={(e) => updateResource(index, "description", e.target.value)}
                  placeholder="Brief description (optional)"
                  className="bg-white/5 border-white/10 text-white"
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
        <div className="flex items-center justify-between mb-3">
          <Label>Screening Questions</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addScreeningQuestion}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
        {formData.screening.length > 0 ? (
          <div className="space-y-3">
            {formData.screening.map((question, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3 flex flex-col">
                <Input
                  value={question.question}
                  onChange={(e) => updateScreeningQuestion(index, "question", e.target.value)}
                  placeholder="Enter your question"
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="flex items-center gap-3">
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateScreeningQuestion(index, "type", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="text" className="text-white">Text</SelectItem>
                      <SelectItem value="url" className="text-white">URL</SelectItem>
                      <SelectItem value="file" className="text-white">File</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input
                      type="checkbox"
                      checked={question.optional}
                      onChange={(e) => updateScreeningQuestion(index, "optional", e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Optional
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScreeningQuestion(index)}
                    className="text-white/60 hover:text-white ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No screening questions added yet</p>
        )}
      </div>
    </div>
  );
}