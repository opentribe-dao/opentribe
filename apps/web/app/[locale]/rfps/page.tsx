"use client";

import { useState, useEffect } from "react";
import { RFPCard } from "../components/cards/rfp-card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group";
import { Label } from "@packages/base/components/ui/label";
import { Search, ThumbsUp } from "lucide-react";
import { env } from "@/env";
import Image from "next/image";

const FILTER_TABS = ["All", "Good", "Strong", "Creator", "Open", "Safe", "Active New", "Backend"];

export default function RFPsPage() {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [sortBy, setSortBy] = useState("popular");
  const [grantFilter, setGrantFilter] = useState("all");
  const [submissionFilter, setSubmissionFilter] = useState("highest");

  useEffect(() => {
    fetchRFPs();
  }, [page]);

  const fetchRFPs = async () => {
    setLoading(true);
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
      const response = await fetch(`${apiUrl}/api/v1/rfps?page=${page}&limit=10`);
      
      if (!response.ok) {
        console.error("Failed to fetch RFPs");
        return;
      }

      const data = await response.json();
      
      if (page === 1) {
        setRfps(data.rfps || []);
      } else {
        setRfps(prev => [...prev, ...(data.rfps || [])]);
      }
      
      setHasMore(data.rfps?.length === 10);
    } catch (error) {
      console.error("Error fetching RFPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRFPs();
  };

  const totalRfps = rfps.length;

  // Mock popular grants data
  const popularGrants = [
    {
      name: "polkadot ecosystem",
      icon: "P",
      color: "from-pink-500 to-purple-600",
      author: "by Gavin Wood"
    },
    {
      name: "polkadot innovation",
      icon: "P",
      color: "from-blue-500 to-cyan-600",
      author: "by Web3 Foundation"
    },
    {
      name: "substrate builders",
      icon: "S",
      color: "from-green-500 to-emerald-600",
      author: "by Parity Technologies"
    },
    {
      name: "polkadot tooling",
      icon: "P",
      color: "from-orange-500 to-red-600",
      author: "by Acala Network"
    },
    {
      name: "kusama experiments",
      icon: "K",
      color: "from-purple-500 to-pink-600",
      author: "by Kusama Treasury"
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">RFP</h1>
          <p className="text-white/60 ">
            Find and submit ideas and bounties across hundreds of DAOs
          </p>
          
          {/* Search and Stats */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <Input
                  placeholder="Search for RFP"
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
              <span className="text-white/60">Total RFPs: </span>
              <span className="font-semibold text-white">{totalRfps}</span>
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
            {/* RFP List */}
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
                <div className="space-y-4">
                  {rfps.map((rfp: any) => (
                    <RFPCard
                      key={rfp.id}
                      id={rfp.id}
                      title={rfp.title}
                      grant={rfp.grant}
                      voteCount={rfp.voteCount}
                      commentCount={rfp.commentCount}
                      status={rfp.status}
                      description={rfp.description}
                      variant="list"
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
              
              {/* Popular */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-white/80">Popular</h4>
                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="popular" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Most Popular</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="recent" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Most Recent</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Grant */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-white/80">Grant</h4>
                <RadioGroup value={grantFilter} onValueChange={setGrantFilter}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="all" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">All Grants</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="official" className="border-white/40 text-pink-500" />
                      <span className="text-sm text-white/70">Official Only</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submission */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-white/80">Submission</h4>
                <RadioGroup value={submissionFilter} onValueChange={setSubmissionFilter}>
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

            {/* Popular Grants */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4">Popular Grants</h3>
              <div className="space-y-3">
                {popularGrants.map((grant, index) => (
                  <div key={index} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grant.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white font-heading">
                        {grant.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{grant.name}</h4>
                      <p className="text-xs text-white/50">{grant.author}</p>
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