"use client";

import { useState, useEffect } from "react";
import { GrantCard } from "../components/cards/grant-card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group";
import { Label } from "@packages/base/components/ui/label";
import { Slider } from "@packages/base/components/ui/slider";
import { Search, Filter, ThumbsUp } from "lucide-react";
import { env } from "@/env";
import Image from "next/image";

const FILTER_TABS = ["All", "Writer", "Coder", "Creator", "Open", "Safe", "Active New", "Backend"];

export default function GrantsPage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState({
    published: true,
    completed: false,
  });
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 100000]);

  useEffect(() => {
    fetchGrants();
  }, [page]);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
      const response = await fetch(`${apiUrl}/api/v1/grants?page=${page}&limit=9`);
      
      if (!response.ok) {
        console.error("Failed to fetch grants");
        return;
      }

      const data = await response.json();
      
      if (page === 1) {
        setGrants(data.grants || []);
      } else {
        setGrants(prev => [...prev, ...(data.grants || [])]);
      }
      
      setHasMore(data.grants?.length === 9);
    } catch (error) {
      console.error("Error fetching grants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGrants();
  };

  const totalGrants = grants.length;

  // Mock top RFPs data
  const topRFPs = [
    {
      title: "Polkadot Data Analytics Platform",
      grant: "polkadot ecosystem",
      votes: 134,
      color: "from-pink-500 to-purple-600"
    },
    {
      title: "Substrate Development Tools",
      grant: "substrate builders",
      votes: 98,
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Cross-chain Bridge Infrastructure",
      grant: "polkadot innovation",
      votes: 87,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "DeFi Protocol Integration",
      grant: "acala ecosystem",
      votes: 76,
      color: "from-orange-500 to-red-600"
    },
    {
      title: "NFT Marketplace Standard",
      grant: "kusama treasury",
      votes: 65,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Governance Tooling Suite",
      grant: "web3 foundation",
      votes: 54,
      color: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">Grants</h1>
          <p className="text-white/60 ">
            Grants help grow grant programs in the Polkadot ecosystem
          </p>
          
          {/* Search and Stats */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <Input
                  placeholder="Search for grants"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
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
          <div className="flex gap-2 min-w-max">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Grant Grid */}
            {loading && page === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="h-[466px] bg-white/5 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {grants.map((grant: any) => (
                    <GrantCard
                      key={grant.id}
                      id={grant.id}
                      title={grant.title}
                      organization={grant.organization}
                      bannerUrl={grant.bannerUrl}
                      minAmount={
                        grant.minAmount
                          ? parseFloat(grant.minAmount)
                          : undefined
                      }
                      maxAmount={
                        grant.maxAmount
                          ? parseFloat(grant.maxAmount)
                          : undefined
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
                      onClick={() => setPage(prev => prev + 1)}
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4">Filter By</h3>
              
              {/* Status */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-white/80">Status</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={statusFilter.published}
                      onCheckedChange={(checked) => 
                        setStatusFilter(prev => ({ ...prev, published: !!checked }))
                      }
                      className="border-white/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                    />
                    <span className="text-sm text-white/70">Published</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={statusFilter.completed}
                      onCheckedChange={(checked) => 
                        setStatusFilter(prev => ({ ...prev, completed: !!checked }))
                      }
                      className="border-white/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                    />
                    <span className="text-sm text-white/70">Completed</span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-white/80">Sort By</h4>
                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="newest" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Newest</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="oldest" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Oldest</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-white/80">Price</h4>
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
                <h4 className="text-sm font-medium mb-3 text-white/80">Submission</h4>
                <RadioGroup defaultValue="highest">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="highest" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Highest</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="lowest" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Lowest</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Top RFPs */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4">Top RFP's</h3>
              <div className="space-y-3">
                {topRFPs.map((rfp, index) => (
                  <div key={index} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rfp.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white font-heading">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white line-clamp-1">{rfp.title}</h4>
                      <p className="text-xs text-white/50">{rfp.grant}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <ThumbsUp className="w-3 h-3" />
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