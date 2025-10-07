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

import { DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { useGrantContext } from '../../components/grants/grant-provider';
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  title: string;
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
  <Card className="bg-white/10 backdrop-blur-[10px] border border-white/20">
    {title ? (
      <CardHeader>
        <CardTitle className="font-heading">{title}</CardTitle>
      </CardHeader>
    ) : null}
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

const LoadingState = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
  </div>
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
    <div>
      {/* <p className="mb-2 text-sm text-white/60 font-sans">Organization</p> */}
      <div className="flex items-center gap-3">
        {organization.logo ? (
          // Using <img> to avoid domain config issues in dashboard
          <img
            src={organization.logo}
            alt={organization.name}
            className="w-10 h-10 rounded-full"
          />
        ) : null}
        <div>
          <p className="text-white font-medium font-sans">
            {organization.name}
          </p>
          {organization.location ? (
            <p className="text-sm text-white/60 font-sans">
              {organization.location}
            </p>
          ) : null}
        </div>
      </div>
    </div>
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
            <span className="text-white font-sans">
              {formatAmount(minAmount)} - {formatAmount(maxAmount)}{' '}
              {token ?? ''}
            </span>
          </div>
        ) : null}
        {totalFunds ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white/40" />
            <span className="text-white font-sans">
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
      <p className="text-sm text-white/60 mb-2 font-sans">
        External Application
      </p>
      <Button className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white" asChild>
        <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Apply Externally
        </a>
      </Button>
    </div>
  );
});

const MarkdownSection = memo(function MarkdownSection({
  title,
  content,
}: MarkdownSectionProps) {
  if (!content) {
    return null;
  }
  return (
    <div>
      <p className="text-sm text-white/60 mb-2 font-sans">{title}</p>
      <div className="prose prose-invert max-w-none font-sans">
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
    <div>
      {/* <p className="text-sm text-white/60 mb-2 font-sans">Required Skills</p> */}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-white/10 text-white border border-white/20"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
});

const ResourcesSection = memo(function ResourcesSection({
  resources,
}: ResourcesSectionProps) {
  if (!resources?.length) {
    return null;
  }
  return (
    <div>
      <p className="text-sm text-white/60 mb-2 font-sans">Resources</p>
      <div className="space-y-2">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
          >
            <p className="text-white font-medium font-sans">{resource.title}</p>
            {resource.description ? (
              <p className="text-sm text-white/60 mt-1 font-sans">
                {resource.description}
              </p>
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
});

const GrantOverviewPage = () => {
  const { data: session, isPending } = useSession();
  const { grant, isLoading, isError, error, refetch } = useGrantContext();

  if (isPending) {
    return <LoadingState />;
  }
  if (!session) return <UnauthorizedState />;

  if (isLoading) return <LoadingState />;

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (70%) */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard>
            {/* <OrganizationSection organization={grant.organization as OrganizationInfo} />
            <FundingSection
              minAmount={grant.minAmount}
              maxAmount={grant.maxAmount}
              totalFunds={grant.totalFunds}
              token={grant.token}
            /> */}
            <MarkdownSection title="Summary" content={grant.summary} />
            <MarkdownSection title="Description" content={grant.description} />

            <MarkdownSection
              title="Application Instructions"
              content={grant.instructions}
            />
            {/* <SkillsSection skills={grant.skills ?? []} /> */}
            <ResourcesSection resources={grant.resources ?? []} />
          </GlassCard>
        </div>

        {/* Right Column (30%) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard title="Funding">
            <FundingSection
              minAmount={grant.minAmount}
              maxAmount={grant.maxAmount}
              totalFunds={grant.totalFunds}
              token={grant.token}
            />
            <ExternalApplicationSection applicationUrl={grant.applicationUrl} />
          </GlassCard>
          <GlassCard title="Required Skills">
            <SkillsSection skills={grant.skills ?? []} />
          </GlassCard>

          <GlassCard title="Organization">
            <OrganizationSection
              organization={grant.organization as OrganizationInfo}
            />
          </GlassCard>
        </div>
      </div>
    </>
  );
};

export default GrantOverviewPage;
