"use client";
import { useActiveOrganization } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@packages/base/components/ui/sidebar";
import { cn } from "@packages/base/lib/utils";
import {
  CoinsIcon,
  FileTextIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOut,
  MessageSquareIcon,
  Plus,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { OrganizationSwitcher } from "./organization-switcher";

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

// Function to generate navigation data with active organization
const useNavData = () => {
  const { data: activeOrg } = useActiveOrganization();
  const pathname = usePathname();

  return {
    navMain: [
      {
        title: "Overview",
        url: "/",
        icon: HomeIcon,
        isActive: pathname === "/",
      },
      {
        title: "Bounties",
        url: "/bounties",
        icon: CoinsIcon,
        isActive: pathname.startsWith("/bounties"),
      },
      {
        title: "Grants",
        url: "/grants",
        icon: FileTextIcon,
        isActive: pathname.startsWith("/grants"),
      },
      {
        title: "RFPs",
        url: "/rfps",
        icon: MessageSquareIcon,
        isActive: pathname.startsWith("/rfps"),
      },
    ],
    bottomActions: [
      {
        title: "Settings",
        url: `/org/${activeOrg?.id}/settings`,
        icon: SettingsIcon,
      },
      {
        title: "Help",
        url: `${env.NEXT_PUBLIC_WEB_URL}/support`,
        icon: HelpCircleIcon,
        isExternal: true,
      },
      {
        title: "Sign out",
        url: "/sign-out",
        icon: LogOut,
      },
    ],
  };
};

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const data = useNavData();
  const { isMobile } = useSidebar();

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("@packages/auth/client");
      await signOut();
      redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
    } catch {
      redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
    }
  };

  return (
    <>
      <Sidebar 
        className={cn(
          "border-white/10 border-r backdrop-blur-xl",
          isMobile 
            ? "bg-[#0a0a0a] border-r-0" 
            : "bg-white/5"
        )}
      >
        <div 
          className={cn(
            "flex h-full w-full flex-col",
            isMobile && "bg-[#0a0a0a]"
          )}
        >
          <SidebarHeader className="border-white/10 border-b p-4">
            <OrganizationSwitcher />
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                      item.isActive
                        ? "bg-[#E6007A]/10 text-[#E6007A] hover:bg-[#E6007A]/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="font-medium text-white/40 text-xs uppercase tracking-wider">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-3">
              <div className="mt-auto space-y-2 px-3">
                <Button asChild size="sm" variant="ghost">
                  <Link href="/bounties/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Bounty
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/grants/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Grant
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/rfps/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create RFP
                  </Link>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-white/10 border-t p-3">
          <SidebarMenu>
            {data.bottomActions.map((item) => {
              const actionItem = item as typeof item & { isExternal?: boolean };

              if (item.url === "/sign-out") {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="w-full justify-start rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                    >
                      <button
                        className="flex w-full items-center"
                        onClick={handleSignOut}
                        type="button"
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              if (actionItem.isExternal) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="w-full justify-start rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                    >
                      <a href={item.url}>
                        <item.icon className="mr-3 h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="w-full justify-start rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    <Link href={item.url}>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset className="bg-transparent">{children}</SidebarInset>
    </>
  );
};
