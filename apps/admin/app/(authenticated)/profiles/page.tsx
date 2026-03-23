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
import { useAdminProfiles } from "@/hooks/use-admin-profiles";

export default function ProfilesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [claimed, setClaimed] = useState("all");
  const [contactable, setContactable] = useState("all");

  const { data, isLoading } = useAdminProfiles({
    page,
    search: search || undefined,
    source: source !== "all" ? source : undefined,
    claimed: claimed !== "all" ? claimed : undefined,
    contactable: contactable !== "all" ? contactable : undefined,
  });

  const profiles = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Ecosystem Profiles" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">
              Ecosystem Profiles
            </h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total profiles
            </p>
          </div>
          <Link href="/profiles/new">
            <Button className="bg-[#E6007A] hover:bg-[#E6007A]/90">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Profile
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
              placeholder="Search by name, email, GitHub..."
              value={search}
            />
          </div>
          <Select
            onValueChange={(v) => {
              setSource(v);
              setPage(1);
            }}
            value={source}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[200px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="W3F_GRANTS">W3F Grants</SelectItem>
              <SelectItem value="POLKADOT_OPEN_SOURCE">Open Source</SelectItem>
              <SelectItem value="FAST_GRANTS">Fast Grants</SelectItem>
              <SelectItem value="ON_CHAIN_BOUNTY">On-chain Bounty</SelectItem>
              <SelectItem value="HACKATHON">Hackathon</SelectItem>
              <SelectItem value="PBA">PBA</SelectItem>
              <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
              <SelectItem value="MANUAL_ADMIN">Manual Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setClaimed(v);
              setPage(1);
            }}
            value={claimed}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[150px]">
              <SelectValue placeholder="Claimed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Claimed</SelectItem>
              <SelectItem value="false">Unclaimed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setContactable(v);
              setPage(1);
            }}
            value={contactable}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-[160px]">
              <SelectValue placeholder="Contactable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Contactable</SelectItem>
              <SelectItem value="false">Not Contactable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60">Source</TableHead>
                <TableHead className="text-white/60">Claimed</TableHead>
                <TableHead className="text-white/60">Contactable</TableHead>
                <TableHead className="text-white/60">Contributions</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow className="border-white/10" key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && profiles.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={7}
                  >
                    No profiles found
                  </TableCell>
                </TableRow>
              )}
              {profiles.map((profile) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={profile.id}
                >
                  <TableCell>
                    <Link
                      className="font-medium text-white hover:text-[#E6007A]"
                      href={`/profiles/${profile.id}`}
                    >
                      {profile.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {profile.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-0 bg-white/10 text-white/60"
                      variant="secondary"
                    >
                      {profile.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.claimedBy ? (
                      <Badge
                        className="border-0 bg-green-500/20 text-green-400"
                        variant="secondary"
                      >
                        {profile.claimedBy.name}
                      </Badge>
                    ) : (
                      <span className="text-white/40">Unclaimed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.contactable ? (
                      <Badge
                        className="border-0 bg-blue-500/20 text-blue-400"
                        variant="secondary"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-white/40">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {profile._count.contributions}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {new Date(profile.createdAt).toLocaleDateString()}
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
