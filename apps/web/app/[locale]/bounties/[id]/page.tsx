"use client";
import { env } from "@/env";
import { Button } from "@packages/base/components/ui/button";
import {
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { BountyContent } from "./bounty-content";
import { CommentSection } from "./comment-section";
import { ShareButton } from "@packages/base/components/ui/share-button";
import { useEffect, useState } from "react";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { useCountdown } from "@packages/base/hooks/use-countdown";
import { formatCurrency, getTokenLogo } from "@packages/base/lib/utils";
import { getSkillLabel } from "@packages/base/lib/skills";

async function getBounty(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/bounties/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.bounty;
}

export default function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [bounty, setBounty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bountyId, setBountyId] = useState<string | null>(null);
  const router = useRouter();

  // Countdown string for the deadline
  const { formatted: countdownFormatted } = useCountdown(
    bounty?.deadline ?? null
  );

  // Resolve params once
  useEffect(() => {
    const resolveParams = async () => {
      const { id } = await params;
      setBountyId(id);
    };
    resolveParams();
  }, [params]);

  // Fetch bounty when we have the ID
  useEffect(() => {
    if (!bountyId) return;

    const fetchBounty = async () => {
      try {
        const bountyData = await getBounty(bountyId);
        setBounty(bountyData);
      } catch (error) {
        console.error("Error fetching bounty:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [bountyId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  if (!bounty) {
    notFound();
  }

  // Handle winnings structure - parse if it's a string
  let winningsData = {};
  if (bounty.winnings) {
    if (typeof bounty.winnings === "string") {
      try {
        winningsData = JSON.parse(bounty.winnings);
      } catch (e) {
        console.error("Failed to parse winnings:", e);
        winningsData = {};
      }
    } else {
      winningsData = bounty.winnings;
    }
  }
  const totalPrize =
    (Object.values(winningsData).reduce(
      (sum: number, amount: any) => sum + Number(amount),
      0
    ) as number) ||
    Number(bounty.amount) ||
    0;

  const renderActionButton = () => {
    if (!bounty) {
      return null;
    }

    const hasDeadlineExpired = bounty.deadline
      ? new Date() > new Date(bounty.deadline)
      : false;

    switch (true) {
      case !!bounty.userSubmissionId:
        return (
          <Button
            className="w-full bg-pink-600 text-white hover:bg-pink-700"
            disabled={false}
            onClick={() =>
              router.push(
                `/bounties/${bountyId}/submissions/${bounty.userSubmissionId}`
              )
            }
          >
            View Submission
          </Button>
        );
      case bounty.status !== "OPEN":
        const buttonText = (() => {
          switch (true) {
            case !!bounty.winnersAnnouncedAt:
              return "Winners Announced";
            case hasDeadlineExpired:
              return "Deadline Expired";
            default:
              return "Submission Closed";
          }
        })();
        return (
          <Button
            className="w-full bg-pink-600 text-white hover:bg-pink-700"
            disabled={true}
          >
            {buttonText}
          </Button>
        );
      default:
        return (
          <Button
            className="w-full bg-pink-600 text-white hover:bg-pink-700"
            disabled={bounty.canSubmit === false}
            onClick={() => router.push(`/bounties/${bountyId}/submit`)}
          >
            Submit Now
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="items-start justify-between md:flex">
              <div className="items-start gap-6 md:flex">
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                  {bounty.organization.logo ? (
                    <Image
                      src={bounty.organization.logo}
                      alt={bounty.organization.name}
                      fill
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-bold text-3xl">
                        {bounty.organization.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bounty Info */}
                <div>
                  <h1 className="mt-2 mb-2 font-bold font-heading text-2xl sm:text-2xl md:mt-0">
                    {bounty.title}
                  </h1>
                  <div className="flex flex-col gap-4 text-white/60 md:flex-row md:items-center">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {bounty.organization.industry?.[0] || "Technology"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {bounty.organization.location || "Remote"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-4 md:mt-0">
                <ShareButton url={`/bounties/${bountyId}`} />

                {renderActionButton()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="lg:col-span-2">
            <BountyContent bounty={bounty}>
              {/* Comments Section */}
              <section className="mt-8">
                <CommentSection bountyId={bounty.id} />
              </section>
            </BountyContent>

            {/* Similar Bounties */}
            <section className="mt-8">
              <h3 className="mb-4 font-bold text-xl">Similar Bounties</h3>
              <div className="grid gap-4">
                {/* Placeholder for similar bounties */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-center text-white/50">
                    No similar bounties found
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Grant Price Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-white/60 text-xl">
                {getTokenLogo(bounty.token) ? (
                  // Show token logo if available
                  <img
                    src={getTokenLogo(bounty.token) || ""}
                    alt={bounty.token || "Token"}
                    className="h-7 w-7 rounded-full object-contain bg-white/10"
                  />
                ) : (
                  <DollarSign className="h-7 w-7 rounded-full border border-white/20 bg-[#DBE7FF] p-1 text-black" />
                )}
                Total Prize
              </h3>
              <div className="mb-4 font-bold font-heading text-2xl">
                {formatCurrency(Number(totalPrize), String(bounty.token))}
              </div>

              {/* Winner breakdown */}
              {Object.keys(winningsData).length > 0 && (
                <div className="space-y-2 border-white/10 border-t pt-4">
                  <h4 className="mb-2 font-medium text-sm text-white/60">
                    Prize Distribution
                  </h4>
                  {Object.entries(winningsData).map(([position, amount]) => (
                    <div
                      key={position}
                      className="flex items-center justify-between"
                    >
                      <span className="text-lg text-white/70">
                        {position === "1"
                          ? "🥇 1st Place"
                          : position === "2"
                          ? "🥈 2nd Place"
                          : position === "3"
                          ? "🥉 3rd Place"
                          : `Position ${position}`}
                      </span>
                      <span className="font-medium text-lg">
                        {formatCurrency(Number(amount), String(bounty.token))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submissions Info */}
            <div className="flex justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-6 align-center backdrop-blur-sm">
              <div className=" items-center gap-4">
                <h3 className="mb-3 font-medium text-sm text-white/60">
                  Submissions
                </h3>
                <div className="mb-4 flex items-center gap-2">
                  {/* <Users className="h-5 w-5 text-pink-400" /> */}
                  <Briefcase className="h-5 w-5 text-pink-400" />
                  <span className="font-semibold text-lg">
                    {bounty._count.submissions} Total
                  </span>
                </div>
              </div>

              <div className=" items-center gap-4">
                <h3 className="mb-3 font-medium text-sm text-white/60">
                  Deadline
                </h3>
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pink-400" />
                  {bounty.deadline && (
                    <div className="">
                      <span className="font-semibold text-lg">
                        {countdownFormatted ?? "—"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills Required */}
            {bounty.skills.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-3 flex items-center gap-2 font-medium text-sm text-white/60">
                  <Tag className="h-4 w-4" /> Skills Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bounty.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white/10 px-3 py-1 font-medium text-xs"
                    >
                      {getSkillLabel(skill)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Submissions (Winners) */}
            {bounty.submissions.filter((s: any) => s.isWinner).length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-medium text-sm text-white/60">
                  🏆 Winners
                </h3>
                <div className="space-y-3">
                  {bounty.submissions
                    .filter((s: any) => s.isWinner)
                    .map((submission: any) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                            <span className="font-bold text-xs">
                              {submission.position || "1"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {submission.submitter.firstName ||
                                submission.submitter.username}
                            </p>
                            <p className="text-white/50 text-xs">
                              {formatCurrency(
                                Number(submission.winningAmount),
                                String(bounty.token)
                              )}
                            </p>
                          </div>
                        </div>
                        {/* TODO: @tarun fix this, ask @shivam about this - /bounties/${bountyId}/submissions/${submission.id}, if bounty is not open anymore, we send submission url otherwise bounty url */}
                        <Link
                          href={submission.submissionUrl || "#"}
                          target="_blank"
                          className="text-pink-400 text-xs hover:text-pink-300"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Other Submissions */}
            {bounty.submissions.filter((s: any) => !s.isWinner).length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-medium text-sm text-white/60">
                  Recent Submissions
                </h3>
                <div className="space-y-3">
                  {bounty.submissions
                    .filter((s: any) => !s.isWinner)
                    .slice(0, 5)
                    .map((submission: any) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                            {submission.submitter.image ? (
                              <Image
                                src={submission.submitter.image}
                                alt="Submitter"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="font-bold text-xs">
                                  {submission.submitter.firstName?.[0] ||
                                    submission.submitter.username?.[0] ||
                                    "S"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="line-clamp-1 font-medium text-sm">
                              {submission.title || "Submission"}
                            </p>
                            <p className="text-white/50 text-xs">
                              {submission.likesCount} likes
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {bounty._count.submissions > 5 && (
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-white/20 text-white text-xs hover:bg-white/10"
                  >
                    View All Submissions
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
