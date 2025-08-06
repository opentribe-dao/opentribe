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
import { Building2, Plus, Settings, Users, ZapIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from './components/header';

const App = () => {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();

  if (!session?.user) {
    return null;
  }

  // Mock data - in real app, fetch from API
  const stats = {
    activeBounties: 0,
    submissionsToReview: 0,
    totalAwarded: 0,
  };

  const recentBounties = [];

  return (
    <>
      <Header pages={[]} page="Overview" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs text-white/40">Active Bounties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">
                {stats.activeBounties.toString().padStart(2, '0')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs text-white/40">Submission to review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">
                {stats.submissionsToReview}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs text-white/40">Total awarded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">
                ${stats.totalAwarded.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What's Next Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">What's Next?</h2>
          
          {/* Submissions Review Card */}
          <Card className="bg-gradient-to-r from-purple-600/20 to-purple-600/10 border-purple-500/20">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <ZapIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white">You have submissions awaiting review for Bounty</h3>
                  <p className="text-sm text-white/60">Review submissions to select winners</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white border-0"
                disabled={stats.submissionsToReview === 0}
              >
                Review Now
              </Button>
            </CardContent>
          </Card>

          {/* Deadline Alert */}
          {recentBounties.length > 0 && (
            <Card className="bg-zinc-900/50 border-white/10">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                    <ClockIcon className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-white">The Pied Piper bounty deadline is in 4 days</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  Review Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Reviews</h2>
          
          {session?.user?.name && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-zinc-900/50 border-white/10">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6007A]/20">
                        <span className="text-xs font-medium text-[#E6007A]">
                          {session.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-white">User Name submitted to bounty</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
                      NEW
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          
          {stats.submissionsToReview === 0 && (
            <Card className="bg-zinc-900/50 border-white/10">
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
