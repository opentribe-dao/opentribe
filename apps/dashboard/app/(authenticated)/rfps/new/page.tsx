"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
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
import { MarkdownEditor } from "@packages/base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Badge } from "@packages/base/components/ui/badge";
import { ArrowLeft, Loader2, Plus, X, Globe, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Header } from "../../components/header";
import { env } from "@/env";

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
      if (!formData.grantId || !formData.title || !formData.description) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white/60 mb-4">No organization selected</p>
          <Button
            onClick={() =>
              router.push(`${env.NEXT_PUBLIC_WEB_URL}/onboarding/organization`)
            }
            className="bg-[#E6007A] hover:bg-[#E6007A]/90"
          >
            Create Organization
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header pages={["RFPs", "Create"]} page="Create RFP" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/rfps")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFPs
          </Button>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border-white/10 max-w-4xl mx-auto w-full">
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
                value={formData.grantId}
                onValueChange={(value) => updateFormData("grantId", value)}
                disabled={loadingGrants}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
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
                <p className="text-sm text-yellow-400 mt-2">
                  You need to create an active grant first to create RFPs
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">RFP Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Enter a clear, descriptive title for your RFP"
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="mt-2">
                <MarkdownEditor
                  value={formData.description}
                  onChange={(value) => updateFormData("description", value)}
                  placeholder="Provide a detailed description of what you're looking for..."
                  height={400}
                />
              </div>
              <p className="text-sm text-white/60 mt-2">
                Be specific about requirements, deliverables, and evaluation
                criteria
              </p>
            </div>

            {/* Resources */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Resources & Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResource}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </Button>
              </div>
              <div className="space-y-3">
                {formData.resources.map((resource, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-white/40 mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Resource title"
                          value={resource.title}
                          onChange={(e) =>
                            updateResource(index, "title", e.target.value)
                          }
                          className="bg-white/10 border-white/10 text-white"
                        />
                        <Input
                          placeholder="https://example.com"
                          value={resource.url}
                          onChange={(e) =>
                            updateResource(index, "url", e.target.value)
                          }
                          className="bg-white/10 border-white/10 text-white"
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={resource.description || ""}
                          onChange={(e) =>
                            updateResource(index, "description", e.target.value)
                          }
                          className="bg-white/10 border-white/10 text-white"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formData.resources.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4">
                    No resources added yet
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "OPEN" | "CLOSED" | "COMPLETED") =>
                  updateFormData("status", value)
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
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
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => router.push("/rfps")}
                disabled={loading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={loading || !formData.grantId}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={
                    loading ||
                    !formData.grantId ||
                    !formData.title ||
                    !formData.description
                  }
                  className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
