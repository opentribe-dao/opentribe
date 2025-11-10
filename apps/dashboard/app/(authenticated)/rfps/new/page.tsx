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
import { ArrowLeft, Globe, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { Header } from "../../components/header";

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

export default function CreateRFPPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (activeOrg) {
      fetchGrants();
    }
  }, [activeOrg]);

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

      // Auto-select first grant if available
      if (activeGrants.length > 0 && !formData.grantId) {
        setFormData((prev) => ({ ...prev, grantId: activeGrants[0].id }));
      }
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

  const handleSubmit = async (publish = false) => {
    try {
      setLoading(true);

      // Validate required fields
      if (!(formData.grantId && formData.title && formData.description)) {
        toast.error("Please fill in all required fields");
        return;
      }

      const submitData = {
        ...formData,
        visibility: publish ? "PUBLISHED" : formData.visibility,
        resources: formData.resources.filter((r) => r.title && r.url),
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create RFP");
      }

      const data = await response.json();
      toast.success(
        publish ? "RFP published successfully!" : "RFP saved as draft!"
      );
      router.push(`/rfps/${data.rfp.id}`);
    } catch (error) {
      console.error("Error creating RFP:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create RFP"
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

  return (
    <>
      <Header page="Create RFP" pages={["RFPs", "Create"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4 flex items-center gap-4">
          <Button
            className="text-white/60 hover:text-white"
            onClick={() => router.push("/rfps")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFPs
          </Button>
        </div>

        <Card className="mx-auto w-full max-w-4xl border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Create New RFP</CardTitle>
            <CardDescription className="text-white/60">
              Create a Request for Proposal linked to one of your grants
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
              {grants.length === 0 && !loadingGrants && (
                <p className="mt-2 text-sm text-yellow-400">
                  You need to create an active grant first to create RFPs
                </p>
              )}
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-white/10 border-t pt-4">
              <Button
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading}
                onClick={() => router.push("/rfps")}
                variant="outline"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={loading || !formData.grantId}
                  onClick={() => handleSubmit(false)}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
                <Button
                  className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  disabled={
                    loading ||
                    !formData.grantId ||
                    !formData.title ||
                    !formData.description
                  }
                  onClick={() => handleSubmit(true)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish RFP"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
