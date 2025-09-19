'use client';

import Link from 'next/link';
import { Award, Loader2 } from 'lucide-react';
import { Button } from '@packages/base/components/ui/button';
import router from 'next/router';
import { Header } from '../../components/header';

import { BountyProvider, useBountyContext } from '../../components/bounty-provider';
import { usePathname } from 'next/navigation';
import { use } from 'react';
import { PaymentModal } from './payment-modal';
import { env } from '@/env';
import { Badge } from '@packages/base/components/ui/badge';

export default function BountyLayout({
  children,
  params,
}: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();

  if (pathname.endsWith('/edit') || pathname.includes('/submissions/')) {
    return <BountyProvider bountyId={id}>{children}</BountyProvider>;
  }
  return (
    <BountyProvider bountyId={id}>
      <BountyLayoutBody>{children}</BountyLayoutBody>
    </BountyProvider>
  );
}

function BountyLayoutBody({ children }: { children: React.ReactNode }) {
  const {
    bounty,
    bountyLoading,
    bountyError,
    paymentModalOpen,
    selectedPaymentSubmission,
    setPaymentModalOpen,
    setSelectedPaymentSubmission,
  } = useBountyContext();

  const pathname = usePathname();

  if (bountyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (bountyError || !bounty) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 font-semibold text-2xl text-white">
          Bounty not found
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push('/bounties')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back to Bounties
        </Button>
      </div>
    );
  }

  // Tab links
  const tabs = [
    { name: 'Overview', href: `/bounties/${bounty.id}/` },
    { name: 'Submissions', href: `/bounties/${bounty.id}/submissions` },
    { name: 'Settings', href: `/bounties/${bounty.id}/settings` },
  ];

  return (
    <>
      <Header pages={['Overview', 'Bounties']} page={bounty.title} />
      <div className="flex min-h-screen flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 font-semibold text-3xl text-white">
              {bounty.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>by {bounty.organization.name}</span>
              <span>•</span>
              <span>
                {new Date(
                  bounty.publishedAt || bounty.createdAt
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={
                bounty.status === 'OPEN'
                  ? 'border-0 bg-green-500/20 text-green-400'
                  : 'border-0 bg-gray-500/20 text-gray-400'
              }
            >
            {bounty.status}
            </Badge>
            {/* {bounty.status === 'OPEN' &&
              submissions.length > 0 &&
              !bounty.winnersAnnouncedAt && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={announceWinners}
                  disabled={isAnnouncing || selectedWinners.size === 0}
                >
                  {isAnnouncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Announcing...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Announce Winners ({selectedWinners.size})
                    </>
                  )}
                </Button>
              )} */}
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <Link href={`/bounties/${bounty.id}/edit`}>Edit Bounty</Link>
            </Button>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`rounded-t bg-white/5 px-4 py-2 text-white/80 transition hover:bg-white/10 data-[active=true]:bg-zinc-950 data-[active=true]:text-white `}
              data-active={
                typeof window !== 'undefined' &&
                (pathname === tab.href ||
                  (tab.name === 'Overview' &&
                    pathname === `/bounties/${bounty.id}/`))
              }
              prefetch={false}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        {/* Tab Content */}
        <div className="flex-1 p-6">{children}</div>

         {/* Payment Modal */}
      {selectedPaymentSubmission && bounty && (
        <PaymentModal/>
      )}
      </div>
    </>
  );
}
