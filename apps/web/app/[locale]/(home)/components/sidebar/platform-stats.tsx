"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/base/components/ui/card";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface PlatformStatsProps {
  stats?: {
		totalOpportunities: number;
		totalBuilders: number;
		totalRewards: string;
		activeBounties: number;
		activeGrants: number;
	};
  loading?: boolean;
}

export function PlatformStats({ stats, loading = false }: PlatformStatsProps) {
  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-5 w-12 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Platform Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/70">Active Bounties</span>
            </div>
            <span className="font-semibold font-heading text-white">
              {stats?.activeBounties?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Total Builders</span>
            </div>
            <span className="font-semibold font-heading text-white">
              {stats?.totalBuilders?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-white/70">Total Rewards</span>
            </div>
            <span className="font-semibold font-heading text-white">
              {stats?.totalRewards}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(PlatformStats);
