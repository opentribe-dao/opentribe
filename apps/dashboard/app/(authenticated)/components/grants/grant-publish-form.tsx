import { Badge } from "@packages/base/components/ui/badge";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { useFormContext } from "react-hook-form";

export function GrantPublishForm() {
  const { register, setValue, watch } = useFormContext();
  const formData = watch();

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg bg-white/5 p-6">
        <h3 className="font-medium text-lg text-white">Review Your Grant</h3>
        <div>
          <p className="text-sm text-white/60">Title</p>
          <p className="text-white">{formData.title}</p>
        </div>
        {formData.summary && (
          <div>
            <p className="text-sm text-white/60">Summary</p>
            <p className="text-white">{formData.summary}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-white/60">Description</p>
          <p className="whitespace-pre-wrap text-white">
            {formData.description}
          </p>
        </div>
        {formData.skills?.length > 0 && (
          <div>
            <p className="text-sm text-white/60">Skills</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {formData.skills.map((skill: string) => (
                <Badge
                  className="border-0 bg-white/10 text-white"
                  key={skill}
                  variant="secondary"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {(formData.minAmount || formData.maxAmount || formData.totalFunds) && (
          <div>
            <p className="text-sm text-white/60">Funding</p>
            <div className="mt-1 space-y-1">
              {formData.minAmount && formData.maxAmount && (
                <p className="text-white">
                  Range: {formData.minAmount} - {formData.maxAmount}{" "}
                  {formData.token}
                </p>
              )}
              {formData.totalFunds && (
                <p className="text-white">
                  Total Funds: {formData.totalFunds} {formData.token}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Grant Type</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              {...register("source")}
              checked={formData.source === "NATIVE"}
              className="text-[#E6007A]"
              onChange={() => setValue("source", "NATIVE")}
              value="NATIVE"
            />
            <span className="text-white">Native (managed in Opentribe)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              {...register("source")}
              checked={formData.source === "EXTERNAL"}
              className="text-[#E6007A]"
              onChange={() => setValue("source", "EXTERNAL")}
              value="EXTERNAL"
            />
            <span className="text-white">External (managed externally)</span>
          </label>
        </div>
      </div>

      <div>
        <Label>Grant Status</Label>
        <Select
          onValueChange={(value) => setValue("status", value)}
          value={formData.status}
        >
          <SelectTrigger className="border-white/10 bg-white/5 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-900">
            <SelectItem className="text-white" value="OPEN">
              Open
            </SelectItem>
            <SelectItem className="text-white" value="PAUSED">
              Paused
            </SelectItem>
            <SelectItem className="text-white" value="CLOSED">
              Closed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Visibility</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              {...register("visibility")}
              checked={formData.visibility === "DRAFT"}
              className="text-[#E6007A]"
              onChange={() => setValue("visibility", "DRAFT")}
              value="DRAFT"
            />
            <span className="text-white">Draft</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              {...register("visibility")}
              checked={formData.visibility === "PUBLISHED"}
              className="text-[#E6007A]"
              onChange={() => setValue("visibility", "PUBLISHED")}
              value="PUBLISHED"
            />
            <span className="text-white">Published</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              {...register("visibility")}
              checked={formData.visibility === "ARCHIVED"}
              className="text-[#E6007A]"
              onChange={() => setValue("visibility", "ARCHIVED")}
              value="ARCHIVED"
            />
            <span className="text-white">Archived</span>
          </label>
        </div>
      </div>
    </div>
  );
}
