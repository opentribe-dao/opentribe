"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { MarkdownEditor } from "@packages/base";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { ArrowLeft, Globe, Loader2, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { Header } from "../../../components/header";

interface Grant {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface Resource {
  title: string;
  url: string;
  description?: string;
}

interface RfpFormData {
  grantId: string;
  title: string;
  description: string;
  resources: Resource[];
  status: "OPEN" | "CLOSED" | "COMPLETED";
  visibility: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function EditRFPPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGrants, setLoadingGrants] = useState(true);
  const [formData, setFormData] = useState<RfpFormData>({
    grantId: "",
    title: "",
    description: "",
    resources: [],
    status: "OPEN",
    visibility: "DRAFT",
  });

  useEffect(() => {
    if (activeOrg && id) {
      fetchRFPDetails();
      fetchGrants();
    }
  }, [activeOrg, id]);

  const fetchRFPDetails = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/rfps/${id}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch RFP details");
      }

      const data = await response.json();
      const rfp = data.rfp;

      // Check if user has access to edit this RFP
      if (rfp.grant.organization.id !== activeOrg?.id) {
        toast.error("You do not have access to edit this RFP");
        router.push("/rfps");
        return;
      }

      setFormData({
        grantId: rfp.grant.id,
        title: rfp.title,
        description: rfp.description,
        resources: rfp.resources || [],
        status: rfp.status,
        visibility: rfp.visibility,
      });
    } catch (error) {
      console.error("Error fetching RFP:", error);
      toast.error("Failed to load RFP details");
      router.push("/rfps");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchGrants = async () => {
    try {
      setLoadingGrants(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/grants`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grants");
      }

      const data = await response.json();
      // Only show active grants that can have RFPs
      const activeGrants = data.grants.filter(
        (grant: Grant) => grant.status === "OPEN" || grant.status === "ACTIVE"
      );
      setGrants(activeGrants);
    } catch (error) {
      console.error("Error fetching grants:", error);
      toast.error("Failed to load grants");
    } finally {
      setLoadingGrants(false);
    }
  };

  const updateFormData = (field: keyof RfpFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addResource = () => {
    updateFormData("resources", [
      ...formData.resources,
      { title: "", url: "", description: "" },
    ]);
  };

  const updateResource = (
    index: number,
    field: keyof Resource,
    value: string
  ) => {
    const updatedResources = [...formData.resources];
    updatedResources[index] = { ...updatedResources[index], [field]: value };
    updateFormData("resources", updatedResources);
  };

  const removeResource = (index: number) => {
    updateFormData(
      "resources",
      formData.resources.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!(formData.grantId && formData.title && formData.description)) {
        toast.error("Please fill in all required fields");
        return;
      }

      const submitData = {
        ...formData,
        resources: formData.resources.filter((r) => r.title && r.url),
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update RFP");
      }

      toast.success("RFP updated successfully!");
      router.push(`/rfps/${id}`);
    } catch (error) {
      console.error("Error updating RFP:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update RFP"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-white/60">No organization selected</p>
          <Button
            className="bg-[#E6007A] hover:bg-[#E6007A]/90"
            onClick={() =>
              router.push(`${env.NEXT_PUBLIC_WEB_URL}/onboarding/organization`)
            }
          >
            Create Organization
          </Button>
        </div>
      </div>
    );
  }

  if (loadingData || loadingGrants) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header page="Edit RFP" pages={["RFPs", "Edit"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4 flex items-center gap-4">
          <Button
            className="text-white/60 hover:text-white"
            onClick={() => router.push(`/rfps/${id}`)}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFP
          </Button>
        </div>

        <Card className="mx-auto w-full max-w-4xl border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Edit RFP</CardTitle>
            <CardDescription className="text-white/60">
              Update your Request for Proposal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grant Selection */}
            <div>
              <Label htmlFor="grant">Parent Grant *</Label>
              <Select
                disabled={loadingGrants}
                onValueChange={(value) => updateFormData("grantId", value)}
                value={formData.grantId}
              >
                <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select a grant" />
                </SelectTrigger>
                <SelectContent>
                  {grants.map((grant) => (
                    <SelectItem key={grant.id} value={grant.id}>
                      {grant.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">RFP Title *</Label>
              <Input
                className="mt-2 border-white/10 bg-white/5 text-white"
                id="title"
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Enter a clear, descriptive title for your RFP"
                value={formData.title}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="mt-2">
                <MarkdownEditor
                  height={400}
                  onChange={(value) => updateFormData("description", value)}
                  placeholder="Provide a detailed description of what you're looking for..."
                  value={formData.description}
                />
              </div>
              <p className="mt-2 text-sm text-white/60">
                Be specific about requirements, deliverables, and evaluation
                criteria
              </p>
            </div>

            {/* Resources */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Resources & Links</Label>
                <Button
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={addResource}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Resource
                </Button>
              </div>
              <div className="space-y-3">
                {formData.resources.map((resource, index) => (
                  <div
                    className="space-y-3 rounded-lg bg-white/5 p-4"
                    key={index}
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="mt-2 h-5 w-5 text-white/40" />
                      <div className="flex-1 space-y-3">
                        <Input
                          className="border-white/10 bg-white/10 text-white"
                          onChange={(e) =>
                            updateResource(index, "title", e.target.value)
                          }
                          placeholder="Resource title"
                          value={resource.title}
                        />
                        <Input
                          className="border-white/10 bg-white/10 text-white"
                          onChange={(e) =>
                            updateResource(index, "url", e.target.value)
                          }
                          placeholder="https://example.com"
                          value={resource.url}
                        />
                        <Input
                          className="border-white/10 bg-white/10 text-white"
                          onChange={(e) =>
                            updateResource(index, "description", e.target.value)
                          }
                          placeholder="Description (optional)"
                          value={resource.description || ""}
                        />
                      </div>
                      <Button
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeResource(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formData.resources.length === 0 && (
                  <p className="py-4 text-center text-sm text-white/40">
                    No resources added yet
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value: "OPEN" | "CLOSED" | "COMPLETED") =>
                  updateFormData("status", value)
                }
                value={formData.status}
              >
                <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                onValueChange={(value: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
                  updateFormData("visibility", value)
                }
                value={formData.visibility}
              >
                <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-white/60">
                {formData.visibility === "DRAFT" &&
                  "This RFP is only visible to your organization"}
                {formData.visibility === "PUBLISHED" &&
                  "This RFP is publicly visible"}
                {formData.visibility === "ARCHIVED" &&
                  "This RFP is hidden from public view"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-white/10 border-t pt-4">
              <Button
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading}
                onClick={() => router.push(`/rfps/${id}`)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                disabled={
                  loading ||
                  !formData.grantId ||
                  !formData.title ||
                  !formData.description
                }
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
