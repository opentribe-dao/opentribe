import { auth } from "@packages/auth/server";
import { SidebarProvider } from "@packages/base/components/ui/sidebar";
import { showBetaFeature } from "@packages/feature-flags";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { GlobalSidebar } from "./components/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { env } from "@/env";

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  // Use Better Auth to get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("[Dashboard] Session:", session);

  const betaFeature = await showBetaFeature();

  if (!session?.user) {
    return redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <GlobalSidebar>
          {betaFeature && (
            <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
              Beta feature now available
            </div>
          )}
          {children}
        </GlobalSidebar>
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default AppLayout;
