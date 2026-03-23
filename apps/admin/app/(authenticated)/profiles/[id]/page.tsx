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
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { Textarea } from "@packages/base/components/ui/textarea";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../components/header";
import {
  useAdminProfile,
  useDeleteProfile,
  useUpdateProfile,
} from "@/hooks/use-admin-profiles";

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useAdminProfile(id);
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const profile = (data as { data: Record<string, unknown> })?.data;

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        email: profile.email || "",
        github: profile.github || "",
        twitter: profile.twitter || "",
        linkedin: profile.linkedin || "",
        website: profile.website || "",
        bio: profile.bio || "",
        location: profile.location || "",
        contactable: profile.contactable,
        outreachStatus: profile.outreachStatus || "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <>
        <Header
          pages={[{ label: "Ecosystem Profiles", href: "/profiles" }]}
          page="Loading..."
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header
          pages={[{ label: "Ecosystem Profiles", href: "/profiles" }]}
          page="Not Found"
        />
        <div className="p-6">
          <p className="text-white/60">Profile not found.</p>
        </div>
      </>
    );
  }

  const handleSave = () => {
    updateProfile.mutate({ id, data: form });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this profile?")) {
      await deleteProfile.mutateAsync(id);
      router.push("/profiles");
    }
  };

  const contributions = (profile.contributions || []) as Array<{
    id: string;
    role: string;
    grantApplication: {
      id: string;
      title: string;
      status: string;
      grant: { id: string; title: string };
    } | null;
  }>;

  const claimRequests = (profile.claimRequests || []) as Array<{
    id: string;
    method: string;
    status: string;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;

  const claimedBy = profile.claimedBy as {
    id: string;
    name: string;
    email: string;
  } | null;

  return (
    <>
      <Header
        pages={[{ label: "Ecosystem Profiles", href: "/profiles" }]}
        page={profile.displayName as string}
      >
        <div className="pr-4">
          <Link href="/profiles">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Edit Form */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/60">Display Name</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                  value={(form.displayName as string) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Email</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  value={(form.email as string) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">GitHub</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, github: e.target.value })
                  }
                  value={(form.github as string) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Twitter</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, twitter: e.target.value })
                  }
                  value={(form.twitter as string) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Location</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  value={(form.location as string) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Outreach Status</Label>
                <Input
                  className="border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, outreachStatus: e.target.value })
                  }
                  value={(form.outreachStatus as string) || ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Bio</Label>
              <Textarea
                className="min-h-[100px] border-white/10 bg-white/5 text-white"
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                value={(form.bio as string) || ""}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() =>
                  setForm({ ...form, contactable: !form.contactable })
                }
                variant={form.contactable ? "default" : "outline"}
              >
                {form.contactable ? "Contactable" : "Not Contactable"}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                disabled={updateProfile.isPending}
                onClick={handleSave}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                disabled={deleteProfile.isPending}
                onClick={handleDelete}
                variant="destructive"
              >
                {deleteProfile.isPending ? "Deleting..." : "Delete Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Claim Status */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Claim Status</CardTitle>
          </CardHeader>
          <CardContent>
            {claimedBy ? (
              <div className="rounded-lg bg-green-500/10 p-4">
                <p className="text-sm text-green-400">
                  Claimed by{" "}
                  <Link
                    className="underline hover:text-green-300"
                    href={`/users/${claimedBy.id}`}
                  >
                    {claimedBy.name} ({claimedBy.email})
                  </Link>
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/40">Not yet claimed</p>
            )}

            {claimRequests.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-white/60">
                  Claim Requests:
                </p>
                {claimRequests.map((req) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    key={req.id}
                  >
                    <div>
                      <Link
                        className="text-sm text-white hover:text-[#E6007A]"
                        href={`/users/${req.user.id}`}
                      >
                        {req.user.name} ({req.user.email})
                      </Link>
                      <p className="text-xs text-white/40">
                        Method: {req.method} -{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={`border-0 ${
                        req.status === "VERIFIED"
                          ? "bg-green-500/20 text-green-400"
                          : req.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                      variant="secondary"
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contributions */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Contributions ({contributions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions.length > 0 ? (
              <div className="space-y-2">
                {contributions.map((c) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    key={c.id}
                  >
                    <div>
                      <p className="text-sm text-white">
                        {c.grantApplication?.title || "Unknown application"}
                      </p>
                      <p className="text-xs text-white/40">
                        Grant:{" "}
                        {c.grantApplication?.grant?.title || "Unknown"}
                      </p>
                    </div>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {c.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No contributions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
