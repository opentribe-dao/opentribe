'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { useSession } from '@packages/auth/client';

import { DollarSign, ExternalLink } from 'lucide-react';
import { useGrantContext } from '../../components/grants/grant-provider';
import type React from 'react';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingPage } from '@/components/loading-states';

type FundingInfoProps = {
  minAmount?: number | null;
  maxAmount?: number | null;
  totalFunds?: number | null;
  token?: string | null;
};

type OrganizationInfo = {
  name: string;
  logo?: string | null;
  location?: string | null;
};

type MarkdownSectionProps = {
  content?: string | null;
};

type ResourcesSectionProps = {
  resources?: Array<{
    title: string;
    url: string;
    description?: string | null;
  }> | null;
};

type SkillsSectionProps = {
  skills: string[];
};

const GlassCard: React.FC<React.PropsWithChildren<{ title?: string }>> = ({
  title,
  children,
}) => (
  <Card className="border border-white/20 bg-white/10 backdrop-blur-[10px]">
    {title ? (
      <CardHeader>
        <CardTitle className="font-heading">{title}</CardTitle>
      </CardHeader>
    ) : null}
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

const ErrorState: React.FC<{ onRetry: () => void; message?: string }> = ({
  onRetry,
  message,
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center">
    <p className="font-sans text-red-400">
      {message ?? 'Failed to load grant.'}
    </p>
    <Button className="mt-4" onClick={onRetry}>
      Retry
    </Button>
  </div>
);

const UnauthorizedState = () => (
  <div className="flex min-h-screen flex-col items-center justify-center">
    <p className="font-sans text-white/80">
      Unauthorized. Please sign in to view this grant.
    </p>
  </div>
);

const OrganizationSection = memo(function OrganizationSection({
  organization,
}: {
  organization: OrganizationInfo;
}) {
  return (
    <GlassCard title="Organization">
      <div>
        <div className="flex items-center gap-3">
          {organization.logo ? (
            // Using <img> to avoid domain config issues in dashboard
            <img
              src={organization.logo}
              alt={organization.name}
              className="h-10 w-10 rounded-full"
            />
          ) : null}
          <div>
            <p className="font-medium font-sans text-white">
              {organization.name}
            </p>
            {organization.location ? (
              <p className="font-sans text-sm text-white/60">
                {organization.location}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

const formatAmount = (amount?: number | null) => {
  if (!amount) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const FundingSection = memo(function FundingSection({
  minAmount,
  maxAmount,
  totalFunds,
  token,
}: FundingInfoProps) {
  if (!minAmount && !maxAmount && !totalFunds) {
    return null;
  }
  return (
    <div>
      {/* <p className="text-sm text-white/60 mb-2 font-sans">Funding</p> */}
      <div className="space-y-2">
        {minAmount && maxAmount ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white/40" />
            <span className="font-sans text-white">
              {formatAmount(minAmount)} - {formatAmount(maxAmount)}{' '}
              {token ?? ''}
            </span>
          </div>
        ) : null}
        {totalFunds ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white/40" />
            <span className="font-sans text-white">
              Total Funds: {formatAmount(totalFunds)} {token ?? ''}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

const ExternalApplicationSection = memo(function ExternalApplicationSection({
  applicationUrl,
}: {
  applicationUrl?: string | null;
}) {
  if (!applicationUrl) {
    return null;
  }
  return (
    <div>
      <p className="mb-2 font-sans text-sm text-white/60">
        External Application
      </p>
      <Button className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90" asChild>
        <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Apply Externally
        </a>
      </Button>
    </div>
  );
});

const MarkdownSection = memo(function MarkdownSection({
  content,
}: MarkdownSectionProps) {
  if (!content) {
    return null;
  }
  return (
    <div>
      <div className="prose prose-invert prose-pink max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
});

const SkillsSection = memo(function SkillsSection({
  skills,
}: SkillsSectionProps) {
  if (!skills?.length) {
    return null;
  }
  return (
    <GlassCard title="Required Skills">
      <div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

const ResourcesSection = memo(function ResourcesSection({
  resources,
}: ResourcesSectionProps) {
  if (!resources?.length) {
    return null;
  }
  return (
    <GlassCard title="Resources">
      <div className="space-y-3">
        {resources.map((resource, index) => (
          <div key={index} className="flex items-start justify-between">
            <div>
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white transition-colors hover:text-[#E6007A]"
              >
                {resource.title}
                <ExternalLink className="h-3 w-3" />
              </a>
              {resource.description ? (
                <p className="mt-1 text-sm text-white/60">
                  {resource.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
});

const GrantOverviewPage = () => {
  const { data: session, isPending } = useSession();
  const { grant, isLoading, isError, error, refetch } = useGrantContext();

  if (isPending) {
    return <LoadingPage />;
  }
  if (!session) {
    return <UnauthorizedState />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !grant) {
    return (
      <ErrorState
        onRetry={refetch}
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (70%) */}
        <div className="space-y-6 lg:col-span-8">
          <GlassCard>
            <MarkdownSection content={grant.summary} />
            <MarkdownSection content={grant.description} />
            <MarkdownSection content={grant.instructions} />
          </GlassCard>
        </div>

        {/* Right Column (30%) */}
        <div className="space-y-6 lg:col-span-4">
          <GlassCard title="Funding">
            <FundingSection
              minAmount={grant.minAmount}
              maxAmount={grant.maxAmount}
              totalFunds={grant.totalFunds}
              token={grant.token}
            />
            {/* <ExternalApplicationSection applicationUrl={grant.applicationUrl} /> */}
          </GlassCard>
          <SkillsSection skills={grant.skills ?? []} />

          <ResourcesSection resources={grant.resources ?? []} />
          <OrganizationSection
            organization={grant.organization as OrganizationInfo}
          />
        </div>
      </div>
    </>
  );
};

export default GrantOverviewPage;
