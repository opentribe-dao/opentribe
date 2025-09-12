'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/base/components/ui/card";
import { useBountyContext } from "../bounty-provider";

export default function SettingsPage() {

  const {
    bounty,
  } = useBountyContext();

  if (!bounty) {
    return <div className="text-white">Bounty not found</div>;
  }

  return (
    <Card className="bg-zinc-900/50 border-white/10">
    <CardHeader>
      <CardTitle>Bounty Settings</CardTitle>
      <CardDescription>Manage your bounty settings and visibility</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-sm text-white/60">Status</p>
        <p className="text-white">{bounty.status}</p>
      </div>
      <div>
        <p className="text-sm text-white/60">Visibility</p>
        <p className="text-white">{bounty.visibility}</p>
      </div>
      <div>
        <p className="text-sm text-white/60">Created</p>
        <p className="text-white">{new Date(bounty.createdAt).toLocaleString()}</p>
      </div>
      {bounty.publishedAt && (
        <div>
          <p className="text-sm text-white/60">Published</p>
          <p className="text-white">{new Date(bounty.publishedAt).toLocaleString()}</p>
        </div>
      )}
    </CardContent>
  </Card>
  );
}