"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Card, CardContent } from "@packages/base/components/ui/card";
import { relativeTime } from "@packages/base/lib/utils";
import { ZapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { OverviewSkeleton } from "@/components/loading-states";
import { StatsCard } from "@/components/overview/stats-card";
import { UrgentActionsCard } from "@/components/overview/urgent-actions-card";
import { useDashboard } from "@/hooks/use-dashboard";
import { Header } from "./components/header";

const App = () => {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboard(activeOrg?.id);

  if (isLoading) {
    return OverviewSkeleton();
  }

  if (isError) {
    return (
      <div>
        <p>Error loading dashboard: {error?.message}</p>
        <button onClick={() => refetch()} type="button">
          Retry
        </button>
      </div>
    );
  }

  const stats = {
    activeBounties: dashboard?.stats?.activeBounties ?? 0,
    submissionsToReview: dashboard?.stats?.pendingSubmissions ?? 0,
    totalAwarded: dashboard?.stats?.totalAwarded ?? 0,
  };

  const urgentActions = dashboard?.urgentActions || [];
  const recentActivities = dashboard?.recentActivity || [];

  return (
    <>
      <Header page="Overview" pages={[]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Active Bounties"
            value={stats.activeBounties ?? 0}
          />
          <StatsCard
            title="Submission to review"
            value={stats?.submissionsToReview ?? 0}
          />
          <StatsCard
            prefix="$"
            title="Total awarded"
            value={stats?.totalAwarded ?? 0}
          />
        </div>

        {/* What's Next Section */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg text-white">What's Next?</h2>

          {/* Submissions Review Card */}

          {/* Urgent actions Card */}
          {urgentActions != null &&
            urgentActions.length > 0 &&
            urgentActions.map((urgentAction, idx) =>
              urgentAction.type === "WINNER_ANNOUNCEMENT" ? (
                <Card
                  className="border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-purple-600/10"
                  key={urgentAction.id || idx}
                >
                  <CardContent className="flex items-center justify-between px-y-6">
                    <div className="flex items-center gap-10">
                      <div className="flex h-30 w-30 items-center justify-center rounded-lg bg-white/10">
                        <ZapIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="gap-8">
                        <p className="text-sm text-white/60">
                          {urgentAction.title}
                        </p>
                        <h3 className="font-medium text-white">
                          {urgentAction.description}
                        </h3>
                        <Button
                          className="my-2 border-0 bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                          onClick={() => {
                            router.push(urgentAction.actionUrl);
                          }}
                          variant="secondary"
                        >
                          Announce
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <UrgentActionsCard
                  key={urgentAction.id || idx}
                  {...urgentAction}
                />
              )
            )}
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg text-white">Recent Activity</h2>

          {recentActivities != null &&
            recentActivities.length > 0 &&
            recentActivities.map((activity, i) => (
              <Card className="border-white/10 bg-zinc-900/50 p-4" key={i}>
                <CardContent className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6007A]/20">
                      <span className="font-medium text-[#E6007A] text-xs">
                        {activity.actorName.charAt(0).toUpperCase()}{" "}
                        {/* use corrent user name refernce from submissions */}
                      </span>
                    </div>
                    <span className="text-sm text-white">
                      {activity.actorName} {activity.action}
                    </span>
                  </div>
                  {
                    <Badge
                      className="border-0 bg-green-500 px-2 py-1 text-black"
                      variant="secondary"
                    >
                      {relativeTime(activity.timestamp)}
                    </Badge>
                  }
                </CardContent>
              </Card>
            ))}

          {recentActivities != null && recentActivities.length === 0 && (
            <Card className="border-white/10 bg-zinc-900/50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-white/40">No reviews pending</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
