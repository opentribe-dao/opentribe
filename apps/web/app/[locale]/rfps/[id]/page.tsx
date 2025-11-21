import { auth } from "@packages/auth/server";
import { Button } from "@packages/base/components/ui/button";
import { ExpandableText } from "@packages/base/components/ui/expandable-text";
import { ShareButton } from "@packages/base/components/ui/share-button";
import { formatCurrency, getTokenLogo } from "@packages/base/lib/utils";
import {
  ArrowUpRight,
  Calendar,
  DollarSign,
  MessageCircle,
  ThumbsUp,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { env } from "@/env";
import { ApplyButton } from "./apply-button";
import { CommentSection } from "./comment-section";
import { VoteSection } from "./vote-section";

async function getRfp(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const headersList = await headers();

  const res = await fetch(`${apiUrl}/api/v1/rfps/${id}`, {
    cache: "no-store",
    headers: {
      Cookie: headersList.get("cookie") || "",
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data;
}

export default async function RFPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRfp(id);

  if (!(data && data.rfp)) {
    notFound();
  }

  const { rfp, relatedRfps = [] } = data;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Resources are already parsed from the API
  const resources = rfp.resources || [];

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="items-start justify-between md:flex">
              <div className="items-start gap-6 md:flex">
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-red-500">
                  {rfp.grant.organization.logo ? (
                    <Image
                      alt={rfp.grant.organization.name}
                      className="h-20 w-20 object-cover"
                      fill
                      src={rfp.grant.organization.logo}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-bold text-3xl">
                        {rfp.grant.organization.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* RFP Info */}
                <div>
                  <h1 className="mt-2 mb-2 font-bold font-heading text-2xl sm:text-2xl md:mt-0">
                    {rfp.title}
                  </h1>
                  <div className="flex items-center gap-4 text-white/60">
                    <span className="text-sm">Part of</span>
                    <Link
                      className="flex items-center gap-1 text-pink-400 transition-colors hover:text-pink-300"
                      href={`/grants/${rfp.grant.slug || rfp.grant.id}`}
                    >
                      {rfp.grant.title}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <ThumbsUp className="h-4 w-4" />
                    {rfp._count.votes}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <MessageCircle className="h-4 w-4" />
                    {rfp._count.comments}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Users className="h-4 w-4" />
                    {rfp._count.applications}
                  </span>
                </div>

                <ShareButton url={`/rfps/${rfp.id}`} />

                <VoteSection initialVoteCount={rfp.voteCount} rfpId={rfp.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description Section */}
            <section>
              <ExpandableText className="py-0" maxHeight={300} mobileOnly>
                <h2 className="mb-4 font-bold font-heading text-2xl">
                  Description
                </h2>
                <div className="prose prose-invert max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5 prose-headings:font-heading prose-code:text-pink-400 prose-li:text-white/80 prose-p:text-white/80 prose-strong:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {rfp.description}
                  </ReactMarkdown>
                </div>
              </ExpandableText>
            </section>

            {/* Resources */}
            {Array.isArray(resources) && resources.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-4 font-bold font-heading text-2xl">
                    Resources
                  </h2>
                  <div className="space-y-3">
                    {resources.map((resource: any, idx: number) => (
                      <a
                        className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                        href={resource.url}
                        key={resource.url ?? idx}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white">
                              {resource.title}
                            </p>
                            {resource.description && (
                              <p className="mt-1 text-sm text-white/70">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <span className="whitespace-nowrap font-medium text-pink-400 text-sm">
                            Visit →
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}

            {/* Comments Section */}
            <section>
              <CommentSection rfpId={rfp.id} />
            </section>

            {/* Old Comments Section - TO BE REMOVED */}
            <section style={{ display: "none" }}>
              <h3 className="mb-4 flex items-center gap-2 font-bold text-xl">
                {rfp._count.comments} Comments
              </h3>

              {/* Add Comment Button */}
              {session?.user && (
                <Button
                  className="mb-6 border-white/20 text-white hover:bg-white/10"
                  variant="outline"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {rfp.comments.map((comment: any) => (
                  <div
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    key={comment.id}
                  >
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-green-500">
                      {comment.author.image ? (
                        <Image
                          alt="Avatar"
                          className="rounded-full"
                          height={40}
                          src={comment.author.image}
                          width={40}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-bold text-sm">
                            {comment.author.firstName?.[0] ||
                              comment.author.username?.[0] ||
                              "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {comment.author.firstName}{" "}
                            {comment.author.lastName ||
                              comment.author.username ||
                              "Anonymous"}
                          </h4>
                          <span className="text-white/50 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-pink-400 text-xs">Verified</span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {comment.body}
                      </p>

                      {/* Comment actions */}
                      <div className="mt-2 flex items-center gap-4 text-white/50 text-xs">
                        <button className="transition-colors hover:text-white">
                          Reply
                        </button>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 ml-8 space-y-2">
                          {comment.replies.map((reply: any) => (
                            <div
                              className="flex items-start gap-2"
                              key={reply.id}
                            >
                              <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {reply.author.firstName ||
                                      reply.author.username}
                                  </span>
                                  <span className="text-white/50 text-xs">
                                    {new Date(
                                      reply.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-white/70">
                                  {reply.body}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {rfp.comments.length >= 10 && (
                <Button
                  className="mt-4 w-full border-white/20 text-white hover:bg-white/10"
                  variant="outline"
                >
                  View More
                </Button>
              )}
            </section>

            {/* Other RFPs */}
            {relatedRfps.length > 0 && (
              <section>
                <h3 className="mb-4 font-bold text-xl">Other RFP</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {relatedRfps.map((related: any) => (
                    <Link
                      className="group"
                      href={`/rfps/${related.id}`}
                      key={related.id}
                    >
                      <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10">
                        <div className="mb-4 flex items-center justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-red-500">
                            <span className="font-bold text-2xl">K</span>
                          </div>
                        </div>
                        <h4 className="mb-2 line-clamp-2 text-center font-semibold transition-colors group-hover:text-pink-400">
                          {related.title}
                        </h4>
                        <div className="flex items-center justify-center gap-4 text-white/50 text-xs">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {related.voteCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {related.commentCount}
                          </span>
                        </div>
                        <Button
                          className="mt-4 w-full border-white/20 text-white text-xs hover:bg-white/10"
                          variant="outline"
                        >
                          View Now
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Grant Card */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-600/10 to-pink-600/10 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-4">
                {rfp.grant.organization.logo ? (
                  <Image
                    alt={rfp.grant.organization.name}
                    className="rounded-xl"
                    height={64}
                    src={rfp.grant.organization.logo}
                    width={64}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="font-bold text-2xl">
                      {rfp.grant.organization.logoUrl || rfp.grant.title[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-semibold">
                    {rfp.grant.title}
                  </h3>
                  <p className="text-sm text-white/60">{rfp.grant.organization.name}</p>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    {getTokenLogo(rfp.grant.token) ? (
                      // Show token logo if available
                      <img
                        alt={rfp.grant.token || "Token"}
                        className="h-4 w-4 rounded-full bg-white/10 object-contain"
                        src={getTokenLogo(rfp.grant.token) || ""}
                      />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    Total Prize
                  </span>
                  <span className="font-semibold">
                    {rfp.grant.maxAmount
                      ? formatCurrency(
                          Number(rfp.grant.maxAmount),
                          String(rfp.grant.token)
                        )
                      : "Variable"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <Calendar className="h-4 w-4" />
                    RFPs
                  </span>
                  <span className="font-semibold">Multiple</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <Users className="h-4 w-4" />
                    Applications
                  </span>
                  <span className="font-semibold">
                    {rfp.applicationCount || 0}
                  </span>
                </div>
              </div>

              <ApplyButton rfp={rfp} />
            </div>

            {/* Vote Stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-3 font-medium text-sm text-white/60">
                Community Interest
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold font-heading text-2xl">
                    {rfp._count.votes}
                  </p>
                  <p className="text-sm text-white/60">Total Votes</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-600/20">
                  <ThumbsUp className="h-6 w-6 text-pink-400" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-3 font-medium text-sm text-white/60">
                Activity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Views</span>
                  <span className="font-medium">{rfp.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Comments</span>
                  <span className="font-medium">{rfp._count.comments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Applications</span>
                  <span className="font-medium">{rfp._count.applications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className="font-medium text-green-400">
                    {rfp.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
