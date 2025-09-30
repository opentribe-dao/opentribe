import { env } from "@/env";
import { auth } from "@packages/auth/server";
import { Button } from "@packages/base/components/ui/button";
import {
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Tag,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BountyContent } from "./bounty-content";
import { CommentSection } from "./comment-section";
import { ShareButton } from "./share-button";

async function getBounty(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/bounties/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.bounty;
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bounty = await getBounty(id);

  if (!bounty) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  // Format deadline
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className='items-start justify-between md:flex'>
              <div className='items-start gap-6 md:flex'>
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                  {bounty.organization.logo ? (
                    <Image
                      src={bounty.organization.logo}
                      alt={bounty.organization.name}
                      fill
                      className='h-20 w-20 bg-black object-cover'
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
                  <h1 className='mt-2 mb-2 font-bold font-heading text-2xl sm:text-2xl md:mt-0'>
                    {bounty.title}
                  </h1>
                  <div className='flex flex-col gap-4 text-white/60 md:flex-row md:items-center'>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {bounty.organization.industry?.[0] || "Technology"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {bounty.organization.location || "Remote"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline: {formatDeadline(bounty.deadline)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='mt-4 flex items-center gap-4 md:mt-0'>
                {/* Prize Badge */}
                {/* <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-4 py-2 backdrop-blur-sm">
                  <Trophy className="h-4 w-4 text-green-400" />
                  <span className="font-bold text-green-400 text-sm">
                    {formatAmount(totalPrize)} {bounty.token}
                  </span>
                </div> */}

                <div className="flex flex-col items-center justify-end gap-2 sm:items-end">
                  <Link href={`/bounties/${id}/submit`}>
                    <Button
                      className='h-12 w-48 bg-pink-600 font-bold text-lg text-white hover:bg-pink-700 md:w-auto lg:w-48'
                      disabled={bounty.status !== "OPEN"}
                    >
                      Submit Now
                    </Button>
                  </Link>

                  <div className='mt-4 flex items-center gap-2'>
                    {/* TODO: @tarun Make this dynamic here, I have used lorem pixel images here */}
                    <span className="flex items-center">
                      <img
                        src="https://picsum.photos/200/300"
                        alt=""
                        className="h-8 w-8 rounded-full border border-white "
                      /> 
                      <img
                        src="https://picsum.photos/seed/picsum/200/300"
                        alt=""
                        className="-ml-4 h-8 w-8 rounded-full border border-white "
                      />
                      <img
                        src="https://picsum.photos/seed/picsum/200/300"
                        alt=""
                        className="-ml-4 h-8 w-8 rounded-full border border-white "
                      />
                      <img
                        src="https://picsum.photos/200/300"
                        alt=""
                        className="-ml-4 h-8 w-8 rounded-full border border-white"
                      />
                    </span>
                    <ShareButton url={`/bounties/${id}`} />
                  </div>
                </div>
              </div>

              {/* <div className="flex justify-end"> */}
              {/* <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-4 py-2 backdrop-blur-sm">
                    <Trophy className="h-4 w-4 text-green-400" />
                    <span className="font-bold text-green-400 text-sm">
                      {formatAmount(totalPrize)} {bounty.token}
                    </span>
                  </div> */}
              {/* </div> */}
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
              <h3 className='mb-2 flex items-center gap-2 font-medium text-xl text-white/60' >
                <DollarSign className='h-7 w-7 rounded-full border text-black border-white/20 bg-[#DBE7FF] p-1' />Total Prize
              </h3>
              <div className="mb-4 font-bold font-heading text-2xl">
                {formatAmount(totalPrize)} {bounty.token}
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
                        {formatAmount(Number(amount))}
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
                      {/* {formatDeadline(bounty.deadline)} */}
                      <span className="font-semibold text-lg">5d:19h:15m</span>
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
                      {skill}
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
                              {formatAmount(Number(submission.winningAmount))}
                            </p>
                          </div>
                        </div>
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
                            {submission.submitter.avatarUrl ? (
                              <Image
                                src={submission.submitter.avatarUrl}
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
