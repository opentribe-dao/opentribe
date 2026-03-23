"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
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
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../components/header";
import { useAdminImports } from "@/hooks/use-admin-imports";

function statusBadgeColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500/20 text-green-400";
    case "RUNNING":
      return "bg-blue-500/20 text-blue-400";
    case "IMPORT_PENDING":
      return "bg-yellow-500/20 text-yellow-400";
    case "IMPORT_FAILED":
      return "bg-red-500/20 text-red-400";
    case "PARTIAL":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-white/10 text-white/60";
  }
}

export default function ImportsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useAdminImports({
    page,
    status: status !== "all" ? status : undefined,
  });

  const imports = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Imports" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">Import Jobs</h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total import jobs
            </p>
          </div>
          <Select
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            value={status}
          >
            <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="IMPORT_PENDING">Pending</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="IMPORT_FAILED">Failed</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Source</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Total</TableHead>
                <TableHead className="text-white/60">Processed</TableHead>
                <TableHead className="text-white/60">Errors</TableHead>
                <TableHead className="text-white/60">Started</TableHead>
                <TableHead className="text-white/60">Completed</TableHead>
                <TableHead className="text-white/60">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow className="border-white/10" key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && imports.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={8}
                  >
                    No import jobs found
                  </TableCell>
                </TableRow>
              )}
              {imports.map((job) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={job.id}
                >
                  <TableCell className="font-medium text-white">
                    {job.source}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border-0 ${statusBadgeColor(job.status)}`}
                      variant="secondary"
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {job.totalItems}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {job.processed}
                  </TableCell>
                  <TableCell>
                    {job.errors > 0 ? (
                      <span className="text-red-400">{job.errors}</span>
                    ) : (
                      <span className="text-white/60">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {job.completedAt
                      ? new Date(job.completedAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/imports/${job.id}`}>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </Link>
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
