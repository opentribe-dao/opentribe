'use client';
import { useGrantContext } from "@/app/(authenticated)/components/grants/grant-provider";
import { useActiveOrganization } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/base/components/ui/card";

export default function GrantSettingsPage() {


    const { grant, isLoading, isError, error, refetch } = useGrantContext();
    const { data: activeOrg } = useActiveOrganization();



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

      const isOrganizationAdmin = grant.organization.id === activeOrg?.id;


      const getSourceColor = (source: string) => {
        switch (source.toUpperCase()) {
          case 'EXTERNAL':
            return 'bg-blue-500/20 text-blue-400 border-0';
          default:
            return 'bg-purple-500/20 text-purple-400 border-0';
        }
      };

        const formatDate = (date: string) => {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        };
      



    
    return <div> <Card className='border-white/10 bg-zinc-900/50'>
    <CardHeader>
      <CardTitle>Grant Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <p className='mb-2 text-sm text-white/60'>Visibility</p>
        <Badge
          variant="secondary"
          className='border-0 bg-white/10 text-white'
        >
          {grant.visibility}
        </Badge>
      </div>

      <div>
        <p className='mb-2 text-sm text-white/60'>Management Type</p>
        <Badge className={getSourceColor(grant.source)}>
          {grant.source === 'NATIVE'
            ? 'Managed in Opentribe'
            : 'Managed Externally'}
        </Badge>
      </div>

      {grant.publishedAt && (
        <div>
          <p className='mb-2 text-sm text-white/60'>Published Date</p>
          <p className="text-white">
            {formatDate(grant.publishedAt)}
          </p>
        </div>
      )}

      {isOrganizationAdmin && (
        <div className='border-white/10 border-t pt-6'>
          <h3 className='mb-4 font-medium text-lg text-white'>
            Actions
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              disabled={grant.status === 'CLOSED'}
            >
              {grant.status === 'OPEN'
                ? 'Pause Grant'
                : 'Resume Grant'}
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
              disabled={grant._count.applications > 0}
            >
              Delete Grant
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  </Card></div>;
}