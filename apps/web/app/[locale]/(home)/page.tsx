"use client";

import { useState, useEffect } from "react";
import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { Badge } from "@packages/base/components/ui/badge";
import { Input } from "@packages/base/components/ui/input";
import { Search, Filter, TrendingUp, Users, DollarSign } from "lucide-react";
import { BountyCard } from "../components/cards/bounty-card";
import { GrantCard } from "../components/cards/grant-card";
import { RFPCard } from "../components/cards/rfp-card";
import { env } from "@/env";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "all" | "bounties" | "grants" | "rfps"
  >("all");
  const [bounties, setBounties] = useState([]);
  const [grants, setGrants] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
        const [bountiesRes, grantsRes, rfpsRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/bounties?limit=6`),
          fetch(`${apiUrl}/api/v1/grants?limit=6`),
          fetch(`${apiUrl}/api/v1/rfps?limit=4`),
        ]);

        if (!bountiesRes.ok || !grantsRes.ok || !rfpsRes.ok) {
          console.error("Failed to fetch data");
          return;
        }

        const [bountiesData, grantsData, rfpsData] = await Promise.all([
          bountiesRes.json(),
          grantsRes.json(),
          rfpsRes.json(),
        ]);

        setBounties(bountiesData.bounties || []);
        setGrants(grantsData.grants || []);
        setRfps(rfpsData.rfps || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "";

  return (
    <>
      {/* Welcome Section */}
      <section className="container mx-auto px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            {session?.user ? (
              <>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome Back{userName ? `, ${userName}` : ""}!
                </h1>
                <p className="text-white/60">
                  We are so glad to have you back on OPEN TRIBE
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-2">
                  Find your next high paying gig
                </h1>
                <p className="text-white/60">
                  Connect with top organizations in the Polkadot ecosystem
                </p>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all ">
              <Search className="w-4 h-4" />
              Advanced Search
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all ">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        {/* <div className="flex items-center gap-4 mb-8">
          {[
            { key: "all", label: "All" },
            { key: "bounties", label: "Bounties" },
            { key: "grants", label: "Grants" },
            { key: "rfps", label: "Rfps" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div> */}
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Bounties Section */}
            {(activeTab === "all" || activeTab === "bounties") && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-heading text-white">
                    Bounties
                  </h2>
                  <Link href="/en/bounties" className="text-pink-400 hover:text-pink-300 transition-colors ">
                    View All →
                  </Link>
                </div>
                {loading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-48 bg-white/5 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {bounties.map((bounty: any) => (
                      <BountyCard
                        key={bounty.id}
                        id={bounty.id}
                        title={bounty.title}
                        organization={bounty.organization}
                        amount={bounty.amount ? parseFloat(bounty.amount) : 0}
                        token={bounty.token}
                        deadline={bounty.deadline}
                        submissionCount={bounty.submissionCount}
                        skills={bounty.skills}
                        status={bounty.status}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grants Section */}
            {(activeTab === "all" || activeTab === "grants") && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-heading text-white">
                    Grants
                  </h2>
                  <Link href="/en/grants" className="text-pink-400 hover:text-pink-300 transition-colors">
                    View All →
                  </Link>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-[466px] bg-white/5 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* RFPs Section */}
            {(activeTab === "all" || activeTab === "rfps") && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-heading text-white">
                    RFP
                  </h2>
                  <Link href="/en/rfps" className="text-pink-400 hover:text-pink-300 transition-colors">
                    View All →
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-32 bg-white/5 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
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
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Platform Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 font-heading text-white">
                Platform Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white/70 ">
                      Active Bounties
                    </span>
                  </div>
                  <span className="font-semibold font-heading text-white">
                    142
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white/70 ">
                      Total Builders
                    </span>
                  </div>
                  <span className="font-semibold font-heading text-white">
                    3,241
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-pink-400" />
                    <span className="text-sm text-white/70 ">
                      Total Rewards
                    </span>
                  </div>
                  <span className="font-semibold font-heading text-white">
                    $1.2M
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Skills */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 font-heading text-white">
                Popular Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Rust",
                  "Substrate",
                  "React",
                  "TypeScript",
                  "Solidity",
                  "Web3",
                  "UI/UX",
                  "Marketing",
                ].map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white/70 "
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Featured Organizations */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 font-heading text-white">
                Featured Organizations
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "Web3 Foundation",
                    initial: "W",
                    color: "from-pink-500 to-purple-600",
                  },
                  {
                    name: "Moonbeam",
                    initial: "M",
                    color: "from-blue-500 to-cyan-600",
                  },
                  {
                    name: "Acala Network",
                    initial: "A",
                    color: "from-green-500 to-emerald-600",
                  },
                ].map((org) => (
                  <div key={org.name} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${org.color} flex items-center justify-center`}
                    >
                      <span className="text-sm font-bold text-white font-heading">
                        {org.initial}
                      </span>
                    </div>
                    <span className="text-sm text-white ">
                      {org.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity - New section to match design */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-heading text-white">
                  Recent Activity
                </h3>
                <button className="text-pink-400 hover:text-pink-300 transition-colors text-sm ">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {[
                  {
                    user: "Mo Shaikh",
                    action: "just created a grant for depin solutions",
                    time: "1 hour ago",
                  },
                  {
                    user: "Mo Shaikh",
                    action: "submitted to bounty for ui solutions",
                    time: "2 hours ago",
                  },
                  {
                    user: "Mo Shaikh",
                    action: "created a new community for depin ecosystem",
                    time: "3 hours ago",
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white font-heading">
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white ">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-white/50 ">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
