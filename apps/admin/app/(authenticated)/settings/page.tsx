"use client";

import { useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Header } from "../components/header";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <>
      <Header pages={[]} page="Settings" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="font-semibold text-2xl text-white">
            Admin Settings
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Platform configuration and admin account details
          </p>
        </div>

        {/* Admin Account Info */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Name</p>
              <p className="text-white">
                {session?.user?.name || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white">
                {session?.user?.email || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Role</p>
              <Badge
                className="mt-1 border-0 bg-red-500/20 text-red-400"
                variant="secondary"
              >
                {session?.user?.role || "Loading..."}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-white/40">User ID</p>
              <p className="truncate font-mono text-sm text-white/60">
                {session?.user?.id || "Loading..."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Info */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">Platform Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/40">Environment</p>
              <p className="text-white">
                {process.env.NODE_ENV === "production"
                  ? "Production"
                  : "Development"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">API URL</p>
              <p className="truncate font-mono text-sm text-white/60">
                {process.env.NEXT_PUBLIC_API_URL || "Not configured"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Web URL</p>
              <p className="truncate font-mono text-sm text-white/60">
                {process.env.NEXT_PUBLIC_WEB_URL || "Not configured"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/40">Admin App</p>
              <Badge
                className="mt-1 border-0 bg-green-500/20 text-green-400"
                variant="secondary"
              >
                Running
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
