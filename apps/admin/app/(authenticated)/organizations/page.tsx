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
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";

export default function OrganizationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orgType, setOrgType] = useState("all");
  const [visibility, setVisibility] = useState("all");

  const { data, isLoading } = useAdminOrganizations({
    page,
    search: search || undefined,
    orgType: orgType !== "all" ? orgType : undefined,
    visibility: visibility !== "all" ? visibility : undefined,
  });

  const organizations = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Organizations" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">Organizations</h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total organizations
            </p>
          </div>
          <Link href="/organizations/new">
            <Button className="bg-[#E6007A] hover:bg-[#E6007A]/90">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Organization
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
              placeholder="Search organizations..."
              value={search}
            />
          </div>
          <Select
            onValueChange={(v) => {
              setOrgType(v);
              setPage(1);
            }}
            value={orgType}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="DAO">DAO</SelectItem>
              <SelectItem value="FOUNDATION">Foundation</SelectItem>
              <SelectItem value="CURATOR_GROUP">Curator Group</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setVisibility(v);
              setPage(1);
            }}
            value={visibility}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[180px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Type</TableHead>
                <TableHead className="text-white/60">Visibility</TableHead>
                <TableHead className="text-white/60">Verified</TableHead>
                <TableHead className="text-white/60">Members</TableHead>
                <TableHead className="text-white/60">Bounties</TableHead>
                <TableHead className="text-white/60">Grants</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow className="border-white/10" key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && organizations.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={8}
                  >
                    No organizations found
                  </TableCell>
                </TableRow>
              )}
              {organizations.map((org) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={org.id}
                >
                  <TableCell>
                    <Link
                      className="font-medium text-white hover:text-[#E6007A]"
                      href={`/organizations/${org.id}`}
                    >
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {org.orgType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {org.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.isVerified ? (
                      <Badge
                        className="border-0 bg-green-500/20 text-green-400"
                        variant="secondary"
                      >
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {org._count.members}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {org._count.bounties}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {org._count.grants}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {new Date(org.createdAt).toLocaleDateString()}
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
