import { Card, CardContent, CardDescription, CardHeader } from "@packages/base/components/ui/card";

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  prefix?: string;
  className?: string;
}

export function StatsCard({ title, value, prefix, className }: StatsCardProps) {
  return (
    <Card className={`border-white/10 bg-zinc-900/50 ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardDescription className="text-white/40 text-xs">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-semibold text-3xl text-white">
          {prefix}{value}
        </div>
      </CardContent>
    </Card>
  );
}