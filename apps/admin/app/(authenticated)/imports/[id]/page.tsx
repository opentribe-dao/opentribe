"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "../../components/header";
import { useAdminImport } from "@/hooks/use-admin-imports";

function statusBadgeColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500/20 text-green-400";
    case "RUNNING":
      return "bg-blue-500/20 text-blue-400";
    case "IMPORT_PENDING":
      return "bg-yellow-500/20 text-yellow-400";
    case "IMPORT_FAILED":
      return "bg-red-500/20 text-red-400";
    case "PARTIAL":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-white/10 text-white/60";
  }
}

export default function ImportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminImport(id);

  const importJob = (data as { data: Record<string, unknown> })?.data;
  const errorLog = importJob?.errorLog as Record<string, unknown> | null;
  const metadata = importJob?.metadata as Record<string, unknown> | null;

  if (isLoading) {
    return (
      <>
        <Header
          pages={[{ label: "Imports", href: "/imports" }]}
          page="Loading..."
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!importJob) {
    return (
      <>
        <Header
          pages={[{ label: "Imports", href: "/imports" }]}
          page="Not Found"
        />
        <div className="p-6">
          <p className="text-white/60">Import job not found.</p>
        </div>
      </>
    );
  }

  const progress =
    (importJob.totalItems as number) > 0
      ? Math.round(
          ((importJob.processed as number) / (importJob.totalItems as number)) *
            100
        )
      : 0;

  return (
    <>
      <Header
        pages={[{ label: "Imports", href: "/imports" }]}
        page={`Import: ${importJob.source}`}
      >
        <div className="pr-4">
          <Link href="/imports">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Overview */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Import Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Source</p>
              <p className="text-white">{importJob.source as string}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Status</p>
              <Badge
                className={`mt-1 border-0 ${statusBadgeColor(importJob.status as string)}`}
                variant="secondary"
              >
                {importJob.status as string}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-white/40">Created</p>
              <p className="text-white">
                {new Date(importJob.createdAt as string).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Created By</p>
              <p className="text-white">
                {(importJob.createdBy as string) || "System"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Started At</p>
              <p className="text-white">
                {importJob.startedAt
                  ? new Date(importJob.startedAt as string).toLocaleString()
                  : "Not started"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Completed At</p>
              <p className="text-white">
                {importJob.completedAt
                  ? new Date(importJob.completedAt as string).toLocaleString()
                  : "Not completed"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                {importJob.processed as number} / {importJob.totalItems as number}{" "}
                items processed
              </span>
              <span className="font-medium text-white">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#E6007A] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="font-bold text-2xl text-white">
                  {importJob.totalItems as number}
                </p>
                <p className="text-sm text-white/40">Total Items</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="font-bold text-2xl text-green-400">
                  {importJob.processed as number}
                </p>
                <p className="text-sm text-white/40">Processed</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="font-bold text-2xl text-red-400">
                  {importJob.errors as number}
                </p>
                <p className="text-sm text-white/40">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Log */}
        {errorLog != null && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Error Log</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[400px] overflow-auto rounded-lg bg-black/30 p-4 text-sm text-red-300">
                {JSON.stringify(errorLog, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {metadata != null && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[300px] overflow-auto rounded-lg bg-black/30 p-4 text-sm text-white/60">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
