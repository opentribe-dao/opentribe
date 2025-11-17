"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/base/components/ui/table";
import {
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { Header } from "../components/header";
import { NoOrganizationFallback } from "../components/no-organization-fallback";

interface RFP {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  viewCount: number;
  commentCount: number;
  voteCount: number;
  applicationCount: number;
  createdAt: string;
  publishedAt?: string;
  grant: {
    id: string;
    title: string;
    slug: string;
  };
}

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "COMPLETED", label: "Completed" },
];

const VISIBILITIES = [
  { value: "all", label: "All Visibility" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function RFPsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  useEffect(() => {
    if (activeOrg) {
      fetchRFPs();
    }
  }, [activeOrg]);

  const fetchRFPs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch RFPs");
      }

      const data = await response.json();
      setRfps(data.rfps || []);
    } catch (error) {
      console.error("Error fetching RFPs:", error);
      toast.error("Failed to load RFPs");
    } finally {
      setLoading(false);
    }
  };

  const filteredRfps = rfps.filter((rfp) => {
    const matchesSearch =
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.grant.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfp.status === statusFilter;
    const matchesVisibility =
      visibilityFilter === "all" || rfp.visibility === visibilityFilter;

    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-500/20 text-green-400";
      case "CLOSED":
        return "bg-red-500/20 text-red-400";
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "PUBLISHED":
        return "bg-transparent text-green-400";
      case "DRAFT":
        return "bg-transparent text-yellow-400";
      case "ARCHIVED":
        return "bg-transparent text-gray-400";
      default:
        return "bg-transparent text-white/60";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (!activeOrg) {
    return <NoOrganizationFallback />;
  }

  return (
    <>
      <Header page="RFPs" pages={["RFPs"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-white">RFPs</h1>
            <p className="text-white/60">
              Manage your organization's Requests for Proposals
            </p>
          </div>
          <Button
            className="bg-[#E6007A] hover:bg-[#E6007A]/90"
            onClick={() => router.push("/rfps/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create RFP
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-white/40" />
                  <Input
                    className="border-white/10 bg-white/5 pl-10 text-white"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search RFPs..."
                    value={searchTerm}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={setVisibilityFilter}
                  value={visibilityFilter}
                >
                  <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITIES.map((visibility) => (
                      <SelectItem
                        key={visibility.value}
                        value={visibility.value}
                      >
                        {visibility.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* RFPs Table */}
        {(() => {
          const hasFilters =
            searchTerm ||
            statusFilter !== "all" ||
            visibilityFilter !== "all";
          const emptyMessage = hasFilters
            ? "No RFPs found matching your filters"
            : "No RFPs created yet";

          let content: React.ReactNode;
          if (loading) {
            content = (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
              </div>
            );
          } else if (filteredRfps.length === 0) {
            content = (
              <div className="p-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-white/20" />
                <p className="mb-4 text-white/60">{emptyMessage}</p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  visibilityFilter === "all" && (
                    <Button
                      className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                      onClick={() => router.push("/rfps/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First RFP
                    </Button>
                  )}
              </div>
            );
          } else {
            content = (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="px-6 py-3 text-white">RFP</TableHead>
                    <TableHead className="px-6 py-3 text-white">GRANT</TableHead>
                    <TableHead className="px-6 py-3 text-white">STATUS</TableHead>
                    <TableHead className="px-6 py-3 text-white">VISIBILITY</TableHead>
                    <TableHead className="px-6 py-3 text-center text-white">
                      STATS
                    </TableHead>
                    <TableHead className="px-6 py-3 text-white">CREATED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRfps.map((rfp) => (
                    <TableRow
                      className="cursor-pointer border-white/10 transition-colors hover:bg-white/5"
                      key={rfp.id}
                      onClick={() => router.push(`/rfps/${rfp.id}`)}
                    >
                      <TableCell className="px-6 py-3">
                        <div>
                          <p className="font-medium text-white">{rfp.title}</p>
                          <p className="text-sm text-white/60">/{rfp.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Link
                          className="text-[#E6007A] hover:underline"
                          href={`/grants/${rfp.grant.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {rfp.grant.title}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge
                          className={`${getStatusColor(rfp.status)} border-0`}
                        >
                          {rfp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge
                          className={`${getVisibilityColor(
                            rfp.visibility
                          )} border-0`}
                        >
                          {rfp.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{rfp.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{rfp.commentCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{rfp.voteCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{rfp.applicationCount}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-white/60">
                        {formatDate(rfp.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          }

          return (
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-0">{content}</CardContent>
            </Card>
          );
        })()}
      </div>
    </>
  );
}
