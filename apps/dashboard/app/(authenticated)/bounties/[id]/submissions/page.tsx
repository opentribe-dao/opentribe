"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Trophy,
  Calendar,
  Search,
  Eye,
  MessageCircle,
  Heart,
  Award,
} from "lucide-react";
import { useBountyContext } from "../../../components/bounty-provider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { set } from "zod/v4-mini";
import { Badge } from "@packages/base/components/ui/badge";

export default function SubmissionsPage() {
  const {
    bounty,
    submissions,
    submissionsLoading,
    submissionsError,
    setPaymentModalOpen,
    setSelectedPaymentSubmission,
    announceWinners,
    setSelectedWinners,
    isAnnouncing,
    selectedWinners,
    resetWinners,
    isResetingWinners,
  } = useBountyContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "SUBMITTED" | "UNDER_REVIEW" | "SELECTED" | "REJECTED"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "likes" | "comments"
  >("newest");

  // Compute sorted winners and also save them in selectedWinners
  useMemo(() => {
    const winners = submissions
      .filter(
        (s) =>
          s.status === "APPROVED" &&
          s.position != null &&
          s.winningAmount != null
      )
      .sort((a, b) => {
        if (a.position == null && b.position == null) {
          return 0;
        }
        if (a.position == null) {
          return 1;
        }
        if (b.position == null) {
          return -1;
        }
        return a.position - b.position;
      });

    // Save to selectedWinners as a Map<submissionId, { position, amount, username }>
    if (winners.length > 0) {
      const winnersMap = new Map<
        string,
        { position: number; amount: string; username: string }
      >();
      for (const s of winners) {
        if (
          s.position == null ||
          s.winningAmount == null ||
          s.submitter.username == null
        ) {
          continue;
        }
        winnersMap.set(s.id, {
          position: s.position,
          amount: s.winningAmount,
          username: s.submitter.username,
        });
      }
      setSelectedWinners(winnersMap);
    }

    // Return array for display
    return winners.map((s) => ({
      position: s.position,
      winningAmount: s.winningAmount,
      username: s.submitter.username,
    }));
  }, [submissions, setSelectedWinners]);

  // Filtering
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
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
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.submittedAt || 0).getTime() -
            new Date(b.submittedAt || 0).getTime()
        );
        break;
      case "likes":
        list.sort(
          (a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0)
        );
        break;
      case "comments":
        list.sort(
          (a, b) =>
            (b.stats?.commentsCount || 0) - (a.stats?.commentsCount || 0)
        );
        break;
      case "newest":
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/20 text-blue-400";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      case "SELECTED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="space-y-6 ">
      {/* Header with filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 z-10" />
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
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-[70%]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
              {sorted.map((submission) => (
                <Card
                  key={submission.id}
                  className={`border-white/10 bg-zinc-900/50 transition-all hover:bg-zinc-800/50 ${
                    submission.isWinner ? "border-green-500/50" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {submission.submitter.image ? (
                          <img
                            src={submission.submitter.image}
                            alt={submission.submitter.username}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                            {submission.submitter.username?.[0]?.toUpperCase() ||
                              "A"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate text-sm font-semibold text-white">
                            {submission.submitter.firstName ||
                              submission.submitter.username ||
                              "Anonymous"}
                          </CardTitle>
                          {submission.submitter.headline && (
                            <p className="truncate text-xs text-white/60">
                              {submission.submitter.headline}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status}
                        </Badge>
                        {submission.isWinner && (
                          <div className="flex items-center gap-1">
                            <Trophy
                              className={`h-3 w-3 ${
                                submission.position === 1
                                  ? "text-yellow-500"
                                  : submission.position === 2
                                  ? "text-gray-400"
                                  : submission.position === 3
                                  ? "text-orange-600"
                                  : "text-white/60"
                              }`}
                            />
                            <span className="text-xs font-medium text-white">
                              {submission.position === 1
                                ? "1st"
                                : submission.position === 2
                                ? "2nd"
                                : submission.position === 3
                                ? "3rd"
                                : `${submission.position}th`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {submission.title && (
                      <h4 className="mb-2 text-sm font-medium text-white">
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
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!bounty.winnersAnnouncedAt && (
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
                      )}
                      {submission.submissionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                          asChild
                        >
                          <a
                            href={submission.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-[30%]">
            {bounty.winnersAnnouncedAt ? (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {/* <Trophy className="h-4 w-4 text-green-400" /> */}
                      Winners Announced
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(bounty.winnersAnnouncedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {submissions
                      .filter((s) => s.isWinner)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((winner) => (
                        <div
                          key={winner.id}
                          className="rounded-lg bg-white/5 px-3 py-3"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  winner.position === 1
                                    ? "bg-yellow-500/20"
                                    : winner.position === 2
                                    ? "bg-gray-400/20"
                                    : winner.position === 3
                                    ? "bg-orange-600/20"
                                    : "bg-white/10"
                                }`}
                              >
                                <Trophy
                                  className={`h-4 w-4 ${
                                    winner.position === 1
                                      ? "text-yellow-500"
                                      : winner.position === 2
                                      ? "text-gray-400"
                                      : winner.position === 3
                                      ? "text-orange-600"
                                      : "text-white/60"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                  {winner.submitter.firstName ||
                                    winner.submitter.username ||
                                    "Anonymous"}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className="h-5 rounded px-2 text-[10px] bg-white/10 text-white/70 border-0">
                                    {(() => {
                                      if (winner.position === 1) {
                                        return "1st";
                                      }
                                      if (winner.position === 2) {
                                        return "2nd";
                                      }
                                      if (winner.position === 3) {
                                        return "3rd";
                                      }
                                      if (
                                        typeof winner.position === "number" &&
                                        winner.position > 0
                                      ) {
                                        const j = winner.position % 10,
                                          k = winner.position % 100;
                                        if (j === 1 && k !== 11) {
                                          return `${winner.position}st`;
                                        }
                                        if (j === 2 && k !== 12) {
                                          return `${winner.position}nd`;
                                        }
                                        if (j === 3 && k !== 13) {
                                          return `${winner.position}rd`;
                                        }
                                        return `${winner.position}th`;
                                      }
                                      return "";
                                    })()}{" "}
                                    Place
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-white leading-tight">
                                  {winner.winningAmount} {bounty.token}
                                </p>
                                <p className="text-[10px] text-white/60">
                                  Prize
                                </p>
                              </div>
                            </div>
                          </div>

                          {winner.submitter.walletAddress && (
                            <div className=" mt-2 rounded bg-black/20 px-2 py-1 mb-4">
                              <p className="text-[10px] text-white/60">
                                Address
                              </p>
                              <p className="break-all text-[10px] text-white">
                                {winner.submitter.walletAddress}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-center mt-2">
                            {winner.payments && winner.payments.length > 0 ? (
                              <Badge className="flex h-6 w-full items-center justify-center border-0 bg-green-500/20 text-green-400">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Paid
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedPaymentSubmission(winner);
                                  setPaymentModalOpen(true);
                                }}
                                className="h-7 w-full bg-[#E6007A] px-2 text-xs text-white hover:bg-[#E6007A]/90"
                              >
                                {/* <DollarSign className="h-3.5 w-3.5 mr-1" /> */}
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900/50 border-white/10 px-0">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Selected Winners
                  </CardTitle>
                  {selectedWinners.size > 0 && (
                    <Button
                      className="text-sm"
                      onClick={resetWinners}
                      variant={"ghost"}
                      disabled={isResetingWinners}
                    >
                      {isResetingWinners ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Reset
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div>
                    {selectedWinners.size > 0 ? (
                      [...selectedWinners.entries()].map(
                        ([submissionId, winnerData]) => {
                          const user = winnerData.username;
                          return (
                            <div
                              key={submissionId}
                              className="mb-2 flex items-center justify-between rounded-lg bg-white/5 p-2 px-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    winnerData.position === 1
                                      ? "bg-yellow-500/20"
                                      : winnerData.position === 2
                                      ? "bg-gray-400/20"
                                      : winnerData.position === 3
                                      ? "bg-orange-600/20"
                                      : "bg-white/10"
                                  }`}
                                >
                                  <Trophy
                                    className={`h-4 w-4 ${
                                      winnerData.position === 1
                                        ? "text-yellow-500"
                                        : winnerData.position === 2
                                        ? "text-gray-400"
                                        : winnerData.position === 3
                                        ? "text-orange-600"
                                        : "text-white/60"
                                    }`}
                                  />
                                </div>
                                <span className="font-medium text-white">
                                  {(() => {
                                    if (winnerData.position === 1) {
                                      return "1st";
                                    }
                                    if (winnerData.position === 2) {
                                      return "2nd";
                                    }
                                    if (winnerData.position === 3) {
                                      return "3rd";
                                    }
                                    if (
                                      typeof winnerData.position === "number" &&
                                      winnerData.position > 0
                                    ) {
                                      const j = winnerData.position % 10,
                                        k = winnerData.position % 100;
                                      if (j === 1 && k !== 11) {
                                        return `${winnerData.position}st`;
                                      }
                                      if (j === 2 && k !== 12) {
                                        return `${winnerData.position}nd`;
                                      }
                                      if (j === 3 && k !== 13) {
                                        return `${winnerData.position}rd`;
                                      }
                                      return `${winnerData.position}th`;
                                    }
                                    return "";
                                  })()}{" "}
                                  Place
                                </span>
                              </div>
                              <span className="font-semibold text-white">
                                {user}
                              </span>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className=" flex items-center justify-center py-4 text-sm text-white/60">
                        No Winners Selected{" "}
                      </div>
                    )}
                  </div>
                </CardContent>
                {bounty.status === "OPEN" &&
                  submissions.length > 0 &&
                  !bounty.winnersAnnouncedAt && (
                    <Button
                      size="sm"
                      className="gap-0 bg-green-600 text-white hover:bg-green-700 mx-6"
                      onClick={announceWinners}
                      disabled={isAnnouncing || selectedWinners.size === 0}
                    >
                      {isAnnouncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Announcing...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-4 w-4" />
                          Announce Winners ({selectedWinners.size})
                        </>
                      )}
                    </Button>
                  )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
