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
import {
  ArrowLeftIcon,
  GitMerge,
  Link2,
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "../../components/header";
import {
  useAdminProfile,
  useAdminProfiles,
  useDeleteProfile,
  useLinkProfileToUser,
  useMergeProfiles,
  useUpdateProfile,
} from "@/hooks/use-admin-profiles";
import { useAdminUsers } from "@/hooks/use-admin-users";

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useAdminProfile(id);
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [mergeSearch, setMergeSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");

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

  // Hooks must be called unconditionally — declared before any early return
  const mergeProfiles = useMergeProfiles();
  const linkToUser = useLinkProfileToUser();
  const { data: mergeResults } = useAdminProfiles({
    search: mergeSearch,
    limit: 5,
  });
  const { data: userResults } = useAdminUsers({
    search: linkSearch,
    limit: 5,
  });

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

  const mergeProfilesList = (mergeResults as any)?.data?.filter(
    (p: any) => p.id !== id
  ) || [];
  const usersList = (userResults as any)?.data || [];

  const handleMerge = async (sourceId: string, sourceName: string) => {
    if (
      !confirm(
        `Merge "${sourceName}" into "${profile.displayName}"?\n\nContributions will be moved to this profile and "${sourceName}" will be deleted. This cannot be undone.`
      )
    )
      return;
    try {
      await mergeProfiles.mutateAsync({
        targetId: id,
        sourceProfileId: sourceId,
      });
      toast.success(`Merged "${sourceName}" into this profile`);
      setMergeSearch("");
    } catch (err: any) {
      toast.error(err?.message || "Merge failed");
    }
  };

  const handleLink = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Link this profile to user "${userName}"?\n\nThis will bypass the claim flow and directly connect them.`
      )
    )
      return;
    try {
      await linkToUser.mutateAsync({ profileId: id, userId });
      toast.success(`Linked to ${userName}`);
      setLinkSearch("");
    } catch (err: any) {
      toast.error(err?.message || "Link failed");
    }
  };

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
        {/* Identifiers */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Identifiers & Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-white/40">Slug</Label>
                <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 font-mono text-sm text-white">
                  {(profile.slug as string) || "—"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/40">ID</Label>
                <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 font-mono text-xs text-white/70">
                  {profile.id as string}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/40">Public Profile</Label>
              <a
                className="block truncate rounded-md bg-white/5 px-3 py-2 font-mono text-sm text-[#E6007A] hover:underline"
                href={`https://dev.opentribe.io/profile/${profile.slug || profile.id}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                https://dev.opentribe.io/profile/{(profile.slug as string) || (profile.id as string)}
              </a>
            </div>
            {!claimedBy && (
              <div className="space-y-1">
                <Label className="text-xs text-white/40">Claim URL</Label>
                <a
                  className="block truncate rounded-md bg-white/5 px-3 py-2 font-mono text-sm text-[#E6007A] hover:underline"
                  href={`https://dev.opentribe.io/profile/claim/${profile.slug || profile.id}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  https://dev.opentribe.io/profile/claim/{(profile.slug as string) || (profile.id as string)}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Link to User */}
        {!claimedBy && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Link2 className="h-5 w-5 text-[#E6007A]" />
                Link to User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-white/50">
                Directly link this ecosystem profile to an existing user
                (bypasses claim flow).
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  className="border-white/10 bg-white/5 pl-9 text-white"
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  value={linkSearch}
                />
              </div>
              {linkSearch.length > 1 && (
                <div className="space-y-2">
                  {usersList.length > 0 ? (
                    usersList.map((u: any) => (
                      <div
                        className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                        key={u.id}
                      >
                        <div>
                          <p className="text-sm text-white">{u.name}</p>
                          <p className="text-xs text-white/40">{u.email}</p>
                        </div>
                        <Button
                          disabled={linkToUser.isPending}
                          onClick={() => handleLink(u.id, u.name)}
                          size="sm"
                          variant="outline"
                        >
                          {linkToUser.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Link"
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No users found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Merge with Another Profile */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <GitMerge className="h-5 w-5 text-purple-400" />
              Merge Another Profile Into This One
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-white/50">
              Search for a duplicate profile to merge into this one.
              Contributions will be moved here and the source profile will be
              deleted.
            </p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                className="border-white/10 bg-white/5 pl-9 text-white"
                onChange={(e) => setMergeSearch(e.target.value)}
                placeholder="Search profiles by name or GitHub..."
                value={mergeSearch}
              />
            </div>
            {mergeSearch.length > 1 && (
              <div className="space-y-2">
                {mergeProfilesList.length > 0 ? (
                  mergeProfilesList.map((p: any) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                      key={p.id}
                    >
                      <div>
                        <p className="text-sm text-white">
                          {p.displayName}
                        </p>
                        <p className="text-xs text-white/40">
                          {p.github ? `@${p.github}` : p.email || p.slug} ·{" "}
                          {p._count?.contributions || 0} contributions
                        </p>
                      </div>
                      <Button
                        disabled={mergeProfiles.isPending}
                        onClick={() =>
                          handleMerge(p.id, p.displayName)
                        }
                        size="sm"
                        variant="outline"
                      >
                        {mergeProfiles.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Merge"
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40">No profiles found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
