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
import { Input } from "@packages/base/components/ui/input";
import { useGrantContext } from "@/app/(authenticated)/components/grants/grant-provider";
import { useGrantSettings } from "@/hooks/grants/use-grant-settings";

export default function GrantSettingsPage() {
  const { grant, isError, refetch } = useGrantContext();
  const { data: activeOrg } = useActiveOrganization();
  const {
    handlePauseResume,
    handleDelete,
    isPausingResuming,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
  } = useGrantSettings(grant);

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
      case "EXTERNAL":
        return "bg-blue-500/20 text-blue-400 border-0";
      default:
        return "bg-purple-500/20 text-purple-400 border-0";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div>
      {" "}
      <Card className="border-white/10 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>Grant Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-white/60">Visibility</p>
            <Badge
              className="border-0 bg-white/10 text-white"
              variant="secondary"
            >
              {grant.visibility}
            </Badge>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/60">Management Type</p>
            <Badge className={getSourceColor(grant.source)}>
              {grant.source === "NATIVE"
                ? "Managed in Opentribe"
                : "Managed Externally"}
            </Badge>
          </div>

          {grant.publishedAt && (
            <div>
              <p className="mb-2 text-sm text-white/60">Published Date</p>
              <p className="text-white">{formatDate(grant.publishedAt)}</p>
            </div>
          )}

          {isOrganizationAdmin && (
            <div className="border-white/10 border-t pt-6">
              <h3 className="mb-4 font-medium text-lg text-white">Actions</h3>
              <div className="space-y-2">
                <Button
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  disabled={grant.status === "CLOSED" || isPausingResuming}
                  onClick={handlePauseResume}
                  variant="outline"
                >
                  {(() => {
                    if (isPausingResuming) {
                      return "Updating...";
                    }
                    if (grant.status === "OPEN") {
                      return "Pause Grant";
                    }
                    return "Resume Grant";
                  })()}
                </Button>
                {showDeleteConfirm ? (
                  <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-red-400/80 text-sm">
                      Are you sure? Type "DELETE" to confirm, and then press
                      ENTER.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        className="border-red-500/50 bg-white/5 text-white placeholder:text-white/40"
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            e.currentTarget.value === "DELETE"
                          ) {
                            handleDelete();
                          }
                        }}
                        placeholder="Type DELETE to confirm"
                      />
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => setShowDeleteConfirm(false)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                    disabled={grant._count.applications > 0 || isDeleting}
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                  >
                    {isDeleting ? "Deleting..." : "Delete Grant"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
