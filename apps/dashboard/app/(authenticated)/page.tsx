'use client';

import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Badge } from '@packages/base/components/ui/badge';
import {
  Building2,
  Plus,
  Settings,
  Users,
  ZapIcon,
  ChevronRightIcon,
  ClockIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from './components/header';
import { useDashboard } from '@/hooks/use-dashboard';
import { Skeleton } from '@packages/base/components/ui/skeleton';
import { ur } from 'zod/v4/locales';
import { useRouter } from 'next/navigation';

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
    return (
      <>
        <Header pages={[]} page="Overview" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Stats Cards Skeleton */}
          <div className="grid gap-12 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-white/10 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20 bg-white/30" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* What's Next Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 bg-white/20" />
            <Card className="border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-purple-600/10">
              <CardContent className="flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
                  <div>
                    <Skeleton className="mb-2 h-4 w-48 bg-white/20" />
                    <Skeleton className="h-3 w-32 bg-white/10" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded bg-[#E6007A]/30" />
              </CardContent>
            </Card>
          </div>

          {/* Reviews Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 bg-white/20" />
            {[1, 2].map((i) => (
              <Card key={i} className="border-white/10 bg-zinc-900/50">
                <CardContent className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-[#E6007A]/20" />
                    <Skeleton className="h-4 w-40 bg-white/20" />
                  </div>
                  <Skeleton className="h-6 w-12 bg-green-500/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
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
            <Card className="border-white/10 bg-zinc-900/50">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/40 text-xs">
                  Active Bounties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-3xl text-white">
                  {stats.activeBounties ?? 0}
                </div>
              </CardContent>
            </Card>

          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/40 text-xs">
                Submission to review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl text-white">
                {stats?.submissionsToReview ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/40 text-xs">
                Total awarded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl text-white">
                ${stats?.totalAwarded ?? 0}
              </div>
            </CardContent>
          </Card>
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
                <Card
                  key={urgentAction.id || idx}
                  className="border-white/10 bg-zinc-900/50"
                >
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                        <ClockIcon className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-white/60">
                          {urgentAction.title}
                        </p>
                        <h3 className="font-medium text-white">
                          {urgentAction.description}
                        </h3>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        router.push(urgentAction.actionUrl);
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      Review Now
                    </Button>
                  </CardContent>
                </Card>
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
                      className='border-0 bg-green-500 px-2 py-1 text-black'
                    >
                      {(() => {
                        const now = new Date();
                        const activityDate = new Date(activity.timestamp);
                        const diffMs = now.getTime() - activityDate.getTime();
                        const diffSec = Math.floor(diffMs / 1000);
                        const diffMin = Math.floor(diffSec / 60);
                        const diffHour = Math.floor(diffMin / 60);
                        const diffDay = Math.floor(diffHour / 24);
                        const diffWeak = Math.floor(diffDay / 7);

                        const timeFormats = [
                          {
                            check: diffWeak < 1,
                            value: `a week${diffWeak > 1 ? 's' : ''} ago`,
                          },
                          {
                            check: diffDay >= 1,
                            value: activityDate.toLocaleDateString(),
                          },
                          {
                            check: diffHour >= 1,
                            value: `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`,
                          },
                          {
                            check: diffMin >= 1,
                            value: `${diffMin} min${diffMin > 1 ? 's' : ''} ago`,
                          },
                        ];

                        const found = timeFormats.find((f) => f.check);
                        return found ? found.value : 'just now';
                      })()}
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
