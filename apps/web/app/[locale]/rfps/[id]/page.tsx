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
import { ShareButton } from "@packages/base/components/ui/share-button";
import { formatCurrency } from "@packages/base/lib/utils";
import { ExpandableText } from "@packages/base/components/ui/expandable-text";

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

  // Resources are already parsed from the API
  const resources = rfp.resources || [];

  const renderApplyButton = () => {
    switch (true) {
      case !!rfp.userApplicationId:
        return (
          <Link
            href={`/grants/${rfp.grant.slug || rfp.grant.id}/applications/${
              rfp.grant.userApplicationId
            }`}
          >
            <Button
              className="bg-pink-600 text-white hover:bg-pink-700"
              disabled={false}
            >
              View Application
            </Button>
          </Link>
        );
      case rfp.status !== "OPEN" || rfp.grant.status !== "OPEN":
        return (
          <Button
            className="bg-pink-600 text-white hover:bg-pink-700"
            disabled={true}
          >
            Application Closed
          </Button>
        );
      case rfp.grant.source === "EXTERNAL" && rfp.grant.applicationUrl:
        return (
          <a
            href={rfp.grant.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="w-full bg-pink-600 text-white hover:bg-pink-700"
              disabled={rfp.canApply === false}
            >
              Apply Externally
            </Button>
          </a>
        );
      default:
        return (
          <Link
            href={`/grants/${rfp.grant.slug || rfp.grant.id}/apply?rfp=${
              rfp.id
            }`}
          >
            <Button
              className="w-full bg-pink-600 text-white hover:bg-pink-700"
              disabled={rfp.canApply === false}
            >
              Apply with this RFP
            </Button>
          </Link>
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
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-red-500">
                  {rfp.grant.organization.logo ? (
                    <Image
                      src={rfp.grant.organization.logo}
                      alt={rfp.grant.organization.name}
                      fill
                      className="h-20 w-20 object-cover"
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
                      href={`/grants/${rfp.grant.slug || rfp.grant.id}`}
                      className="flex items-center gap-1 text-pink-400 transition-colors hover:text-pink-300"
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

                <VoteSection rfpId={rfp.id} initialVoteCount={rfp.voteCount} />
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
              <ExpandableText maxHeight={300} className="py-0">
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

            {/* Acceptance Criteria */}
            {resources.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold font-heading text-2xl">
                  Acceptance Criteria
                </h2>
                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <h3 className="mb-2 font-semibold">Requirements:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 text-pink-400">•</span>
                        <span>Existing @Writers only</span>
                      </li>
                      <li className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 text-pink-400">•</span>
                        <span>Word count: 500-2000</span>
                      </li>
                      <li className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 text-pink-400">•</span>
                        <span>Deadline: December 19th</span>
                      </li>
                      <li className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 text-pink-400">•</span>
                        <span>Submit article to writer's room</span>
                      </li>
                      <li className="flex items-start gap-2 text-white/80">
                        <span className="mt-1 text-pink-400">•</span>
                        <span>A final edit will be made by @yoon</span>
                      </li>
                    </ul>
                  </div>

                  {resources.map((resource: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    >
                      <h3 className="mb-2 font-semibold">{resource.title}</h3>
                      {resource.description && (
                        <p className="mb-2 text-sm text-white/70">
                          {resource.description}
                        </p>
                      )}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-pink-400 text-sm hover:text-pink-300"
                        >
                          View Resource
                          <ArrowUpRight className="h-3 w-3" />
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
              <h3 className="mb-4 flex items-center gap-2 font-bold text-xl">
                {rfp._count.comments} Comments
              </h3>

              {/* Add Comment Button */}
              {session?.user && (
                <Button
                  variant="outline"
                  className="mb-6 border-white/20 text-white hover:bg-white/10"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {rfp.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-green-500">
                      {comment.author.image ? (
                        <Image
                          src={comment.author.image}
                          alt="Avatar"
                          width={40}
                          height={40}
                          className="rounded-full"
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
                              key={reply.id}
                              className="flex items-start gap-2"
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
                  variant="outline"
                  className="mt-4 w-full border-white/20 text-white hover:bg-white/10"
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
                      key={related.id}
                      href={`/rfps/${related.id}`}
                      className="group"
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
                          variant="outline"
                          className="mt-4 w-full border-white/20 text-white text-xs hover:bg-white/10"
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
                {rfp.grant.logoUrl ? (
                  <Image
                    src={rfp.grant.logoUrl}
                    alt={rfp.grant.title}
                    width={64}
                    height={64}
                    className="rounded-xl"
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
                  <p className="text-sm text-white/60">FUND</p>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <DollarSign className="h-4 w-4" />
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

              {renderApplyButton()}
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
