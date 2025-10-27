import type { BountyDetails } from '@/hooks/use-bounty';
import { MarkdownEditor } from '@packages/base';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import SkillsOptions from '@packages/base/components/ui/skills-options';

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
          <SkillsOptions
            value={formData.skills ?? []}
            onChange={(skills) => {
              addSkill(skills);
            }}
          />
        </div>
      </div>
    </div>
  </div>
);
