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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../components/header";
import { useAdminGrants } from "@/hooks/use-admin-grants";

export default function GrantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [fundingSource, setFundingSource] = useState("all");

  const { data, isLoading } = useAdminGrants({
    page,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    source: source !== "all" ? source : undefined,
    fundingSource: fundingSource !== "all" ? fundingSource : undefined,
  });

  const grants = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Grants" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">Grants</h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total grants
            </p>
          </div>
          <Link href="/grants/new">
            <Button className="bg-[#E6007A] hover:bg-[#E6007A]/90">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Grant
            </Button>
          </Link>
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
              placeholder="Search grants..."
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
            <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setSource(v);
              setPage(1);
            }}
            value={source}
          >
            <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="NATIVE">Native</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setFundingSource(v);
              setPage(1);
            }}
            value={fundingSource}
          >
            <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Funding" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funding</SelectItem>
              <SelectItem value="SELF_FUNDED">Self Funded</SelectItem>
              <SelectItem value="TREASURY">Treasury</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Title</TableHead>
                <TableHead className="text-white/60">Organization</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Source</TableHead>
                <TableHead className="text-white/60">Applications</TableHead>
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
              {!isLoading && grants.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={6}
                  >
                    No grants found
                  </TableCell>
                </TableRow>
              )}
              {grants.map((grant) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={grant.id}
                >
                  <TableCell>
                    <Link
                      className="font-medium text-white hover:text-[#E6007A]"
                      href={`/grants/${grant.id}`}
                    >
                      {grant.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {grant.organization.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {grant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {grant.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {grant._count.applications}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {new Date(grant.createdAt).toLocaleDateString()}
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
