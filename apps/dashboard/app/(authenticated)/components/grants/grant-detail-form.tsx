import { ImageUpload } from '@packages/base';
import { Plus, X } from 'lucide-react';
import { Label } from '@packages/base/components/ui/label';
import type { GrantFormData } from '@/type';
import { Input } from '@packages/base/components/ui/input';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Badge } from '@packages/base/components/ui/badge';
import SkillsOptions from '@packages/base/components/ui/skills-options';

export function GrantDetailsForm({
  formData,
  setFormData,
  addSkill,
  removeSkill,
}: {
  formData: GrantFormData;
  setFormData: (cb: (prev: GrantFormData) => GrantFormData) => void;
  addSkill: (skill: string[]) => void;
  removeSkill: (skill: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Grant Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((f) => ({ ...f, title: e.target.value }))
          }
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) =>
            setFormData((f) => ({ ...f, summary: e.target.value }))
          }
          rows={3}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((f) => ({ ...f, description: e.target.value }))
          }
          rows={6}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div>
        <Label>Application Instructions</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) =>
            setFormData((f) => ({ ...f, instructions: e.target.value }))
          }
          rows={4}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div>
        <Label>Grant Logo</Label>
        <ImageUpload
          currentImageUrl={formData.logoUrl}
          onImageChange={(url) =>
            setFormData((f) => ({ ...f, logoUrl: url || '' }))
          }
          uploadType="organization-logo"
          entityId={undefined}
          variant="logo"
        />
      </div>
      <div>
        <Label>Grant Banner</Label>
        <ImageUpload
          currentImageUrl={formData.bannerUrl}
          onImageChange={(url) =>
            setFormData((f) => ({ ...f, bannerUrl: url || '' }))
          }
          uploadType="grant-banner"
          entityId={undefined}
          variant="banner"
        />
      </div>
      <div>
        <Label>Skills</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          <SkillsOptions
            value={formData.skills ?? []}
            onChange={(skills) => {
              addSkill(skills);
            }}
          />
        </div>
      </div>
    </div>
  );
}
