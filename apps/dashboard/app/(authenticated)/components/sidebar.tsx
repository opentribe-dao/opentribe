"use client";
import { useActiveOrganization, useSession } from "@packages/auth/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@packages/base/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@packages/base/components/ui/sidebar";
import { Button } from "@packages/base/components/ui/button";
import { cn } from "@packages/base/lib/utils";
import {
  Building2Icon,
  CreditCardIcon,
  LifeBuoyIcon,
  SendIcon,
  Settings2Icon,
  SquareTerminalIcon,
  UserIcon,
  UsersIcon,
  HomeIcon,
  CoinsIcon,
  FileTextIcon,
  MessageSquareIcon,
  SettingsIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  Plus,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { OrganizationSwitcher } from "./organization-switcher";
import { Search } from "./search";
import { UserButton } from "./user-button";
import { env } from "@/env";

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
        url: "/help",
        icon: HelpCircleIcon,
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
  const sidebar = useSidebar();
  const data = useNavData();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("@packages/auth/client");
      await signOut();
      redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
    } catch (error) {
      redirect(`${env.NEXT_PUBLIC_WEB_URL}/sign-in`);
    }
  };

  return (
    <>
      <Sidebar className="border-r border-white/10 bg-white/5 backdrop-blur-xl">
        <SidebarHeader className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
              <span className="text-xs font-bold text-white">O</span>
            </div>
            <OrganizationSwitcher />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
            <SidebarGroupLabel className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Popular activities
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-3">
              {activeOrg ? (
                <div className="flex items-center justify-between py-2 px-3">
                  <span className="text-sm text-white/60">
                    {activeOrg.name}
                  </span>
                  <span className="text-xs text-white/40">0</span>
                </div>
              ) : (
                <div className="py-2 px-3">
                  <span className="text-xs text-white/40">
                    No organization selected
                  </span>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto space-y-2 px-3">
            <Button
              className="w-full bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
              size="sm"
              asChild
            >
              <Link href="/bounties/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Bounty
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              size="sm"
              asChild
            >
              <Link href="/grants/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Grant
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              size="sm"
              asChild
            >
              <Link href="/rfps/new">
                <Plus className="mr-2 h-4 w-4" />
                Create RFP
              </Link>
            </Button>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-3">
          <SidebarMenu>
            {data.bottomActions.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="w-full justify-start rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                >
                  {item.url === "/sign-out" ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center"
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  ) : (
                    <Link href={item.url}>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">{children}</SidebarInset>
    </>
  );
};
