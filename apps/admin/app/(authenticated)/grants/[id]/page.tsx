"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
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
import { useAdminGrant, useUpdateGrant } from "@/hooks/use-admin-grants";

export default function GrantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminGrant(id);
  const updateGrant = useUpdateGrant();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const grant = (data as { data: Record<string, unknown> })?.data;

  useEffect(() => {
    if (grant) {
      setForm({
        status: grant.status,
        visibility: grant.visibility,
        source: grant.source,
        fundingSource: grant.fundingSource,
      });
    }
  }, [grant]);

  if (isLoading) {
    return (
      <>
        <Header pages={[{ label: "Grants", href: "/grants" }]} page="Loading..." />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!grant) {
    return (
      <>
        <Header pages={[{ label: "Grants", href: "/grants" }]} page="Not Found" />
        <div className="p-6">
          <p className="text-white/60">Grant not found.</p>
        </div>
      </>
    );
  }

  const handleSave = () => {
    updateGrant.mutate({ id, data: form });
  };

  const org = grant.organization as { id: string; name: string } | undefined;
  const counts = grant._count as { applications: number; rfps: number };
  const applications = (grant.applications || []) as Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    applicant: { id: string; name: string; email: string } | null;
  }>;

  return (
    <>
      <Header
        pages={[{ label: "Grants", href: "/grants" }]}
        page={grant.title as string}
      >
        <div className="pr-4">
          <Link href="/grants">
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
            <CardTitle className="text-white">Grant Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Title</p>
              <p className="text-white">{grant.title as string}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Organization</p>
              <Link
                className="text-white hover:text-[#E6007A]"
                href={`/organizations/${org?.id}`}
              >
                {org?.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-white/40">Token</p>
              <p className="text-white">{(grant.token as string) || "DOT"}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Stats</p>
              <div className="mt-1 flex gap-2">
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.applications} applications
                </Badge>
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.rfps} RFPs
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
                <p className="text-sm text-white/40">Status</p>
                <Select
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  value={(form.status as string) || "OPEN"}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/40">Visibility</p>
                <Select
                  onValueChange={(v) => setForm({ ...form, visibility: v })}
                  value={(form.visibility as string) || "DRAFT"}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="bg-[#E6007A] hover:bg-[#E6007A]/90"
              disabled={updateGrant.isPending}
              onClick={handleSave}
            >
              {updateGrant.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-2">
                {applications.map((app) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    key={app.id}
                  >
                    <div>
                      <p className="text-sm text-white">{app.title}</p>
                      <p className="text-xs text-white/40">
                        {app.applicant
                          ? `By ${app.applicant.name} (${app.applicant.email})`
                          : "Unknown applicant"}
                      </p>
                    </div>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No applications yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
