"use client";

import { useState, useEffect, useRef } from "react";
import { GrantCard } from "../components/cards/grant-card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@packages/base/components/ui/radio-group";
import { Label } from "@packages/base/components/ui/label";
import { Slider } from "@packages/base/components/ui/slider";
import { Search, Filter, ThumbsUp } from "lucide-react";
import { env } from "@/env";
import Image from "next/image";

const FILTER_TABS = [
  "All",
  "Writer",
  "Coder",
  "Creator",
  "Open",
  "Safe",
  "Active New",
  "Backend",
];

export default function GrantsPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState({
    published: true,
    completed: false,
  });
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 100000]);

  useEffect(() => {
    fetchGrants();
  }, [page, searchQuery]);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL;

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "9",
      });

      // Add search parameter if query exists
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(
        `${apiUrl}/api/v1/grants?${params.toString()}`
      );

      if (!response.ok) {
        console.error("Failed to fetch grants");
        return;
      }

      const data = await response.json();

      if (page === 1) {
        setGrants(data.grants || []);
      } else {
        setGrants((prev) => [...prev, ...(data.grants || [])]);
      }

      setHasMore(data.grants?.length === 9);
    } catch (error) {
      console.error("Error fetching grants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      // Reset to first page when search query changes
      if (page !== 1) {
        setPage(1);
      } else {
        // If already on page 1, trigger fetch
        fetchGrants();
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const totalGrants = grants.length;

  // Mock top RFPs data
  const topRFPs = [
    {
      title: "Polkadot Data Analytics Platform",
      grant: "polkadot ecosystem",
      votes: 134,
      color: "from-pink-500 to-purple-600",
    },
    {
      title: "Substrate Development Tools",
      grant: "substrate builders",
      votes: 98,
      color: "from-blue-500 to-cyan-600",
    },
    {
      title: "Cross-chain Bridge Infrastructure",
      grant: "polkadot innovation",
      votes: 87,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "DeFi Protocol Integration",
      grant: "acala ecosystem",
      votes: 76,
      color: "from-orange-500 to-red-600",
    },
    {
      title: "NFT Marketplace Standard",
      grant: "kusama treasury",
      votes: 65,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Governance Tooling Suite",
      grant: "web3 foundation",
      votes: 54,
      color: "from-indigo-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-bold font-heading text-4xl">Grants</h1>
          <p className="text-white/60 ">
            Grants help grow grant programs in the Polkadot ecosystem
          </p>

          {/* Search and Stats */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <form
              onSubmit={handleSearch}
              className="flex max-w-xl flex-1 gap-2"
            >
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-white/40" />
                <Input
                  placeholder="Search for grants"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                />
              </div>
              <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
                Search
              </Button>
            </form>

            <div className="text-sm">
              <span className="text-white/60">Total grants: </span>
              <span className="font-semibold text-white">{totalGrants}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Grant Grid */}
            {loading && page === 1 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="h-[466px] animate-pulse rounded-2xl bg-white/5"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {grants.map((grant: any) => (
                    <GrantCard
                      key={grant.id}
                      id={grant.id}
                      title={grant.title}
                      organization={grant.organization}
                      bannerUrl={grant.bannerUrl}
                      minAmount={
                        grant.minAmount ? Number.parseFloat(grant.minAmount) : 0
                      }
                      maxAmount={
                        grant.maxAmount ? Number.parseFloat(grant.maxAmount) : 0
                      }
                      token={grant.token}
                      rfpCount={grant.rfpCount}
                      applicationCount={grant.applicationCount}
                      status={grant.status}
                      summary={grant.summary}
                      skills={grant.skills}
                      createdAt={grant.createdAt}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loading}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {loading ? "Loading..." : "View More →"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading font-semibold text-lg">
                Filter By
              </h3>

              {/* Status */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-sm text-white/80">
                  Status
                </h4>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={statusFilter.published}
                      onCheckedChange={(checked) =>
                        setStatusFilter((prev) => ({
                          ...prev,
                          published: !!checked,
                        }))
                      }
                      className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                    />
                    <span className="text-sm text-white/70">Published</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={statusFilter.completed}
                      onCheckedChange={(checked) =>
                        setStatusFilter((prev) => ({
                          ...prev,
                          completed: !!checked,
                        }))
                      }
                      className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                    />
                    <span className="text-sm text-white/70">Completed</span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-sm text-white/80">
                  Sort By
                </h4>
                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="newest"
                        className="border-white/40 text-pink-500"
                      />
                      <span className="text-sm text-white/70">Newest</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="oldest"
                        className="border-white/40 text-pink-500"
                      />
                      <span className="text-sm text-white/70">Oldest</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-sm text-white/80">
                  Price
                </h4>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100000}
                    step={1000}
                    className="[&_[role=slider]]:bg-pink-500"
                  />
                  <div className="flex justify-between text-sm text-white/60">
                    <span>${priceRange[0].toLocaleString()}</span>
                    <span>${priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Submission */}
              <div>
                <h4 className="mb-3 font-medium text-sm text-white/80">
                  Submission
                </h4>
                <RadioGroup defaultValue="highest">
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="highest"
                        className="border-white/40 text-pink-500"
                      />
                      <span className="text-sm text-white/70">Highest</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="lowest"
                        className="border-white/40 text-pink-500"
                      />
                      <span className="text-sm text-white/70">Lowest</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Top RFPs */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading font-semibold text-lg">
                Top RFP's
              </h3>
              <div className="space-y-3">
                {topRFPs.map((rfp, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
                  >
                    <div
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${rfp.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="font-bold font-heading text-sm text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="line-clamp-1 font-medium text-sm text-white">
                        {rfp.title}
                      </h4>
                      <p className="text-white/50 text-xs">{rfp.grant}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{rfp.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
