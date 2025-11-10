"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
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
import { Calendar, Filter, Loader2, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { env } from "@/env";
import { Header } from "../components/header";

interface Bounty {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  amount: number;
  token: string;
  deadline: string;
  createdAt: string;
  publishedAt?: string;
  _count: {
    submissions: number;
  };
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
}

const BountiesPage = () => {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBounties = async () => {
      if (!activeOrg) return;

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/bounties`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bounties");
        }

        const data = await response.json();
        setBounties(data.bounties || []);
      } catch (error) {
        console.error("Error fetching bounties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, [activeOrg]);

  if (!session?.user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-0";
      case "REVIEWING":
        return "bg-yellow-500/20 text-yellow-400 border-0";
      case "CLOSED":
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400 border-0";
      case "DRAFT":
      default:
        return "bg-gray-500/20 text-gray-400 border-0";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "Open";
      case "ACTIVE":
        return "Active";
      case "REVIEWING":
        return "Reviewing";
      case "CLOSED":
        return "Closed";
      case "COMPLETED":
        return "Completed";
      case "DRAFT":
      default:
        return "Draft";
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter bounties based on search query
  const filteredBounties = bounties.filter((bounty) => {
    const matchesSearch =
      searchQuery === "" ||
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      bounty.status.toUpperCase() === filterStatus.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Sort bounties
  const sortedBounties = [...filteredBounties].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "submissions":
        return b._count.submissions - a._count.submissions;
      case "newest":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header page="Bounties" pages={["Overview"]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-3xl text-white">Bounties</h1>
          <Button
            asChild
            className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
          >
            <Link href="/bounties/create">Create New Bounty</Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 z-10 h-4 w-4 text-white/40" />
            <Input
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              value={searchQuery}
            />
          </div>
          <Button
            className="border-white/10 text-white/60 hover:bg-white/5"
            size="icon"
            variant="outline"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Select onValueChange={setSortBy} value={sortBy}>
            <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              <SelectItem className="text-white" value="newest">
                Newest first
              </SelectItem>
              <SelectItem className="text-white" value="oldest">
                Oldest first
              </SelectItem>
              <SelectItem className="text-white" value="submissions">
                Most submissions
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bounties Table */}
        <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-white/10 border-b">
                <th className="px-6 py-4 text-left font-medium text-white/60 text-xs uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-center font-medium text-white/60 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center font-medium text-white/60 text-xs uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-4 text-center font-medium text-white/60 text-xs uppercase tracking-wider">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={4}>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/40" />
                  </td>
                </tr>
              ) : sortedBounties.length > 0 ? (
                sortedBounties.map((bounty) => (
                  <tr
                    className="transition-colors hover:bg-white/5"
                    key={bounty.id}
                  >
                    <td className="px-6 py-4">
                      <Link
                        className="font-medium text-white transition-colors hover:text-[#E6007A]"
                        href={`/bounties/${bounty.id}/`}
                      >
                        {bounty.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getStatusColor(bounty.status)}>
                        {getStatusLabel(bounty.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">
                          {bounty._count?.submissions || 0} submissions
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">
                          {formatDeadline(bounty.deadline)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={4}>
                    <div className="space-y-3">
                      <p className="text-white/60">
                        {searchQuery || filterStatus !== "all"
                          ? "No bounties match your search criteria"
                          : "No bounties yet"}
                      </p>
                      {!searchQuery && filterStatus === "all" && (
                        <Button
                          asChild
                          className="border-white/20 text-white hover:bg-white/10"
                          variant="outline"
                        >
                          <Link href="/bounties/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first bounty
                          </Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BountiesPage;
