import type { GrantFormData } from "@/type";
import { Badge } from "@packages/base/components/ui/badge";
import { Label } from "@packages/base/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@packages/base/components/ui/select";


export function GrantPublishForm({
  formData,
  setFormData,
}: {
  formData: GrantFormData;
  setFormData: (cb: (prev: GrantFormData) => GrantFormData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium text-white">Review Your Grant</h3>
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
          <p className="text-white whitespace-pre-wrap">{formData.description}</p>
        </div>
        {formData.skills?.length > 0 && (
          <div>
            <p className="text-sm text-white/60">Skills</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-white/10 text-white border-0"
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
            <div className="space-y-1 mt-1">
              {formData.minAmount && formData.maxAmount && (
                <p className="text-white">
                  Range: {formData.minAmount} - {formData.maxAmount} {formData.token}
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
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="source"
              value="NATIVE"
              checked={formData.source === "NATIVE"}
              onChange={(e) => setFormData(f => ({ ...f, source: e.target.value as GrantFormData['source'] }))}
              className="text-[#E6007A]"
            />
            <span className="text-white">Native (managed in Opentribe)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="source"
              value="EXTERNAL"
              checked={formData.source === "EXTERNAL"}
              onChange={(e) => setFormData(f => ({ ...f, source: e.target.value as GrantFormData['source'] }))}
              className="text-[#E6007A]"
            />
            <span className="text-white">External (managed externally)</span>
          </label>
        </div>
      </div>

      <div>
        <Label>Grant Status</Label>
        <Select value={formData.status} onValueChange={value => setFormData(f => ({ ...f, status: value as GrantFormData['status'] }))}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="OPEN" className="text-white">Open</SelectItem>
            <SelectItem value="PAUSED" className="text-white">Paused</SelectItem>
            <SelectItem value="CLOSED" className="text-white">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Visibility</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="DRAFT"
              checked={formData.visibility === "DRAFT"}
              onChange={(e) => setFormData(f => ({ ...f, visibility: e.target.value as GrantFormData['visibility'] }))}
              className="text-[#E6007A]"
            />
            <span className="text-white">Draft</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="PUBLISHED"
              checked={formData.visibility === "PUBLISHED"}
              onChange={(e) => setFormData(f => ({ ...f, visibility: e.target.value as GrantFormData['visibility'] }))}
              className="text-[#E6007A]"
            />
            <span className="text-white">Published</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="ARCHIVED"
              checked={formData.visibility === "ARCHIVED"}
              onChange={(e) => setFormData(f => ({ ...f, visibility: e.target.value as GrantFormData['visibility'] }))}
              className="text-[#E6007A]"
            />
            <span className="text-white">Archived</span>
          </label>
        </div>
      </div>
    </div>
  );
}