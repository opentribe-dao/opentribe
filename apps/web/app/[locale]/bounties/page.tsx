"use client";

import { useState, useEffect, useRef } from "react";
import { BountyCard } from "../components/cards/bounty-card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group";
import { Label } from "@packages/base/components/ui/label";
import { Slider } from "@packages/base/components/ui/slider";
import { Search, Filter } from "lucide-react";
import { env } from "@/env";

const SKILL_TABS = ["All", "Writer", "Coder", "Creator", "Open", "Safe", "Front-End", "Backend"];

export default function BountiesPage() {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    fetchBounties();
  }, [page, searchQuery]);

  const fetchBounties = async () => {
    setLoading(true);
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      // Add search parameter if query exists
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`${apiUrl}/api/v1/bounties?${params.toString()}`);
      
      if (!response.ok) {
        console.error("Failed to fetch bounties");
        return;
      }

      const data = await response.json();
      
      if (page === 1) {
        console.log('Bounties data:', data.bounties);
        setBounties(data.bounties || []);
      } else {
        setBounties(prev => [...prev, ...(data.bounties || [])]);
      }
      
      setHasMore(data.bounties?.length === 10);
    } catch (error) {
      console.error("Error fetching bounties:", error);
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
        fetchBounties();
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

  const totalBounties = bounties.length;
  const activeBounties = bounties.filter((b: any) => b.status === "ACTIVE").length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">All bounties</h1>
          <p className="text-white/60 ">
            Find open bounties and earn rewards across all skills of Web3
          </p>
          
          {/* Search and Stats */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <Input
                  placeholder="Search for bounty"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
                Search
              </Button>
            </form>
            
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-white/60">Total open bounties: </span>
                <span className="font-semibold text-white">{totalBounties}</span>
              </div>
              <div>
                <span className="text-white/60">Active: </span>
                <span className="font-semibold text-white">{activeBounties}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {SKILL_TABS.map((tab) => (
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
            {/* Bounty List */}
            {loading && page === 1 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <div>
                  {bounties.map((bounty: any, index: number) => (
                    <div key={bounty.id} className={index > 0 ? "mt-6" : ""}>
                      <BountyCard
                        id={bounty.id}
                        title={bounty.title}
                        organization={bounty.organization}
                        amount={bounty.amount ? parseFloat(bounty.amount) : 0}
                        token={bounty.token}
                        deadline={bounty.deadline}
                        submissionCount={bounty.submissionCount}
                        skills={bounty.skills}
                        status={bounty.status}
                        variant="list"
                      />
                    </div>
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
                    max={10000}
                    step={100}
                    className="[&_[role=slider]]:bg-pink-500"
                  />
                  <div className="flex justify-between text-sm text-white/60">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
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

            {/* How it works */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4">How it works</h3>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Browse and select",
                    description: "Find a bounty that matches your skills"
                  },
                  {
                    step: "2",
                    title: "Participate / Develop / Submit",
                    description: "Work on the bounty and submit your solution"
                  },
                  {
                    step: "3",
                    title: "Get paid for your work",
                    description: "Receive rewards when your submission is accepted"
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">{item.title}</h4>
                      <p className="text-xs text-white/60">{item.description}</p>
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