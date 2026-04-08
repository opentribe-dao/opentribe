"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/base/components/ui/table";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../components/header";
import { useAdminBounties } from "@/hooks/use-admin-bounties";

export default function BountiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useAdminBounties({
    page,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const bounties = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Bounties" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">Bounties</h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total bounties
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search bounties..."
              value={search}
            />
          </div>
          <Select
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            value={status}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="REVIEWING">Reviewing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Title</TableHead>
                <TableHead className="text-white/60">Organization</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Amount</TableHead>
                <TableHead className="text-white/60">Submissions</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow className="border-white/10" key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && bounties.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={6}
                  >
                    No bounties found
                  </TableCell>
                </TableRow>
              )}
              {bounties.map((bounty) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={bounty.id}
                >
                  <TableCell>
                    <Link
                      className="font-medium text-white hover:text-[#E6007A]"
                      href={`/bounties/${bounty.id}`}
                    >
                      {bounty.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {bounty.organization.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {bounty.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {bounty.amount
                      ? `${bounty.amount} ${bounty.token}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {bounty._count.submissions}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {new Date(bounty.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="outline"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="outline"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
