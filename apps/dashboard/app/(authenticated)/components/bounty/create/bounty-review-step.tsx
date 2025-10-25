import type { BountyDetails } from '@/hooks/use-bounty';
import { Badge } from '@packages/base/components/ui/badge';
import { Label } from '@packages/base/components/ui/label';
import { getSkillLabel } from '@packages/base/lib/skills';
import { ExternalLink } from 'lucide-react';

interface BountyReviewProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
}

export const BountyReviewStepComponent: React.FC<BountyReviewProps> = ({
  formData,
  updateFormData,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg bg-white/5 p-6">
        <h3 className="font-medium text-lg text-white">Review Your Bounty</h3>

        <div>
          <p className="text-sm text-white/60">Title</p>
          <p className="text-white">{formData.title}</p>
        </div>

        <div>
          <p className="text-sm text-white/60">Description</p>
          <p className="whitespace-pre-wrap text-white">
            {formData.description}
          </p>
        </div>

        <div>
          <p className="text-sm text-white/60">Skills Required</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {(formData.skills ?? []).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="border-0 bg-white/10 text-white"
              >
                {getSkillLabel(skill)}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-white/60">Total Reward</p>
          <p className="text-white">
            {formData.amount} {formData.token}
          </p>
        </div>

        <div>
          <p className="text-sm text-white/60">Winner Distribution</p>
          <div className="mt-1 space-y-1">
            {formData.winnings &&
              Object.entries(formData.winnings).map(
                ([position, amount], index) => (
                  <p key={position} className="text-white">
                    {index === 0
                      ? '1st'
                      : index === 1
                        ? '2nd'
                        : index === 2
                          ? '3rd'
                          : `${position}th`}{' '}
                    Place: {amount} {formData.token}
                  </p>
                )
              )}
          </div>
        </div>

        <div>
          <p className="text-sm text-white/60">Deadline</p>
          <p className="text-white">
            {formData.deadline &&
              new Date(formData.deadline).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/60">Resources</p>
          <p className="text-white">
            {formData.resources?.map((resource, index) => (
              <div key={index} className="flex items-start justify-between">
                <div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white transition-colors hover:text-[#E6007A]"
                  >
                    {resource.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {resource.description && (
                    <p className="mt-1 text-sm text-white/60">
                      {resource.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </p>
        </div>

        <div>
          <p className="text-sm text-white/60">Screening Questions</p>
          <p className="text-white">
            {formData.screening?.map((question, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-sm text-white">
                        Question {index + 1}
                      </span>
                      {question.optional && (
                        <Badge
                          variant="outline"
                          className="border-white/20 text-white/60 text-xs"
                        >
                          Optional
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="border-0 bg-white/10 text-white/80 text-xs"
                      >
                        {question.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mb-3 text-sm text-white/80">
                      {question.question}
                    </p>
                    <div className="text-white/60 text-xs">
                      {question.type === 'text' && (
                        <span>Text response required</span>
                      )}
                      {question.type === 'url' && (
                        <span>URL/website link required</span>
                      )}
                      {question.type === 'file' && (
                        <span>File upload required</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </p>
        </div>
      </div>

      <div>
        <Label>Visibility</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="DRAFT"
              checked={formData.visibility === 'DRAFT'}
              onChange={(e) => updateFormData('visibility', e.target.value)}
              className="text-[#E6007A]"
            />
            <span className="text-white">Save as Draft</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="PUBLISHED"
              checked={formData.visibility === 'PUBLISHED'}
              onChange={(e) => updateFormData('visibility', e.target.value)}
              className="text-[#E6007A]"
            />
            <span className="text-white">Publish Now</span>
          </label>
        </div>
      </div>
    </div>
  );
};
