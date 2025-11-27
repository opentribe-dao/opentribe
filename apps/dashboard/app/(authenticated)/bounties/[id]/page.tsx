"use client";

import { Badge } from "@packages/base/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { getSkillLabel } from "@packages/base/lib/skills";
import { CalendarIcon, CoinsIcon, ExternalLink, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBountyContext } from "../../components/bounty-provider";

export default function BountyOverviewPage() {
  const { bounty, bountyLoading, bountyError } = useBountyContext();

  if (bountyLoading) {
    return <div>Loading...</div>;
  }
  if (bountyError || !bounty) {
    return <div>Bounty not found</div>;
  }

  const sortedWinnings = bounty.winnings
    ? Object.entries(bounty.winnings).sort(
        ([a], [b]) => Number(a) - Number(b)
      )
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Main Column */}
      <div className="space-y-6 md:col-span-2">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardDescription className="text-white/60">
                Total Prize Pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CoinsIcon className="h-5 w-5 text-[#E6007A]" />
                <span className="font-semibold text-2xl text-white">
                  {bounty.amount} {bounty.token}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/badge50">
            <CardHeader>
              <CardDescription className="text-white/60">
                Deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#E6007A]" />
                <span className="font-semibold text-2xl text-white">
                  {new Date(bounty.deadline).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardDescription className="text-white/60">
                Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="font-semibold text-2xl text-white">
                {bounty.submissionCount}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="border-white/10 bg-zinc-900/50">
          <CardContent>
            <div className="prose prose-invert prose-pink max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {bounty.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Prize Distribution */}
        {sortedWinnings.length > 0 && (
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Prize Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedWinnings.map(([position, amount], index) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  key={position}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index === 0
                          ? "bg-yellow-500/20"
                          : index === 1
                            ? "bg-gray-400/20"
                            : index === 2
                              ? "bg-orange-600/20"
                              : "bg-white/10"
                      }`}
                    >
                      <Trophy
                        className={`h-5 w-5 ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-orange-600"
                                : "text-white/60"
                        }`}
                      />
                    </div>
                    <span className="font-medium text-white">
                      {index === 0
                        ? "1st"
                        : index === 1
                          ? "2nd"
                          : index === 2
                            ? "3rd"
                            : `${position}th`}{" "}
                      Place
                    </span>
                  </div>
                  <span className="font-semibold text-white">
                    {amount} {bounty.token}
                  </span>
                </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {bounty.skills && bounty.skills.length > 0 && (
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bounty.skills.map((skill) => (
                  <Badge
                    className="border-0 bg-white/10 text-white"
                    key={skill}
                    variant="secondary"
                  >
                    {getSkillLabel(skill)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        {bounty.resources && bounty.resources.length > 0 && (
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bounty.resources.map((resource, index) => (
                  <div className="flex items-start justify-between" key={index}>
                    <div>
                      <a
                        className="flex items-center gap-2 text-white transition-colors hover:text-[#E6007A]"
                        href={resource.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {resource.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {resource.description && (
                        <p className="mt-1 text-sm text-white/60">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Screening Questions */}
        {bounty.screening && bounty.screening.length > 0 && (
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Screening Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bounty.screening.map((question, index) => (
                  <div className="rounded-lg bg-white/5 p-4" key={index}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-medium text-sm text-white">
                            Question {index + 1}
                          </span>
                          {question.optional && (
                            <Badge
                              className="border-white/20 text-white/60 text-xs"
                              variant="outline"
                            >
                              Optional
                            </Badge>
                          )}
                          <Badge
                            className="border-0 bg-white/10 text-white/80 text-xs"
                            variant="secondary"
                          >
                            {question.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mb-3 text-sm text-white/80">
                          {question.question}
                        </p>
                        <div className="text-white/60 text-xs">
                          {question.type === "text" && (
                            <span>Text response required</span>
                          )}
                          {question.type === "url" && (
                            <span>URL/website link required</span>
                          )}
                          {question.type === "file" && (
                            <span>File upload required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
