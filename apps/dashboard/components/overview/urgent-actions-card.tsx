import { Button } from '@packages/base/components/ui/button';
import { Card, CardContent } from '@packages/base/components/ui/card';
import { ClockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UrgentActionProps {
  id?: string | number;
  title: string;
  description: string;
  actionUrl: string;
}

export function UrgentActionsCard({ id, title, description, actionUrl }: UrgentActionProps) {
  const router = useRouter();

  return (
    <>
      {
        <Card key={id} className="border-white/10 bg-zinc-900/50">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <ClockIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-white/60">{title}</p>
                <h3 className="font-medium text-white">
                  {description}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push(actionUrl);
              }}
              className="text-white/60 hover:text-white"
            >
              Review Now
            </Button>
          </CardContent>
        </Card>
      }
    </>
  );
}
