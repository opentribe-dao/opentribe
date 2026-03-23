"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../components/header";
import { useAdminClaims } from "@/hooks/use-admin-claims";

function statusBadgeColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500/20 text-yellow-400";
    case "VERIFIED":
      return "bg-green-500/20 text-green-400";
    case "REJECTED":
      return "bg-red-500/20 text-red-400";
    case "EXPIRED":
      return "bg-white/10 text-white/40";
    default:
      return "bg-white/10 text-white/60";
  }
}

export default function ClaimsPage() {
  const [tab, setTab] = useState("PENDING");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminClaims({
    page,
    status: tab !== "all" ? tab : undefined,
  });

  const claims = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Claims" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="font-semibold text-2xl text-white">Claims Queue</h1>
          <p className="mt-1 text-sm text-white/60">
            Review and process ecosystem profile claim requests
          </p>
        </div>

        <Tabs
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          value={tab}
        >
          <TabsList className="bg-white/5">
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="VERIFIED">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4" value={tab}>
            <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">Profile</TableHead>
                    <TableHead className="text-white/60">Claimer</TableHead>
                    <TableHead className="text-white/60">Method</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">Date</TableHead>
                    <TableHead className="text-white/60">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow className="border-white/10" key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && claims.length === 0 && (
                    <TableRow className="border-white/10">
                      <TableCell
                        className="py-8 text-center text-white/40"
                        colSpan={6}
                      >
                        No claims found
                      </TableCell>
                    </TableRow>
                  )}
                  {claims.map((claim) => (
                    <TableRow
                      className="border-white/10 transition-colors hover:bg-white/5"
                      key={claim.id}
                    >
                      <TableCell>
                        <Link
                          className="text-white hover:text-[#E6007A]"
                          href={`/profiles/${claim.ecosystemProfile.id}`}
                        >
                          {claim.ecosystemProfile.displayName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          className="text-white/60 hover:text-white"
                          href={`/users/${claim.user.id}`}
                        >
                          {claim.user.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-0 bg-white/10 text-white/60"
                          variant="secondary"
                        >
                          {claim.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 ${statusBadgeColor(claim.status)}`}
                          variant="secondary"
                        >
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/claims/${claim.id}`}>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

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
