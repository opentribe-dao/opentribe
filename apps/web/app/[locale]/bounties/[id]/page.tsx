"use client";
import { Button } from "@packages/base/components/ui/button";
import { ShareButton } from "@packages/base/components/ui/share-button";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { useCountdown } from "@packages/base/hooks/use-countdown";
import { getSkillHeading, getSkillLabel } from "@packages/base/lib/skills";
import { formatCurrency, getTokenLogo } from "@packages/base/lib/utils";
import {
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { env } from "@/env";
import { BountyContent } from "./bounty-content";
import { CommentSection } from "./comment-section";

interface Bounty {
  id: string;
  title: string;
  deadline: string | null;
  amount: number | null;
  token: string;
  winnings: any;
  status: string;
  userSubmissionId?: string | null;
  canSubmit?: boolean;
  winnersAnnouncedAt?: string | null;
  skills: string[];
  organization: {
    name: string;
    logo: string | null;
  };
  _count: {
    submissions: number;
  };
  submissions: any[];
  curators?: Array<{
    contact: string | null;
    user: {
      email: string | null;
      telegram: string | null;
      linkedin: string | null;
      github: string | null;
      twitter: string | null;
    };
  }>;
}

async function getBounty(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/bounties/${id}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      console.error(
        `API error: ${res.status} ${res.statusText} for bounty ${id}`
      );
      return null;
    }

    const data = await res.json();
    if (!data.bounty) {
      console.error(`Bounty data missing in API response for ${id}`);
      return null;
    }
    return data.bounty;
  } catch (error) {
    console.error(`Failed to fetch bounty ${id}:`, error);
    throw error;
  }
}

const ActionButton = ({
  bounty,
  bountyId,
}: {
  bounty: Bounty;
  bountyId: string;
}) => {
  const router = useRouter();
  const hasDeadlineExpired = bounty.deadline
    ? new Date() > new Date(bounty.deadline)
    : false;

  if (bounty.userSubmissionId) {
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
  }

  if (bounty.status !== "OPEN") {
    let buttonText = "Submission Closed";
    if (bounty.winnersAnnouncedAt) {
      buttonText = "Winners Announced";
    } else if (hasDeadlineExpired) {
      buttonText = "Deadline Expired";
    }

    return (
      <Button
        className="w-full bg-pink-600 text-white hover:bg-pink-700"
        disabled={true}
      >
        {buttonText}
      </Button>
    );
  }

  return (
    <Button
      className="w-full bg-pink-600 text-white hover:bg-pink-700"
      disabled={bounty.canSubmit === false}
      onClick={() => router.push(`/bounties/${bountyId}/submit`)}
    >
      Submit Now
    </Button>
  );
};

export default function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [bountyId, setBountyId] = useState<string | null>(null);

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
    if (!bountyId) {
      return;
    }

    const fetchBounty = async () => {
      try {
        const bountyData = await getBounty(bountyId);
        if (!bountyData) {
          console.error("Bounty not found:", bountyId);
          notFound();
          return;
        }
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

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="items-start justify-between md:flex">
              <div className="items-start gap-6 md:flex">
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-linear-to-br from-pink-400 to-purple-500">
                  {bounty.organization.logo ? (
                    <Image
                      alt={bounty.organization.name}
                      className="h-20 w-20 object-cover"
                      fill
                      src={bounty.organization.logo}
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
                      {bounty.organization.name}
                    </span>
                    {bounty.skills.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {getSkillHeading(bounty.skills[0])}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-4 md:mt-0">
                {bountyId && <ShareButton url={`/bounties/${bountyId}`} />}

                {bountyId && (
                  <ActionButton bounty={bounty} bountyId={bountyId} />
                )}
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={bounty.token || "Token"}
                    className="h-7 w-7 rounded-full bg-white/10 object-contain"
                    src={getTokenLogo(bounty.token) || ""}
                    width={28}
                    height={28}
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
                      className="flex items-center justify-between"
                      key={position}
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

            {/* Contact Card */}
            {bounty.curators && bounty.curators.length > 0 && (() => {
              const curator = bounty.curators[0];
              const telegram = curator.user.telegram;
              const email = curator.contact || curator.user.email;
              const github = curator.user.github;
              const twitter = curator.user.twitter;
              const linkedin = curator.user.linkedin;

              // Priority: 1. Telegram, 2. Email, 3. Twitter, 4. GitHub, 5. LinkedIn
              let contactButton = null;

              if (telegram) {
                contactButton = (
                  <Button
                    asChild
                    className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]"
                  >
                    <a
                      href={`https://t.me/${telegram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Message on Telegram
                    </a>
                  </Button>
                );
              } else if (email) {
                contactButton = (
                  <Button
                    asChild
                    className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]"
                  >
                    <a href={`mailto:${email}`}>
                      Send an email
                    </a>
                  </Button>
                );
              } else if (twitter) {
                contactButton = (
                  <Button
                    asChild
                    className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]"
                  >
                    <a
                      href={`https://twitter.com/${twitter.replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?(twitter|x)\.com\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Message on Twitter
                    </a>
                  </Button>
                );
              } else if (github) {
                contactButton = (
                  <Button
                    asChild
                    className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]"
                  >
                    <a
                      href={`https://github.com/${github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Connect on GitHub
                    </a>
                  </Button>
                );
              } else if (linkedin) {
                contactButton = (
                  <Button
                    asChild
                    className="w-full bg-[#E6007A] text-white hover:bg-[#FF1493]"
                  >
                    <a
                      href={`https://linkedin.com/in/${linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Connect on LinkedIn
                    </a>
                  </Button>
                );
              }

              if (!contactButton) return null;

              return (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 font-bold font-heading text-xl">Contact</h3>
                  <p className="mb-4 text-sm text-white/60">
                    Need help with this bounty?
                  </p>
                  {contactButton}
                </div>
              );
            })()}

            {/* Submissions Info */}
            <div className="flex justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-6 align-center backdrop-blur-sm">
              <div className="items-center gap-4">
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

              <div className="items-center gap-4">
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
                      className="rounded-full bg-white/10 px-3 py-1 font-medium text-xs"
                      key={skill}
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
                        className="flex items-center justify-between"
                        key={submission.id}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-orange-500">
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
                          className="text-pink-400 text-xs hover:text-pink-300"
                          href={submission.submissionUrl || "#"}
                          rel="noopener noreferrer"
                          target="_blank"
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
                        className="flex items-center justify-between"
                        key={submission.id}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-linear-to-br from-pink-500 to-purple-600">
                            {submission.submitter.image ? (
                              <Image
                                alt="Submitter"
                                className="rounded-full"
                                height={32}
                                src={submission.submitter.image}
                                width={32}
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
                    className="mt-4 w-full border-white/20 text-white text-xs hover:bg-white/10"
                    variant="outline"
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
