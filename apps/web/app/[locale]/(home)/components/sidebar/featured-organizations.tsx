"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/base/components/ui/card";
import Image from "next/image";

interface FeaturedOrganizationsProps {
  featuredOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    totalOpportunities: number;
    totalValue: number;
  }>;
  loading?: boolean;
}

export function FeaturedOrganizations({
  featuredOrganizations,
  loading = false,
}: FeaturedOrganizationsProps) {
  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Featured Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayOrganizations = featuredOrganizations || [];

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Featured Organizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayOrganizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center`}
              >
                {org.logo ? (
                  <Image
                    src={org.logo}
                    alt={org.name}
                    width={48}
                    height={48}
                    onError={(e) => {
                      console.log(
                        "image failed to load:",
                        org.logo,
                      );
                      e.currentTarget.style.display = "none";
                    }}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {org.name[0]}
                    </span>
                    </div>
                )}
              </div>
              <span className="text-sm text-white font-medium">{org.slug}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(FeaturedOrganizations);
