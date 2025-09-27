'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';

import { DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { useGrantContext } from '../../components/grants/grant-provider';

const GrantOverviewPage = () => {
  const { grant, isLoading, isError, error, refetch } = useGrantContext();


  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (isError || !grant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="font-sans text-red-400">Failed to load grant.</p>
        <Button className="mt-4" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  const formatAmount = (amount?: number) => {
    if (!amount) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6">
        {/* Grant Details */}
        <Card className='border-white/10 bg-zinc-900/50'>
          <CardHeader>
            <CardTitle>Grant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization */}
            <div>
              <p className='mb-2 text-sm text-white/60'>Organization</p>
              <div className="flex items-center gap-3">
                {grant.organization.logo && (
                  <img
                    src={grant.organization.logo}
                    alt={grant.organization.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="text-white font-medium">
                    {grant.organization.name}
                  </p>
                  {grant.organization.location && (
                    <p className="text-sm text-white/60">
                      {grant.organization.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Funding */}
            {(grant.minAmount || grant.maxAmount || grant.totalFunds) && (
              <div>
                <p className="text-sm text-white/60 mb-2">Funding</p>
                <div className="space-y-2">
                  {grant.minAmount && grant.maxAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-white/40" />
                      <span className="text-white">
                        {formatAmount(grant.minAmount)} -{' '}
                        {formatAmount(grant.maxAmount)} {grant.token}
                      </span>
                    </div>
                  )}
                  {grant.totalFunds && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-white/40" />
                      <span className="text-white">
                        Total Funds: {formatAmount(grant.totalFunds)}{' '}
                        {grant.token}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-sm text-white/60 mb-2">Description</p>
              <p className="text-white whitespace-pre-wrap">
                {grant.description}
              </p>
            </div>

            {/* Summary */}
            {grant.summary && (
              <div>
                <p className="text-sm text-white/60 mb-2">Summary</p>
                <p className="text-white">{grant.summary}</p>
              </div>
            )}

            {/* Instructions */}
            {grant.instructions && (
              <div>
                <p className="text-sm text-white/60 mb-2">
                  Application Instructions
                </p>
                <p className="text-white whitespace-pre-wrap">
                  {grant.instructions}
                </p>
              </div>
            )}

            {/* External Application */}
            {grant.applicationUrl && (
              <div>
                <p className="text-sm text-white/60 mb-2">
                  External Application
                </p>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a
                    href={grant.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Externally
                  </a>
                </Button>
              </div>
            )}

            {/* Skills */}
            {grant.skills.length > 0 && (
              <div>
                <p className="text-sm text-white/60 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {grant.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-white/10 text-white border-0"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {grant.resources && grant.resources.length > 0 && (
              <div>
                <p className="text-sm text-white/60 mb-2">Resources</p>
                <div className="space-y-2">
                  {grant.resources.map((resource: any, index: number) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <p className="text-white font-medium">{resource.title}</p>
                      {resource.description && (
                        <p className="text-sm text-white/60 mt-1">
                          {resource.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GrantOverviewPage;
