"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Eye, TriangleAlert } from "lucide-react";
import type { BountyDetails } from "@/hooks/use-bounty";

interface StatusVisibilityCardProps {
  formData: Partial<BountyDetails>;
  bounty: BountyDetails;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
}

export function StatusVisibilityCard({
  formData,
  bounty,
  updateFormData,
}: StatusVisibilityCardProps) {
  const renderStatusSelect = () => {
    if (formData.status === "OPEN") {
      return (
        <Select
          onValueChange={(value: string) => updateFormData("status", value)}
          value={formData.status}
        >
          <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-900">
            <SelectItem className="text-white" value="OPEN">
              Open
            </SelectItem>
            <SelectItem className="text-white" value="CLOSED">
              Closed
            </SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (formData.status === "REVIEWING") {
      return (
        <Select
          onValueChange={(value: string) => updateFormData("status", value)}
          value={formData.status}
        >
          <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-900">
            <SelectItem className="text-white" value="REVIEWING">
              Reviewing
            </SelectItem>
            <SelectItem className="text-white" value="CANCELLED">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Select disabled value={formData.status}>
        <SelectTrigger className="w-full cursor-not-allowed border-white/10 bg-white/5 text-white opacity-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-zinc-900">
          <SelectItem className="text-white" value={formData.status ?? ""}>
            {formData.status
              ? formData.status.charAt(0) +
                formData.status.slice(1).toLowerCase()
              : ""}
          </SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const renderVisibilitySelect = () => {
    if (bounty.status !== "OPEN") {
      return (
        <Select disabled value={formData.visibility}>
          <SelectTrigger className="w-full cursor-not-allowed border-white/10 bg-white/5 text-white opacity-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-zinc-900">
            <SelectItem
              className="text-white"
              value={formData.visibility ?? ""}
            >
              {formData.visibility
                ? formData.visibility.charAt(0) +
                  formData.visibility.slice(1).toLowerCase()
                : ""}
            </SelectItem>
          </SelectContent>
        </Select>
      );
    }
    return (
      <Select
        onValueChange={(value: string) => updateFormData("visibility", value)}
        value={formData.visibility}
      >
        <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-zinc-900">
          <SelectItem className="text-white" value="DRAFT">
            Draft (Private)
          </SelectItem>
          <SelectItem className="text-white" value="PUBLISHED">
            Published (Public)
          </SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <Card className="border-white/10 bg-white/10 backdrop-blur-[10px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-white">
          <Eye className="size-4" />
          Status & Visibility
        </CardTitle>
        <CardDescription className="text-white/60">
          Control bounty visibility and status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <div className="flex-1 space-y-2">
            <Label className="text-white/80">Status</Label>
            {renderStatusSelect()}
          </div>

          <div className="flex-1 space-y-2">
            <Label className="text-white/80">Visibility</Label>
            {renderVisibilitySelect()}
          </div>
        </div>

        {formData.status === "CLOSED" && bounty.status !== "CLOSED" && (
          <div className="mt-2 ml-2 flex items-center gap-1 text-[#E6007A] text-xs">
            <TriangleAlert className="size-4" />
            Warning: Closing the bounty is{" "}
            <span className="font-semibold">irreversible</span>.
          </div>
        )}

        <div className="rounded-lg bg-white/5 p-3">
          <div className="mb-2 text-sm text-white/60">Current Info</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-white/80">Created:</span>
              <span className="text-white">
                {new Date(bounty.createdAt).toLocaleDateString()}
              </span>
            </div>
            {bounty.publishedAt && (
              <div className="flex justify-between">
                <span className="text-white/80">Published:</span>
                <span className="text-white">
                  {new Date(bounty.publishedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/80">Submissions:</span>
              <span className="text-white">{bounty.submissionCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
