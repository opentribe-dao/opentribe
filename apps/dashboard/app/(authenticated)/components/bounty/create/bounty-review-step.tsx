import type { BountyDetails } from '@/hooks/use-bounty';
import { Badge } from '@packages/base/components/ui/badge';
import { Label } from '@packages/base/components/ui/label';

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
                {skill}
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
