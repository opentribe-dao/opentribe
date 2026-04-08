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
import { useState } from "react";
import { Header } from "../../components/header";
import { useAdminUser, useUpdateUser } from "@/hooks/use-admin-users";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminUser(id);
  const updateUser = useUpdateUser();
  const [banReason, setBanReason] = useState("");

  const user = data?.data;

  if (isLoading) {
    return (
      <>
        <Header pages={[{ label: "Users", href: "/users" }]} page="Loading..." />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header pages={[{ label: "Users", href: "/users" }]} page="Not Found" />
        <div className="p-6">
          <p className="text-white/60">User not found.</p>
        </div>
      </>
    );
  }

  const handleRoleChange = (newRole: string) => {
    updateUser.mutate({ id, data: { role: newRole } });
  };

  const handleBan = () => {
    updateUser.mutate({
      id,
      data: { banned: true, banReason: banReason || "Banned by admin" },
    });
  };

  const handleUnban = () => {
    updateUser.mutate({ id, data: { banned: false } });
  };

  return (
    <>
      <Header pages={[{ label: "Users", href: "/users" }]} page={user.name}>
        <div className="pr-4">
          <Link href="/users">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* User Profile Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Name</p>
              <p className="text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Username</p>
              <p className="text-white">{user.username || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Location</p>
              <p className="text-white">{user.location || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Headline</p>
              <p className="text-white">{user.headline || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Wallet</p>
              <p className="truncate text-white">
                {user.walletAddress || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Skills</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {user.skills && user.skills.length > 0
                  ? user.skills.map((skill: string) => (
                      <Badge
                        className="border-0 bg-white/10 text-white/60"
                        key={skill}
                        variant="secondary"
                      >
                        {skill}
                      </Badge>
                    ))
                  : <span className="text-white/40">None</span>}
              </div>
            </div>
            <div>
              <p className="text-sm text-white/40">Social Links</p>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-white/60">
                {user.twitter && <span>Twitter: {user.twitter}</span>}
                {user.github && <span>GitHub: {user.github}</span>}
                {user.linkedin && <span>LinkedIn: {user.linkedin}</span>}
                {!user.twitter && !user.github && !user.linkedin && (
                  <span className="text-white/40">None</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Controls Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Admin Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <p className="mb-1 text-sm text-white/40">Role</p>
                <Select
                  onValueChange={handleRoleChange}
                  value={user.role}
                >
                  <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-sm text-white/40">Status</p>
                <Badge
                  className={`border-0 text-sm ${
                    user.banned
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                  variant="secondary"
                >
                  {user.banned ? "Banned" : "Active"}
                </Badge>
              </div>
            </div>

            {!user.banned ? (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-sm text-white/40">Ban Reason</p>
                  <Input
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Reason for banning..."
                    value={banReason}
                  />
                </div>
                <Button
                  onClick={handleBan}
                  variant="destructive"
                >
                  Ban User
                </Button>
              </div>
            ) : (
              <div>
                {user.banReason && (
                  <p className="mb-2 text-sm text-white/60">
                    Ban reason: {user.banReason}
                  </p>
                )}
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleUnban}
                >
                  Unban User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizations */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Organizations ({user.members?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.members && user.members.length > 0 ? (
              <div className="space-y-2">
                {user.members.map(
                  (m: {
                    id: string;
                    role: string;
                    organization: {
                      id: string;
                      name: string;
                      slug: string;
                    };
                  }) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                      key={m.id}
                    >
                      <Link
                        className="text-white hover:text-[#E6007A]"
                        href={`/organizations/${m.organization.id}`}
                      >
                        {m.organization.name}
                      </Link>
                      <Badge
                        className="border-0 bg-white/10 text-white/60"
                        variant="secondary"
                      >
                        {m.role}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">No organizations</p>
            )}
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Grant Applications ({user.applications?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.applications && user.applications.length > 0 ? (
              <div className="space-y-2">
                {user.applications.map(
                  (app: {
                    id: string;
                    title: string;
                    status: string;
                    createdAt: string;
                    grant: { id: string; title: string };
                  }) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                      key={app.id}
                    >
                      <div>
                        <p className="text-sm text-white">{app.title}</p>
                        <p className="text-xs text-white/40">
                          Grant: {app.grant.title}
                        </p>
                      </div>
                      <Badge
                        className="border-0 bg-white/10 text-white/60"
                        variant="secondary"
                      >
                        {app.status}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">No applications</p>
            )}
          </CardContent>
        </Card>

        {/* Submissions */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Bounty Submissions ({user.submissions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.submissions && user.submissions.length > 0 ? (
              <div className="space-y-2">
                {user.submissions.map(
                  (sub: {
                    id: string;
                    title: string | null;
                    status: string;
                    isWinner: boolean | null;
                    createdAt: string;
                    bounty: { id: string; title: string };
                  }) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                      key={sub.id}
                    >
                      <div>
                        <p className="text-sm text-white">
                          {sub.title || "Untitled submission"}
                        </p>
                        <p className="text-xs text-white/40">
                          Bounty: {sub.bounty.title}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className="border-0 bg-white/10 text-white/60"
                          variant="secondary"
                        >
                          {sub.status}
                        </Badge>
                        {sub.isWinner && (
                          <Badge
                            className="border-0 bg-yellow-500/20 text-yellow-400"
                            variant="secondary"
                          >
                            Winner
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">No submissions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
