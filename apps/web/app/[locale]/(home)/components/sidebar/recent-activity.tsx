"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/base/components/ui/card";

interface RecentActivityProps {
  activities?: Array<{
    id: string;
    type: 'submission' | 'application';
    user: {
      firstName?: string | null;
      lastName?: string | null;
      username: string;
      avatarUrl?: string | null;
    };
    target: {
      id: string;
      title: string;
      type: 'bounty' | 'grant';
      organizationName: string;
    };
    createdAt: string;
  }>;
  loading?: boolean;
}

export function RecentActivity({
  activities,
  loading = false,
}: RecentActivityProps) {
  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayActivities = activities || [];

  const getUserInitials = (userName: string) => {
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Activity</CardTitle>
          {/* <span className="text-xs text-white/60 cursor-pointer hover:text-white transition-colors">
            View All
          </span> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white font-heading">
                  {getUserInitials(activity.user.username)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">{activity.user.username}</span>{" "}
                  {activity.type === 'submission' ? 'submitted to' : 'applied to'} {activity.target.title}
                </p>
                <p className="text-xs text-white/50">{activity.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(RecentActivity);
