import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@packages/base/components/ui/card";

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  prefix?: string;
  className?: string;
}

export function StatsCard({ title, value, prefix, className }: StatsCardProps) {
  return (
    <Card
      className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-md ${className ?? ""}`}
    >
      <CardHeader className="pb-3">
        <CardDescription className="font-extralight text-white/70 text-xl">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-semibold text-3xl text-white">
          {prefix}
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
