'use client';

import type React from 'react';
import { use } from 'react';
import {
  GrantProvider,
  useGrantContext,
} from '../../components/grants/grant-provider';
import { Calendar, Edit, FileText, Loader2, Shield, Users } from 'lucide-react';
import { Button } from '@packages/base/components/ui/button';
import { Badge } from '@packages/base/components/ui/badge';
import Link from 'next/link';
import { useActiveOrganization } from '@packages/auth/client';
import { usePathname } from 'next/navigation';
import router from 'next/router';
import { Header } from '../../components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@packages/base/components/ui/tabs';

export default function GrantDetailLayout({
  children,
  params,
}: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();

  if(pathname.endsWith('/edit') ){
    return (
      <GrantProvider grantId={id}>
        {children}
      </GrantProvider>
    );
  }

  return (
    <GrantProvider grantId={id}>
      <GrantDetailLayoutBody>{children}</GrantDetailLayoutBody>
    </GrantProvider>
  );
}

function GrantDetailLayoutBody({ children }: { children: React.ReactNode }) {
  const { grant, isLoading, isError, refetch } = useGrantContext();

  const { data: activeOrg } = useActiveOrganization();

  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (isError || !grant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 font-semibold text-2xl text-white">
          Grant not found
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push('/grant')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back to Grants
        </Button>
      </div>
    );
  }

  const tabs = [
    { name: 'Overview', href: `/grants/${grant.id}/` },
    { name: 'Applications', href: `/grants/${grant.id}/applications` },
    { name: 'Settings', href: `/grants/${grant.id}/settings` },
  ];

  const isOrganizationAdmin = grant.organization.id === activeOrg?.id;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'bg-green-500/20 text-green-400 border-0';
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-400 border-0';
      case 'CLOSED':
        return 'bg-red-500/20 text-red-400 border-0';
      default:
        return 'bg-gray-500/20 text-gray-400 border-0';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toUpperCase()) {
      case 'EXTERNAL':
        return 'bg-blue-500/20 text-blue-400 border-0';
      //   case 'NATIVE':
      default:
        return 'bg-purple-500/20 text-purple-400 border-0';
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
          <Header pages={['Overview', 'Grants']} page={grant.title} />
    <div className='flex min-h-screen flex-col gap-6 p-6'>
      {/* Grant Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-3xl text-white">{grant.title}</h1>
            <Badge className={getStatusColor(grant.status)}>
              {grant.status}
            </Badge>
            <Badge className={getSourceColor(grant.source)}>
              {grant.source}
            </Badge>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(grant.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{grant._count.applications} applications</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{grant._count.rfps} RFPs</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{grant._count.curators} curators</span>
            </div>
          </div>
        </div>
        {isOrganizationAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <Link href={`/grants/${grant.id}/edit`}>
                <Edit className="mr-2 size-4" />
                Edit Grant
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Tab Navigation & Content */}
      <Tabs
        value={
          tabs.find(tab =>
            pathname === tab.href ||
            (tab.name === 'Overview' && (pathname === `/grants/${grant.id}` || pathname === `/grants/${grant.id}/`))
          )?.name || tabs[0].name
        }
        className='mt-6 flex flex-1 flex-col'
      >
        <TabsList className='mb-2 border border-white/10 bg-white/5'>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.name}
              value={tab.name}
              asChild
            >
              <Link
                href={tab.href}
                prefetch={false}
                className=" px-4 py-2 text-white/80 transition hover:bg-white/10 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"
              >
                {tab.name}
                {tab.name === 'Applications' && (
                  <> ({grant._count.applications})</>
                )}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tabs.find(tab =>
            pathname === tab.href ||
            (tab.name === 'Overview' && (pathname === `/grants/${grant.id}` || pathname === `/grants/${grant.id}/`))
          )?.name || tabs[0].name} className="flex-1 ">
          {children}
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
