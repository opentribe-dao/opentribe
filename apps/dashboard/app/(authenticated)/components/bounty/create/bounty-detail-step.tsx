import { MarkdownEditor } from "@packages/base";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import SkillsOptions from "@packages/base/components/ui/skills-options";
import type { BountyDetails } from "@/hooks/use-bounty";

interface BountyDetailProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
  addSkill: (skills: string[]) => void;
  removeSkill: (skill: string) => void;
}

export const BountyDetailStepComponent: React.FC<BountyDetailProps> = ({
  formData,
  updateFormData,
  addSkill,
}) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="title">Bounty Title *</Label>
      <div className="mt-2">
        <Input
          className="border-white/10 bg-white/5 text-white"
          id="title"
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder="e.g., Build a Substrate Pallet for NFT Marketplace"
          value={formData.title}
        />
      </div>
    </div>

    <div>
      <Label htmlFor="description">Description *</Label>
      <div className="mt-2">
        <MarkdownEditor
          height={350}
          onChange={(value) => updateFormData("description", value)}
          placeholder="Describe what you need built, the problem it solves, and any specific requirements..."
          value={formData.description ?? ""}
        />
      </div>
    </div>

    <div>
      <Label>Required Skills *</Label>
      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-2">
          <SkillsOptions
            onChange={(skills) => {
              addSkill(skills);
            }}
            value={formData.skills ?? []}
          />
        </div>
      </div>
    </div>
  </div>
);
