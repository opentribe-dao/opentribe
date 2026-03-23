"use client";

import { Badge } from "@packages/base/components/ui/badge";
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
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../components/header";
import {
  useAdminOrganization,
  useUpdateOrganization,
} from "@/hooks/use-admin-organizations";

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminOrganization(id);
  const updateOrg = useUpdateOrganization();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const org = (data as { data: Record<string, unknown> })?.data;

  useEffect(() => {
    if (org) {
      setForm({
        orgType: org.orgType,
        visibility: org.visibility,
        isVerified: org.isVerified,
        managedByPlatform: org.managedByPlatform,
      });
    }
  }, [org]);

  if (isLoading) {
    return (
      <>
        <Header
          pages={[{ label: "Organizations", href: "/organizations" }]}
          page="Loading..."
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <Header
          pages={[{ label: "Organizations", href: "/organizations" }]}
          page="Not Found"
        />
        <div className="p-6">
          <p className="text-white/60">Organization not found.</p>
        </div>
      </>
    );
  }

  const handleSave = () => {
    updateOrg.mutate({ id, data: form });
  };

  const counts = org._count as {
    bounties: number;
    grants: number;
    members: number;
  };

  return (
    <>
      <Header
        pages={[{ label: "Organizations", href: "/organizations" }]}
        page={org.name as string}
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
        {/* Organization Info */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Name</p>
              <p className="text-white">{org.name as string}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Slug</p>
              <p className="text-white">{org.slug as string}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white">
                {(org.email as string) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Website</p>
              <p className="text-white">
                {(org.websiteUrl as string) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Location</p>
              <p className="text-white">
                {(org.location as string) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Created</p>
              <p className="text-white">
                {new Date(org.createdAt as string).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Stats</p>
              <div className="mt-1 flex gap-2">
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.members} members
                </Badge>
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.bounties} bounties
                </Badge>
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.grants} grants
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Controls */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Admin Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/60">Type</Label>
                <Select
                  onValueChange={(v) => setForm({ ...form, orgType: v })}
                  value={(form.orgType as string) || "COMPANY"}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="DAO">DAO</SelectItem>
                    <SelectItem value="FOUNDATION">Foundation</SelectItem>
                    <SelectItem value="CURATOR_GROUP">Curator Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Visibility</Label>
                <Select
                  onValueChange={(v) => setForm({ ...form, visibility: v })}
                  value={(form.visibility as string) || "ACTIVE"}
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
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() =>
                  setForm({ ...form, isVerified: !form.isVerified })
                }
                variant={form.isVerified ? "default" : "outline"}
              >
                {form.isVerified ? "Verified" : "Mark as Verified"}
              </Button>
              <Button
                onClick={() =>
                  setForm({
                    ...form,
                    managedByPlatform: !form.managedByPlatform,
                  })
                }
                variant={form.managedByPlatform ? "default" : "outline"}
              >
                {form.managedByPlatform
                  ? "Platform Managed"
                  : "Not Platform Managed"}
              </Button>
            </div>
            <Button
              className="bg-[#E6007A] hover:bg-[#E6007A]/90"
              disabled={updateOrg.isPending}
              onClick={handleSave}
            >
              {updateOrg.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Members</CardTitle>
          </CardHeader>
          <CardContent>
            {(org.members as Array<{
              id: string;
              role: string;
              user: { id: string; name: string; email: string };
            }>)?.length > 0 ? (
              <div className="space-y-2">
                {(
                  org.members as Array<{
                    id: string;
                    role: string;
                    user: { id: string; name: string; email: string };
                  }>
                ).map((m) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    key={m.id}
                  >
                    <Link
                      className="text-white hover:text-[#E6007A]"
                      href={`/users/${m.user.id}`}
                    >
                      {m.user.name} ({m.user.email})
                    </Link>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No members</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
