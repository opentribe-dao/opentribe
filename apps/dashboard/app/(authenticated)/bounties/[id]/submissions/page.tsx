'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import {
  Badge,
  CheckCircle,
  ExternalLink,
  Loader2,
  Trophy,
  Users,
  Calendar,
  Filter,
  Search,
  Eye,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { useBountyContext } from '../bounty-provider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SubmissionsPage() {
  const { bounty, submissions, submissionsLoading, submissionsError } =
    useBountyContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED'
  >('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'likes' | 'comments'
  >('newest');

  // Filtering
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (s.title &&
          s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.submitter?.username &&
          s.submitter.username
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (s.submitter?.firstName &&
          s.submitter.firstName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'oldest':
        list.sort(
          (a, b) =>
            new Date(a.submittedAt || 0).getTime() -
            new Date(b.submittedAt || 0).getTime()
        );
        break;
      case 'likes':
        list.sort(
          (a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0)
        );
        break;
      case 'comments':
        list.sort(
          (a, b) =>
            (b.stats?.commentsCount || 0) - (a.stats?.commentsCount || 0)
        );
        break;
      case 'newest':
      default:
        list.sort(
          (a, b) =>
            new Date(b.submittedAt || 0).getTime() -
            new Date(a.submittedAt || 0).getTime()
        );
        break;
    }
    return list;
  }, [filtered, sortBy]);

  if (submissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }
  if (submissionsError || !submissions) {
    return <div className="text-white">Submissions not found</div>;
  }

  if (!bounty) {
    return <div className="text-white">Bounty not found</div>;
  }

  const sortedWinnings = Object.entries(bounty.winnings).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-500/20 text-blue-400';
      case 'UNDER_REVIEW':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'SELECTED':
        return 'bg-green-500/20 text-green-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  return (
    <div className="space-y-6 ">
      {/* Header with filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-white">
          <h2 className="text-2xl font-semibold">Submissions</h2>
          <p className="text-sm text-white/60">{submissions.length} total</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search title or user"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/40"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="all" className="text-white">
                All statuses
              </SelectItem>
              <SelectItem value="SUBMITTED" className="text-white">
                Submitted
              </SelectItem>
              <SelectItem value="UNDER_REVIEW" className="text-white">
                Under review
              </SelectItem>
              <SelectItem value="SELECTED" className="text-white">
                Selected
              </SelectItem>
              <SelectItem value="REJECTED" className="text-white">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="newest" className="text-white">
                Newest
              </SelectItem>
              <SelectItem value="oldest" className="text-white">
                Oldest
              </SelectItem>
              <SelectItem value="likes" className="text-white">
                Most likes
              </SelectItem>
              <SelectItem value="comments" className="text-white">
                Most comments
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Winners section if already announced */}
      {bounty.winnersAnnouncedAt && (
        <Card className="border-green-500/30 bg-green-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-green-400" />
              Winners Announced
            </CardTitle>
            <CardDescription>
              Winners were announced on{' '}
              {new Date(bounty.winnersAnnouncedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row flex-wrap gap-4">
              {submissions
                .filter((s) => s.isWinner)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((winner) => (
                  <div key={winner.id} className="rounded-lg bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Trophy
                        className={`h-6 w-6 ${
                          winner.position === 1
                            ? 'text-yellow-500'
                            : winner.position === 2
                              ? 'text-gray-400'
                              : winner.position === 3
                                ? 'text-orange-600'
                                : 'text-white/60'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {winner.submitter.firstName ||
                            winner.submitter.username ||
                            'Anonymous'}
                        </p>
                        <p className="text-sm text-white/60">
                          {winner.position === 1
                            ? '1st'
                            : winner.position === 2
                              ? '2nd'
                              : winner.position === 3
                                ? '3rd'
                                : `${winner.position}th`}{' '}
                          Place
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 text-center">
                      <p className="text-2xl font-bold text-white">
                        {winner.winningAmount} {bounty.token}
                      </p>
                      <p className="text-xs text-white/60">Prize Amount</p>
                    </div>
                    <div className="flex items-center justify-center">
                      {winner.payments && winner.payments.length > 0 ? (
                        <Badge className="border-0 bg-green-500/20 text-green-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-white/10 text-white/70">
                          Unpaid
                        </Badge>
                      )}
                    </div>
                    {winner.submitter.walletAddress && (
                      <div className="mt-3 rounded bg-black/20 p-2">
                        <p className="mb-1 text-xs text-white/60">
                          Payment Address
                        </p>
                        <p className="break-all font-mono text-xs text-white">
                          {winner.submitter.walletAddress}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions grid */}
      {sorted.length === 0 ? (
        <Card className="border-white/10 bg-zinc-900/50">
          <CardContent className="p-6">
            <p className="text-center text-white/60">
              No submissions match your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((submission) => (
              <Card
                key={submission.id}
                className={`border-white/10 bg-zinc-900/50 transition-all hover:bg-zinc-800/50 ${submission.isWinner ? 'border-green-500/50' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {submission.submitter.avatarUrl ? (
                        <img
                          src={submission.submitter.avatarUrl}
                          alt={submission.submitter.username}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                          {submission.submitter.username?.[0]?.toUpperCase() ||
                            'A'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {submission.submitter.firstName ||
                            submission.submitter.username ||
                            'Anonymous'}
                        </h3>
                        {submission.submitter.headline && (
                          <p className="truncate text-xs text-white/60">
                            {submission.submitter.headline}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(submission.status)}`}
                      >
                        {submission.status}
                      </span>
                      {submission.isWinner && (
                        <div className="flex items-center gap-1">
                          <Trophy
                            className={`h-3 w-3 ${
                              submission.position === 1
                                ? 'text-yellow-500'
                                : submission.position === 2
                                  ? 'text-gray-400'
                                  : submission.position === 3
                                    ? 'text-orange-600'
                                    : 'text-white/60'
                            }`}
                          />
                          <span className="text-xs font-medium text-white">
                            {submission.position === 1
                              ? '1st'
                              : submission.position === 2
                                ? '2nd'
                                : submission.position === 3
                                  ? '3rd'
                                  : `${submission.position}th`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {submission.title && (
                    <h4 className="mb-2 line-clamp-2 text-sm font-medium text-white">
                      {submission.title}
                    </h4>
                  )}
                  {submission.description && (
                    <div className="mb-3 line-clamp-3 text-xs text-white/80">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {submission.description}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mb-4 flex items-center gap-4 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{submission.stats?.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{submission.stats?.commentsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {submission.submittedAt
                          ? new Date(
                              submission.submittedAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                      asChild
                    >
                      <Link
                        href={`/bounties/${bounty.id}/submissions/${submission.id}`}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Review
                      </Link>
                    </Button>
                    {submission.submissionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                        asChild
                      >
                        <a
                          href={submission.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}
    </div>
  );
}
