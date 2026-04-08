"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@packages/base/components/ui/textarea";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "../../components/header";
import { useCreateOrganization } from "@/hooks/use-admin-organizations";

export default function NewOrganizationPage() {
  const router = useRouter();
  const createOrg = useCreateOrganization();
  const [form, setForm] = useState({
    name: "",
    description: "",
    orgType: "COMPANY",
    visibility: "ACTIVE",
    managedByPlatform: true,
    websiteUrl: "",
    email: "",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrg.mutateAsync(form);
      router.push("/organizations");
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  return (
    <>
      <Header
        pages={[{ label: "Organizations", href: "/organizations" }]}
        page="Create Organization"
      >
        <div className="pr-4">
          <Link href="/organizations">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">New Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/60">Name *</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    value={form.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Email</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    value={form.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Type</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, orgType: v })}
                    value={form.orgType}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="DAO">DAO</SelectItem>
                      <SelectItem value="FOUNDATION">Foundation</SelectItem>
                      <SelectItem value="CURATOR_GROUP">
                        Curator Group
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Visibility</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, visibility: v })}
                    value={form.visibility}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Website</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, websiteUrl: e.target.value })
                    }
                    value={form.websiteUrl}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Location</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    value={form.location}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Description</Label>
                <Textarea
                  className="min-h-[120px] border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  value={form.description}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  disabled={createOrg.isPending || !form.name}
                  type="submit"
                >
                  {createOrg.isPending ? "Creating..." : "Create Organization"}
                </Button>
                <Link href="/organizations">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
