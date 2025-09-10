'use client';

import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
} from '@packages/base/components/ui/card';
import { Badge } from '@packages/base/components/ui/badge';
import {
  ZapIcon,
} from 'lucide-react';
import { Header } from './components/header';
import { useDashboard } from '@/hooks/use-dashboard';
import { useRouter } from 'next/navigation';
import { OverviewSkeleton } from '@/components/loading-states';
import { relativeTime } from '@packages/base/lib/utils';
import { StatsCard } from '@/components/overview/stats-card';
import { UrgentActionsCard } from '@/components/overview/urgent-actions-card';

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
        <button type="button" onClick={() => refetch()}>
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
      <Header pages={[]} page="Overview" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-12 md:grid-cols-3">
          <StatsCard
            title="Active Bounties"
            value={stats.activeBounties ?? 0}
          />
          <StatsCard
            title="Submission to review"
            value={stats?.submissionsToReview ?? 0}
          />
          <StatsCard
            title="Total awarded"
            value={stats?.totalAwarded ?? 0}
            prefix="$"
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
              urgentAction.type === 'WINNER_ANNOUNCEMENT' ? (
                <Card
                  key={urgentAction.id || idx}
                  className="border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-purple-600/10"
                >
                  <CardContent className="flex items-center justify-between px-y-6 ">
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
                          variant="secondary"
                          className="my-2 border-0 bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                          onClick={() => {
                            router.push(urgentAction.actionUrl);
                          }}
                        >
                          Announce
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
               <UrgentActionsCard key={urgentAction.id || idx} {...urgentAction} />
              )
            )}
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <h2 className="font-medium text-lg text-white">Reviews</h2>

          {recentActivities != null &&
            recentActivities.length > 0 &&
            recentActivities.map((activity, i) => (
              <Card key={i} className="border-white/10 bg-zinc-900/50 p-4">
                <CardContent className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6007A]/20">
                      <span className="font-medium text-[#E6007A] text-xs">
                        {activity.actorName.charAt(0).toUpperCase()}{' '}
                        {/* use corrent user name refernce from submissions */}
                      </span>
                    </div>
                    <span className="text-sm text-white">
                      {activity.actorName} {activity.action}
                    </span>
                  </div>
                  {
                    <Badge
                      variant="secondary"
                      className="border-0 bg-green-500 px-2 py-1 text-black"
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
