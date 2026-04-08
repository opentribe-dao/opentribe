"use client";

import { useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
  Building2Icon,
  ClipboardCheckIcon,
  CoinsIcon,
  DownloadIcon,
  FileTextIcon,
  HomeIcon,
  LogOut,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";

type AdminSidebarProperties = {
  readonly children: ReactNode;
};

const useNavData = () => {
  const pathname = usePathname();

  return {
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: HomeIcon,
        isActive: pathname === "/",
      },
      {
        title: "Users",
        url: "/users",
        icon: UsersIcon,
        isActive: pathname.startsWith("/users"),
      },
      {
        title: "Organizations",
        url: "/organizations",
        icon: Building2Icon,
        isActive: pathname.startsWith("/organizations"),
      },
      {
        title: "Grants",
        url: "/grants",
        icon: FileTextIcon,
        isActive: pathname.startsWith("/grants"),
      },
      {
        title: "Bounties",
        url: "/bounties",
        icon: CoinsIcon,
        isActive: pathname.startsWith("/bounties"),
      },
      {
        title: "Ecosystem Profiles",
        url: "/profiles",
        icon: ShieldIcon,
        isActive: pathname.startsWith("/profiles"),
      },
      {
        title: "Claims",
        url: "/claims",
        icon: ClipboardCheckIcon,
        isActive: pathname.startsWith("/claims"),
      },
      {
        title: "Imports",
        url: "/imports",
        icon: DownloadIcon,
        isActive: pathname.startsWith("/imports"),
      },
      {
        title: "Settings",
        url: "/settings",
        icon: SettingsIcon,
        isActive: pathname.startsWith("/settings"),
      },
    ],
  };
};

export const AdminSidebar = ({ children }: AdminSidebarProperties) => {
  const data = useNavData();
  const { isMobile } = useSidebar();
  const { data: session } = useSession();

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
          isMobile ? "bg-[#0a0a0a] border-r-0" : "bg-white/5"
        )}
      >
        <div
          className={cn(
            "flex h-full w-full flex-col",
            isMobile && "bg-[#0a0a0a]"
          )}
        >
          <SidebarHeader className="border-white/10 border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6007A]/20">
                <ShieldIcon className="h-4 w-4 text-[#E6007A]" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">
                  Opentribe Admin
                </h2>
                <Badge
                  className="mt-0.5 border-0 bg-[#E6007A]/20 text-[#E6007A] text-[10px]"
                  variant="secondary"
                >
                  Superadmin
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="font-medium text-white/40 text-xs uppercase tracking-wider">
                Management
              </SidebarGroupLabel>
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
          </SidebarContent>

          <SidebarFooter className="border-white/10 border-t p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="mb-2 rounded-lg bg-white/5 px-3 py-2">
                  <p className="truncate font-medium text-sm text-white">
                    {session?.user?.name || "Admin"}
                  </p>
                  <p className="truncate text-white/40 text-xs">
                    {session?.user?.email}
                  </p>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="w-full justify-start rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <button
                    className="flex w-full items-center"
                    onClick={handleSignOut}
                    type="button"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset className="bg-transparent">{children}</SidebarInset>
    </>
  );
};
