"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { Textarea } from "@packages/base/components/ui/textarea";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "../../components/header";
import { useAdminClaim, useUpdateClaim } from "@/hooks/use-admin-claims";

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useAdminClaim(id);
  const updateClaim = useUpdateClaim();
  const [reviewNotes, setReviewNotes] = useState("");

  const claim = (data as { data: Record<string, unknown> })?.data;

  if (isLoading) {
    return (
      <>
        <Header
          pages={[{ label: "Claims", href: "/claims" }]}
          page="Loading..."
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!claim) {
    return (
      <>
        <Header
          pages={[{ label: "Claims", href: "/claims" }]}
          page="Not Found"
        />
        <div className="p-6">
          <p className="text-white/60">Claim not found.</p>
        </div>
      </>
    );
  }

  const handleApprove = async () => {
    await updateClaim.mutateAsync({
      id,
      data: { status: "VERIFIED", reviewNotes },
    });
    router.push("/claims");
  };

  const handleReject = async () => {
    await updateClaim.mutateAsync({
      id,
      data: { status: "REJECTED", reviewNotes },
    });
    router.push("/claims");
  };

  const profile = claim.ecosystemProfile as Record<string, unknown>;
  const user = claim.user as {
    id: string;
    name: string;
    email: string;
    github: string | null;
    walletAddress: string | null;
  };
  const verificationData = claim.verificationData as Record<
    string,
    unknown
  > | null;

  return (
    <>
      <Header
        pages={[{ label: "Claims", href: "/claims" }]}
        page="Review Claim"
      >
        <div className="pr-4">
          <Link href="/claims">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Claim Overview */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Claim Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Status</p>
              <Badge
                className={`mt-1 border-0 ${
                  claim.status === "PENDING"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : claim.status === "VERIFIED"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                }`}
                variant="secondary"
              >
                {claim.status as string}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-white/40">Method</p>
              <p className="text-white">{claim.method as string}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Created</p>
              <p className="text-white">
                {new Date(claim.createdAt as string).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Expires</p>
              <p className="text-white">
                {new Date(claim.expiresAt as string).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Being Claimed */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">
              Profile Being Claimed
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Display Name</p>
              <Link
                className="text-white hover:text-[#E6007A]"
                href={`/profiles/${profile.id}`}
              >
                {profile.displayName as string}
              </Link>
            </div>
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white">
                {(profile.email as string) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">GitHub</p>
              <p className="text-white">
                {(profile.github as string) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Source</p>
              <p className="text-white">{profile.source as string}</p>
            </div>
          </CardContent>
        </Card>

        {/* Claiming User */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Claiming User</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Name</p>
              <Link
                className="text-white hover:text-[#E6007A]"
                href={`/users/${user.id}`}
              >
                {user.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">GitHub</p>
              <p className="text-white">{user.github || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Wallet</p>
              <p className="truncate text-white">
                {user.walletAddress || "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Data */}
        {verificationData && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Verification Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-black/30 p-4 text-sm text-white/60">
                {JSON.stringify(verificationData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Review Actions */}
        {claim.status === "PENDING" && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Review Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-white/60">
                  Review Notes (optional)
                </p>
                <Textarea
                  className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={updateClaim.isPending}
                  onClick={handleApprove}
                >
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {updateClaim.isPending ? "Processing..." : "Approve Claim"}
                </Button>
                <Button
                  disabled={updateClaim.isPending}
                  onClick={handleReject}
                  variant="destructive"
                >
                  <XIcon className="mr-2 h-4 w-4" />
                  {updateClaim.isPending ? "Processing..." : "Reject Claim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
