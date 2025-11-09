"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { Badge } from "@packages/base/components/ui/badge";
import { Input } from "@packages/base/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Loader2,
  DollarSign,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "../components/header";
import { env } from "@/env";
import { getTokenLogo } from "@packages/base/lib/utils";

interface Grant {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  source: string;
  minAmount?: number;
  maxAmount?: number;
  totalFunds?: number;
  token: string;
  createdAt: string;
  publishedAt?: string;
  _count: {
    applications: number;
    rfps: number;
    curators: number;
  };
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  stats?: {
    applicationsCount: number;
    rfpsCount: number;
    curatorsCount: number;
    approvedApplicationsCount: number;
    totalApprovedAmount: number;
    remainingFunds: number;
    fundingProgress: number;
  };
}

const GrantsPage = () => {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrants = async () => {
      if (!activeOrg) return;

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/grants`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch grants");
        }

        const data = await response.json();
        setGrants(data.grants || []);
      } catch (error) {
        console.error("Error fetching grants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [activeOrg]);

  if (!session?.user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "bg-green-500/20 text-green-400 border-0";
      case "PAUSED":
        return "bg-yellow-500/20 text-yellow-400 border-0";
      case "CLOSED":
        return "bg-red-500/20 text-red-400 border-0";
      default:
        return "bg-gray-500/20 text-gray-400 border-0";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toUpperCase()) {
      case "EXTERNAL":
        return "bg-blue-500/20 text-blue-400 border-0";
      case "NATIVE":
      default:
        return "bg-purple-500/20 text-purple-400 border-0";
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter grants based on search query and filters
  const filteredGrants = grants.filter((grant) => {
    const matchesSearch =
      searchQuery === "" ||
      grant.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      grant.status.toUpperCase() === filterStatus.toUpperCase();
    const matchesSource =
      filterSource === "all" ||
      grant.source.toUpperCase() === filterSource.toUpperCase();
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Sort grants
  const sortedGrants = [...filteredGrants].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "applications":
        return b._count.applications - a._count.applications;
      case "newest":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header pages={["Overview"]} page="Grants" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Grants</h1>
          <Button
            className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
            asChild
          >
            <Link href="/grants/create">Create New Grant</Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search grants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/40"
            />
          </div>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="all" className="text-white">
                All Sources
              </SelectItem>
              <SelectItem value="native" className="text-white">
                Native
              </SelectItem>
              <SelectItem value="external" className="text-white">
                External
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="border-white/10 text-white/60 hover:bg-white/5"
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="newest" className="text-white">
                Newest first
              </SelectItem>
              <SelectItem value="oldest" className="text-white">
                Oldest first
              </SelectItem>
              <SelectItem value="applications" className="text-white">
                Most applications
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grants Table */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  Funding Range
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  Applications
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                  RFPs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40 mx-auto" />
                  </td>
                </tr>
              ) : sortedGrants.length > 0 ? (
                sortedGrants.map((grant) => (
                  <tr
                    key={grant.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/grants/${grant.id}`}
                        className="text-white hover:text-[#E6007A] transition-colors font-medium"
                      >
                        {grant.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getTokenLogo(grant.token) ? (
                          // Show token logo if available
                          <img
                            src={getTokenLogo(grant.token) || ""}
                            alt={grant.token || "Token"}
                            className="h-4 w-4 rounded-full object-contain bg-white/10"
                          />
                        ) : (
                          <DollarSign className="h-4 w-4 text-white/40" />
                        )}
                        <span className="text-white/80">
                          {grant.minAmount || grant.maxAmount ? (
                            <>
                              {formatAmount(grant.minAmount)} -{" "}
                              {formatAmount(grant.maxAmount)} {grant.token}
                            </>
                          ) : (
                            "Open"
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getStatusColor(grant.status)}>
                        {grant.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getSourceColor(grant.source)}>
                        {grant.source}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">
                          {grant._count?.applications || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">
                          {grant._count?.rfps || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="space-y-3">
                      <p className="text-white/60">
                        {searchQuery ||
                        filterStatus !== "all" ||
                        filterSource !== "all"
                          ? "No grants match your search criteria"
                          : "No grants yet"}
                      </p>
                      {!searchQuery &&
                        filterStatus === "all" &&
                        filterSource === "all" && (
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            asChild
                          >
                            <Link href="/grants/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create your first grant
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

export default GrantsPage;
