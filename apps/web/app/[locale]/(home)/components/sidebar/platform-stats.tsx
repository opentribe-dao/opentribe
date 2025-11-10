"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import React from "react";

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
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div className="flex items-center justify-between" key={i}>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Platform Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white/70">Total Opportunities</span>
            </div>
            <span className="font-heading font-semibold text-white">
              {stats?.totalOpportunities?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/70">Total Builders</span>
            </div>
            <span className="font-heading font-semibold text-white">
              {stats?.totalBuilders?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-pink-400" />
              <span className="text-sm text-white/70">Total Rewards</span>
            </div>
            <span className="font-heading font-semibold text-white">
              {stats?.totalRewards}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(PlatformStats);
