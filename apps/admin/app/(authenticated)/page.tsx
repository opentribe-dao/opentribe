"use client";

import { Badge } from "@packages/base/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import {
  Building2Icon,
  ClipboardCheckIcon,
  CoinsIcon,
  DownloadIcon,
  FileTextIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "./components/header";
import { useAdminStats } from "@/hooks/use-admin-stats";

function StatsCard({
  title,
  value,
  icon: Icon,
  href,
  badge,
}: {
  title: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <Card className="border-white/10 bg-white/5 backdrop-blur-[10px] transition-colors hover:bg-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm text-white/60">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-white/40" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {value !== undefined ? (
              <div className="font-bold text-2xl text-white">{value}</div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
            {badge && (
              <Badge
                className="border-0 bg-[#E6007A]/20 text-[#E6007A]"
                variant="secondary"
              >
                {badge}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();
  const stats = data?.data;

  return (
    <>
      <Header pages={[]} page="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="font-semibold text-2xl text-white">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Monitor and manage the Opentribe platform
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            href="/users"
            icon={UsersIcon}
            title="Total Users"
            value={stats?.totalUsers}
          />
          <StatsCard
            href="/organizations"
            icon={Building2Icon}
            title="Organizations"
            value={stats?.totalOrganizations}
          />
          <StatsCard
            href="/grants"
            icon={FileTextIcon}
            title="Grants"
            value={stats?.totalGrants}
          />
          <StatsCard
            href="/bounties"
            icon={CoinsIcon}
            title="Bounties"
            value={stats?.totalBounties}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            badge={
              stats?.pendingClaims && stats.pendingClaims > 0
                ? `${stats.pendingClaims} pending`
                : undefined
            }
            href="/profiles"
            icon={ShieldIcon}
            title="Ecosystem Profiles"
            value={stats?.totalEcosystemProfiles}
          />
          <StatsCard
            badge={
              stats?.pendingClaims && stats.pendingClaims > 0
                ? "Action needed"
                : undefined
            }
            href="/claims"
            icon={ClipboardCheckIcon}
            title="Pending Claims"
            value={stats?.pendingClaims}
          />
          <StatsCard
            href="/imports"
            icon={DownloadIcon}
            title="Import Jobs"
            value={stats?.totalImportJobs}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-white/40">Loading platform stats...</p>
          </div>
        )}
      </div>
    </>
  );
}
