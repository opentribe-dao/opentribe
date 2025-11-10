"use client";

import { Separator } from "@packages/base/components/ui/separator";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { formatCurrency } from "@packages/base/lib/utils";
import { Award, DollarSign } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { env } from "@/env";

interface GrantsStatsResponse {
  total_grants_count: number;
  total_funds: number;
}

export function GrantsStats() {
  const [data, setData] = useState<GrantsStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrantsStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/stats`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch grants stats: ${response.status}`);
      }

      const statsData: GrantsStatsResponse = await response.json();
      setData(statsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch grants stats";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrantsStats();
  }, [fetchGrantsStats]);

  if (error) {
    return (
      <div className="row-start-1 items-center gap-4 sm:flex md:flex lg:row-start-auto">
        <div className="stats-card flex items-center justify-center text-sm lg:w-full">
          <span className="text-red-400">Error loading stats: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row-start-1 items-center gap-4 sm:flex md:flex lg:row-start-auto">
      <div className="stats-card flex justify-around gap-4 text-sm lg:w-full">
        <div className="flex items-center gap-2">
          <Award
            className="rounded-full bg-white/10 p-2"
            style={{ width: "32px", height: "32px" }}
          />
          <div className="flex flex-col items-center text-center align-middle">
            <span className="mb-1 font-bold text-white">
              {isLoading ? (
                <Skeleton className="mx-4 mb-1 h-4 w-8 bg-white/10" />
              ) : (
                data?.total_grants_count || 0
              )}
            </span>
            <span className="text-white/60">Total Grants</span>
          </div>
        </div>

        <Separator
          className="h-10 bg-white/10 md:h-16"
          orientation="vertical"
        />

        <div className="flex items-center gap-2">
          <DollarSign
            className="rounded-full bg-white/10 p-2"
            style={{ width: "32px", height: "32px" }}
          />
          <div className="flex flex-col items-center text-center align-middle">
            {isLoading ? (
              <Skeleton className="mx-4 mb-1 h-4 w-8 bg-white/10" />
            ) : (
              <span className="mb-1 font-bold text-white">
                {formatCurrency(data?.total_funds || 0)}
              </span>
            )}
            <span className="text-white/60">Total Funds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
