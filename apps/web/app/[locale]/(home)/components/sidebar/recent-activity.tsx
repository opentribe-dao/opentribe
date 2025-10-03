"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import Image from "next/image";
import { relativeTime } from "@packages/base/lib/utils";

interface RecentActivityProps {
  activities?: Array<{
    id: string;
    type: "submission" | "application";
    user: {
      firstName?: string | null;
      lastName?: string | null;
      username: string;
      image?: string | null;
    };
    target: {
      id: string;
      title: string;
      type: "bounty" | "grant";
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
      <Card className='border-white/10 bg-white/5 backdrop-blur-sm'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
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
    <Card className='border-white/10 bg-white/5 backdrop-blur-sm'>
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
              {activity.user.image ? (
                <Image
                  height={32}
                  width={32}
                  src={activity.user.image}
                  alt={activity.user.username}
                  className='rounded-full bg-black object-cover'
                />
              ) :  (
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600'>
                  <span className='font-bold font-heading text-white text-xs'>
                    {getUserInitials(activity.user.username)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">
                    {activity.user.username}
                  </span>{" "}
                  {activity.type === "submission"
                    ? "submitted to"
                    : "applied to"}{" "}
                  {activity.target.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(RecentActivity);
