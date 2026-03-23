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
import { useAdminBounty, useUpdateBounty } from "@/hooks/use-admin-bounties";

export default function BountyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminBounty(id);
  const updateBounty = useUpdateBounty();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const bounty = (data as { data: Record<string, unknown> })?.data;

  useEffect(() => {
    if (bounty) {
      setForm({
        status: bounty.status,
        visibility: bounty.visibility,
      });
    }
  }, [bounty]);

  if (isLoading) {
    return (
      <>
        <Header
          pages={[{ label: "Bounties", href: "/bounties" }]}
          page="Loading..."
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!bounty) {
    return (
      <>
        <Header
          pages={[{ label: "Bounties", href: "/bounties" }]}
          page="Not Found"
        />
        <div className="p-6">
          <p className="text-white/60">Bounty not found.</p>
        </div>
      </>
    );
  }

  const handleSave = () => {
    updateBounty.mutate({ id, data: form });
  };

  const org = bounty.organization as
    | { id: string; name: string }
    | undefined;
  const counts = bounty._count as { submissions: number; comments: number };
  const submissions = (bounty.submissions || []) as Array<{
    id: string;
    title: string | null;
    status: string;
    isWinner: boolean | null;
    createdAt: string;
    submitter: { id: string; name: string; email: string };
  }>;

  return (
    <>
      <Header
        pages={[{ label: "Bounties", href: "/bounties" }]}
        page={bounty.title as string}
      >
        <div className="pr-4">
          <Link href="/bounties">
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
            <CardTitle className="text-white">Bounty Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Title</p>
              <p className="text-white">{bounty.title as string}</p>
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
              <p className="text-sm text-white/40">Amount</p>
              <p className="text-white">
                {bounty.amount
                  ? `${bounty.amount} ${bounty.token}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Stats</p>
              <div className="mt-1 flex gap-2">
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.submissions} submissions
                </Badge>
                <Badge
                  className="border-0 bg-white/10 text-white/60"
                  variant="secondary"
                >
                  {counts.comments} comments
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/40">Deadline</p>
              <p className="text-white">
                {bounty.deadline
                  ? new Date(bounty.deadline as string).toLocaleDateString()
                  : "No deadline"}
              </p>
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
                    <SelectItem value="REVIEWING">Reviewing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              disabled={updateBounty.isPending}
              onClick={handleSave}
            >
              {updateBounty.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Submissions */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Submissions ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    key={sub.id}
                  >
                    <div>
                      <p className="text-sm text-white">
                        {sub.title || "Untitled submission"}
                      </p>
                      <p className="text-xs text-white/40">
                        By {sub.submitter.name} ({sub.submitter.email})
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No submissions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
