import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@packages/base/components/ui/button";
import {
  Share2,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Users,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { env } from "@/env";
import { auth } from "@packages/auth/server";
import { headers } from "next/headers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoteSection } from "./vote-section";
import { CommentSection } from "./comment-section";

async function getRfp(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/rfps/${id}`, {
    cache: "no-store",
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

  if (!data || !data.rfp) {
    notFound();
  }

  const { rfp, relatedRfps = [] } = data;

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

  // Resources are already parsed from the API
  const resources = rfp.resources || [];

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="relative container mx-auto px-6 py-8">
          <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {/* Organization Logo */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-red-500">
                  {rfp.grant.organization.logo ? (
                    <Image
                      src={rfp.grant.organization.logo}
                      alt={rfp.grant.organization.name}
                      fill
                      className="object-cover bg-white p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold">
                        {rfp.grant.organization.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* RFP Info */}
                <div>
                  <h1 className="text-3xl font-bold font-heading mb-2">
                    {rfp.title}
                  </h1>
                  <div className="flex items-center gap-4 text-white/60">
                    <span className="text-sm">Part of</span>
                    <Link
                      href={`/en/grants/${rfp.grant.id}`}
                      className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                    >
                      {rfp.grant.title}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <ThumbsUp className="w-4 h-4" />
                    {rfp._count.votes}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <MessageCircle className="w-4 h-4" />
                    {rfp._count.comments}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Users className="w-4 h-4" />
                    {rfp._count.applications}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                <VoteSection rfpId={rfp.id} initialVoteCount={rfp.voteCount} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <section>
              <h2 className="text-2xl font-bold font-heading mb-4">
                Description
              </h2>
              <div className="prose prose-invert max-w-none prose-headings:font-heading prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-code:text-pink-400 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rfp.description}
                </ReactMarkdown>
              </div>
            </section>

            {/* Acceptance Criteria */}
            {resources.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-heading mb-4">
                  Acceptance Criteria
                </h2>
                <div className="space-y-3">
                  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                    <h3 className="font-semibold mb-2">Requirements:</h3>
                    <ul className="space-y-2">
                      <li className="text-white/80 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">•</span>
                        <span>Existing @Writers only</span>
                      </li>
                      <li className="text-white/80 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">•</span>
                        <span>Word count: 500-2000</span>
                      </li>
                      <li className="text-white/80 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">•</span>
                        <span>Deadline: December 19th</span>
                      </li>
                      <li className="text-white/80 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">•</span>
                        <span>Submit article to writer's room</span>
                      </li>
                      <li className="text-white/80 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">•</span>
                        <span>A final edit will be made by @yoon</span>
                      </li>
                    </ul>
                  </div>

                  {resources.map((resource: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                      <h3 className="font-semibold mb-2">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-white/70 text-sm mb-2">
                          {resource.description}
                        </p>
                      )}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1"
                        >
                          View Resource
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
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
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {rfp._count.comments} Comments
              </h3>

              {/* Add Comment Button */}
              {session?.user && (
                <Button
                  variant="outline"
                  className="mb-6 border-white/20 text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {rfp.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex-shrink-0">
                      {comment.author.image ? (
                        <Image
                          src={comment.author.image}
                          alt="Avatar"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {comment.author.firstName?.[0] ||
                              comment.author.username?.[0] ||
                              "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {comment.author.firstName}{" "}
                            {comment.author.lastName ||
                              comment.author.username ||
                              "Anonymous"}
                          </h4>
                          <span className="text-xs text-white/50">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs text-pink-400">Verified</span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {comment.body}
                      </p>

                      {/* Comment actions */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                        <button className="hover:text-white transition-colors">
                          Reply
                        </button>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 ml-8 space-y-2">
                          {comment.replies.map((reply: any) => (
                            <div
                              key={reply.id}
                              className="flex items-start gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">
                                    {reply.author.firstName ||
                                      reply.author.username}
                                  </span>
                                  <span className="text-xs text-white/50">
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
                  variant="outline"
                  className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                >
                  View More
                </Button>
              )}
            </section>

            {/* Other RFPs */}
            {relatedRfps.length > 0 && (
              <section>
                <h3 className="text-xl font-bold mb-4">Other RFP</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedRfps.map((related: any) => (
                    <Link
                      key={related.id}
                      href={`/en/rfps/${related.id}`}
                      className="group"
                    >
                      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all h-full">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                            <span className="text-2xl font-bold">K</span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-center mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors">
                          {related.title}
                        </h4>
                        <div className="flex items-center justify-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {related.voteCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {related.commentCount}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-4 text-xs border-white/20 text-white hover:bg-white/10"
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
            <div className="p-6 bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {rfp.grant.logoUrl ? (
                  <Image
                    src={rfp.grant.logoUrl}
                    alt={rfp.grant.title}
                    width={64}
                    height={64}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {rfp.grant.title[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold font-heading">
                    {rfp.grant.title}
                  </h3>
                  <p className="text-sm text-white/60">FUND</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Total Prize
                  </span>
                  <span className="font-semibold">
                    {rfp.grant.maxAmount
                      ? formatAmount(Number(rfp.grant.maxAmount))
                      : "Variable"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    RFPs
                  </span>
                  <span className="font-semibold">Multiple</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Applications
                  </span>
                  <span className="font-semibold">
                    {rfp.applicationCount || 0}
                  </span>
                </div>
              </div>

              {rfp.grant.source === "EXTERNAL" && rfp.grant.applicationUrl ? (
                <a
                  href={rfp.grant.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                    Apply Externally
                  </Button>
                </a>
              ) : (
                <Link href={`/grants/${rfp.grant.id}/apply?rfp=${rfp.id}`}>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                    Apply with this RFP
                  </Button>
                </Link>
              )}
            </div>

            {/* Vote Stats */}
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">
                Community Interest
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-heading">
                    {rfp._count.votes}
                  </p>
                  <p className="text-sm text-white/60">Total Votes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-pink-600/20 flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6 text-pink-400" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">
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
