import { ImageUpload } from "@packages/base";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import SkillsOptions from "@packages/base/components/ui/skills-options";
import { Textarea } from "@packages/base/components/ui/textarea";
import { useFormContext } from "react-hook-form";

interface GrantDetailsFormProps {
  organizationId?: string;
}

export function GrantDetailsForm({ organizationId }: GrantDetailsFormProps) {
  const { register, setValue, watch } = useFormContext();
  const skills = watch("skills") ?? [];
  const logoUrl = watch("logoUrl");
  const bannerUrl = watch("bannerUrl");

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Grant Title *</Label>
        <Input
          id="title"
          {...register("title", { required: true })}
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          {...register("summary")}
          className="border-white/10 bg-white/5 text-white"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register("description", { required: true })}
          className="border-white/10 bg-white/5 text-white"
          rows={6}
        />
      </div>
      <div>
        <Label>Application Instructions</Label>
        <Textarea
          id="instructions"
          {...register("instructions")}
          className="border-white/10 bg-white/5 text-white"
          rows={4}
        />
      </div>
      <div>
        <Label>Grant Logo</Label>
        <ImageUpload
          currentImageUrl={logoUrl}
          entityId={organizationId}
          onImageChange={(url) => setValue("logoUrl", url || "")}
          uploadType="organization-logo"
          variant="logo"
        />
      </div>
      <div>
        <Label>Grant Banner</Label>
        <ImageUpload
          currentImageUrl={bannerUrl}
          entityId={organizationId}
          onImageChange={(url) => setValue("bannerUrl", url || "")}
          uploadType="grant-banner"
          variant="banner"
        />
      </div>
      <div>
        <Label>Skills</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <SkillsOptions
            onChange={(skills) => setValue("skills", skills)}
            value={skills}
          />
        </div>
      </div>
    </div>
  );
}
