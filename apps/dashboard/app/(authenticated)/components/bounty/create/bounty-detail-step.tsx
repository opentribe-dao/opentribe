import type { BountyDetails } from "@/hooks/use-bounty";
import { MarkdownEditor } from "@packages/base";
import { Badge } from "@packages/base/components/ui/badge";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { X, Plus } from "lucide-react";

interface BountyDetailProps {
    formData: Partial<BountyDetails>;
    updateFormData: <K extends keyof BountyDetails>(
        field: K,
        value: BountyDetails[K]
      ) => void;
    addSkill: (skill: string) => void;
    removeSkill: (skill: string) => void;
    skills: string[];
  }

export const BountyDetailStepComponent: React.FC<BountyDetailProps> = ({formData, updateFormData,addSkill, removeSkill, skills}) => (
    <div className="space-y-6">
    <div>
      <Label htmlFor="title">Bounty Title *</Label>
      <div className="mt-2">
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData('title', e.target.value)}
          placeholder="e.g., Build a Substrate Pallet for NFT Marketplace"
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="description">Description *</Label>
      <div className="mt-2">
        <MarkdownEditor
          value={formData.description ?? ''}
          onChange={(value) => updateFormData('description', value)}
          placeholder="Describe what you need built, the problem it solves, and any specific requirements..."
          height={350}
        />
      </div>
    </div>

    <div>
      <Label>Required Skills *</Label>
      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(formData.skills ?? []).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="border-0 bg-[#E6007A]/20 text-[#E6007A]"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.filter(
            (s) => formData.skills && !formData.skills.includes(s)
          ).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="cursor-pointer border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => addSkill(skill)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </div>
)