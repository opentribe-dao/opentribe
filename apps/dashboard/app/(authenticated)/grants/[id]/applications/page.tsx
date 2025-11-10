"use client";

import { useActiveOrganization } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import Link from "next/link";
import { useGrantContext } from "@/app/(authenticated)/components/grants/grant-provider";

export default function GrantApplicationsPage() {
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

  const formatAmount = (amount?: number) => {
    if (!amount) {
      return "N/A";
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <Card className="border-white/10 bg-zinc-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Applications</CardTitle>
            {grant.source === "NATIVE" && isOrganizationAdmin && (
              <Button
                className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                disabled={grant.status !== "OPEN"}
              >
                Review Applications
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {grant.applications.length > 0 ? (
            <div className="space-y-3">
              {grant.applications.map((application) => (
                <div
                  className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                  key={application.id}
                >
                  <Link
                    href={`/grants/${grant.id}/applications/${application.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="font-medium text-white">
                          {application.title}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <div className="flex items-center gap-2">
                            {application.applicant.image ? (
                              <img
                                alt={application.applicant.username}
                                className="h-6 w-6 rounded-full"
                                src={application.applicant.image}
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                                <span className="text-xs">
                                  {application.applicant.username[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span>@{application.applicant.username}</span>
                          </div>
                          {application.budget && (
                            <>
                              <span>•</span>
                              <span>
                                {formatAmount(application.budget)} {grant.token}
                              </span>
                            </>
                          )}
                          {application.submittedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Submitted {formatDate(application.submittedAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className="border-0 bg-white/10 text-white">
                        {application.status}
                      </Badge>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-white/60">No applications yet</p>
              {grant.source === "EXTERNAL" && grant.applicationUrl && (
                <p className="mt-2 text-sm text-white/40">
                  Applications are managed externally
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
