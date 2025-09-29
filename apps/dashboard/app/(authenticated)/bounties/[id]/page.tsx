'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import {
  Badge,
  CalendarIcon,
  CoinsIcon,
  ExternalLink,
  Trophy,
} from 'lucide-react';

import { useBountyContext } from '../../components/bounty-provider';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

export default function BountyOverviewPage() {
  const { bounty, bountyLoading, bountyError } = useBountyContext();

  if (bountyLoading) {
    return <div>Loading...</div>;
  }
  if (bountyError || !bounty) {
    return <div>Bounty not found</div>;
  }

  const sortedWinnings = Object.entries(bounty.winnings).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

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
                <span className="text-2xl font-semibold text-white">
                  {bounty.amount} {bounty.token}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/badge50 border-white/10">
            <CardHeader>
              <CardDescription className="text-white/60">
                Deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#E6007A]" />
                <span className="text-2xl font-semibold text-white">
                  {new Date(bounty.deadline).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardDescription className="text-white/60">
                Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold text-white">
                {bounty.submissionCount}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
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
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>Prize Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedWinnings.map(([position, amount], index) => (
                <div
                  key={position}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index === 0
                          ? 'bg-yellow-500/20'
                          : index === 1
                            ? 'bg-gray-400/20'
                            : index === 2
                              ? 'bg-orange-600/20'
                              : 'bg-white/10'
                      }`}
                    >
                      <Trophy
                        className={`h-5 w-5 ${
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                              ? 'text-gray-400'
                              : index === 2
                                ? 'text-orange-600'
                                : 'text-white/60'
                        }`}
                      />
                    </div>
                    <span className="font-medium text-white">
                      {index === 0
                        ? '1st'
                        : index === 1
                          ? '2nd'
                          : index === 2
                            ? '3rd'
                            : `${position}th`}{' '}
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

        {/* Skills */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bounty.skills.map((skill) => (
                // <Badge
                //   key={skill}
                //   variant="secondary"
                //   className="border-0 bg-white/10 text-white"
                // >
                //   {skill}
                // </Badge>
                <span key={skill} className="px-3 py-1 rounded bg-white/10 text-white text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        {bounty.resources && bounty.resources.length > 0 && (
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bounty.resources.map((resource, index) => (
                  <div key={index} className="flex items-start justify-between">
                    <div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white transition-colors hover:text-[#E6007A]"
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
      </div>
    </div>
  );
}