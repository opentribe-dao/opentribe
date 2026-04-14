import { auth } from "@packages/auth/server";
import { SidebarProvider } from "@packages/base/components/ui/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { AdminSidebar } from "./components/sidebar";

// Force dynamic rendering — the layout uses auth.api.getSession() which needs
// runtime request headers and DB access. Prevents build-time Prisma init failures.
export const dynamic = "force-dynamic";

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
  }

  // Double-check superadmin role at layout level
  // The custom session plugin adds role but it's not in the base type
  const user = session.user as typeof session.user & { role?: string };
  if (user.role !== "superadmin") {
    return redirect(env.NEXT_PUBLIC_WEB_URL);
  }

  return (
    <SidebarProvider>
      <AdminSidebar>{children}</AdminSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;
