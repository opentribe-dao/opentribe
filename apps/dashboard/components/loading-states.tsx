"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { cn } from "@packages/base/lib/utils";
import { Loader2 } from "lucide-react";
import { Header } from "@/app/(authenticated)/components/header";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton className="h-4 w-[100px]" key={i} />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div className="border-b p-4 last:border-0" key={i}>
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton className="h-4 w-[100px]" key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="mb-4 h-4 w-[250px]" />
      <Skeleton className="mb-2 h-3 w-[200px]" />
      <Skeleton className="h-3 w-[150px]" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="mb-2 h-8 w-[300px]" />
      <Skeleton className="h-4 w-[500px]" />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <>
      <Header page="Overview" pages={[]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Cards Skeleton */}
        <div className="grid gap-12 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card className="border-white/10 bg-zinc-900/50" key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 bg-white/20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 bg-white/30" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What's Next Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 bg-white/20" />
          <Card className="border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-purple-600/10">
            <CardContent className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
                <div>
                  <Skeleton className="mb-2 h-4 w-48 bg-white/20" />
                  <Skeleton className="h-3 w-32 bg-white/10" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded bg-[#E6007A]/30" />
            </CardContent>
          </Card>
        </div>

        {/* Reviews Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 bg-white/20" />
          {[1, 2].map((i) => (
            <Card className="border-white/10 bg-zinc-900/50" key={i}>
              <CardContent className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-[#E6007A]/20" />
                  <Skeleton className="h-4 w-40 bg-white/20" />
                </div>
                <Skeleton className="h-6 w-12 bg-green-500/20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
