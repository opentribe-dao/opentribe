"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import Image from "next/image";
import React from "react";

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
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Featured Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div className="flex items-center gap-3" key={i}>
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (featuredOrganizations.length === 0) {
    return null;
  }

  const displayOrganizations = featuredOrganizations || [];

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Featured Organizations</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-0">
        <div className="space-y-4">
          {displayOrganizations.map((org) => (
            <div
              className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/5"
              key={org.id}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br">
                {org.logo ? (
                  <Image
                    alt={org.name}
                    className="rounded-full bg-black"
                    height={48}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    src={org.logo}
                    width={48}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
                    <span className="font-bold text-lg text-white">
                      {org.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-white">
                  {org.name}
                </span>
                <span className="font-medium text-sm text-white">
                  {org.slug}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(FeaturedOrganizations);
