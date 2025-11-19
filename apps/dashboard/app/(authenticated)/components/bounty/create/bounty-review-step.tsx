import { Badge } from "@packages/base/components/ui/badge";
import { Label } from "@packages/base/components/ui/label";
import { getSkillLabel } from "@packages/base/lib/skills";
import { ExternalLink } from "lucide-react";
import type { BountyDetails } from "@/hooks/use-bounty";

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
}) => (
  <div className="space-y-6">
    <div className="space-y-4 rounded-lg bg-white/5 p-6">
      <h3 className="font-medium text-lg text-white">Review Your Bounty</h3>

      <div>
        <p className="text-sm text-white/60">Title</p>
        <p className="text-white">{formData.title}</p>
      </div>

      <div>
        <p className="text-sm text-white/60">Description</p>
        <p className="whitespace-pre-wrap text-white">{formData.description}</p>
      </div>

      <div>
        <p className="text-sm text-white/60">Skills Required</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {(formData.skills ?? []).map((skill) => (
            <Badge
              className="border-0 bg-white/10 text-white"
              key={skill}
              variant="secondary"
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
                <p className="text-white" key={position}>
                  {index === 0
                    ? "1st"
                    : index === 1
                      ? "2nd"
                      : index === 2
                        ? "3rd"
                        : `${position}th`}{" "}
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
      {formData.resources != null && formData.resources.length > 0 && (
        <div>
          <p className="text-sm text-white/60">Resources</p>
          <div className="text-white">
            {formData.resources.map((resource, index) => (
              <div className="flex items-start justify-between" key={index}>
                <div>
                  <a
                    className="flex items-center gap-2 text-white transition-colors hover:text-[#E6007A]"
                    href={resource.url}
                    rel="noopener noreferrer"
                    target="_blank"
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
          </div>
        </div>
      )}
      {formData.screening != null && formData.screening.length > 0 && (
        <div>
          <p className="text-sm text-white/60">Screening Questions</p>
          <p className="text-white">
            {formData.screening?.map((question, index) => (
              <div className="rounded-lg bg-white/5 p-4" key={index}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-sm text-white">
                        Question {index + 1}
                      </span>
                      {question.optional && (
                        <Badge
                          className="border-white/20 text-white/60 text-xs"
                          variant="outline"
                        >
                          Optional
                        </Badge>
                      )}
                      <Badge
                        className="border-0 bg-white/10 text-white/80 text-xs"
                        variant="secondary"
                      >
                        {question.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mb-3 text-sm text-white/80">
                      {question.question}
                    </p>
                    <div className="text-white/60 text-xs">
                      {question.type === "text" && (
                        <span>Text response required</span>
                      )}
                      {question.type === "url" && (
                        <span>URL/website link required</span>
                      )}
                      {question.type === "file" && (
                        <span>File upload required</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </p>
        </div>
      )}
    </div>

    <div>
      <Label>Visibility</Label>
      <div className="mt-2 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            checked={formData.visibility === "DRAFT"}
            className="text-[#E6007A]"
            name="visibility"
            onChange={(e) => updateFormData("visibility", e.target.value)}
            type="radio"
            value="DRAFT"
          />
          <span className="text-white">Save as Draft</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            checked={formData.visibility === "PUBLISHED"}
            className="text-[#E6007A]"
            name="visibility"
            onChange={(e) => updateFormData("visibility", e.target.value)}
            type="radio"
            value="PUBLISHED"
          />
          <span className="text-white">Publish Now</span>
        </label>
      </div>
    </div>
  </div>
);
