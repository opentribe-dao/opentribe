import { ImageUpload } from '@packages/base';
import { Label } from '@packages/base/components/ui/label';
import { Input } from '@packages/base/components/ui/input';
import { Textarea } from '@packages/base/components/ui/textarea';
import SkillsOptions from '@packages/base/components/ui/skills-options';
import { useFormContext } from 'react-hook-form';

interface GrantDetailsFormProps {
  organizationId?: string;
}

export function GrantDetailsForm({ organizationId }: GrantDetailsFormProps) {
  const { register, setValue, watch } = useFormContext();
  const skills = watch('skills') ?? [];
  const logoUrl = watch('logoUrl');
  const bannerUrl = watch('bannerUrl');

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Grant Title *</Label>
        <Input
          id="title"
          {...register('title', { required: true })}
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          {...register('summary')}
          rows={3}
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: true })}
          rows={6}
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label>Application Instructions</Label>
        <Textarea
          id="instructions"
          {...register('instructions')}
          rows={4}
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label>Grant Logo</Label>
        <ImageUpload
          currentImageUrl={logoUrl}
          onImageChange={(url) => setValue('logoUrl', url || '')}
          uploadType="organization-logo"
          entityId={organizationId}
          variant="logo"
        />
      </div>
      <div>
        <Label>Grant Banner</Label>
        <ImageUpload
          currentImageUrl={bannerUrl}
          onImageChange={(url) => setValue('bannerUrl', url || '')}
          uploadType="grant-banner"
          entityId={organizationId}
          variant="banner"
        />
      </div>
      <div>
        <Label>Skills</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <SkillsOptions
            value={skills}
            onChange={(skills) => setValue('skills', skills)}
          />
        </div>
      </div>
    </div>
  );
}
