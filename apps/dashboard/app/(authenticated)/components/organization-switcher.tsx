"use client";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from "@packages/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@packages/base/components/ui/sidebar";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { env } from "@/env";

interface OrganizationSwitcherProps {
  hidePersonal?: boolean;
  afterSelectOrganizationUrl?: string;
}

export function OrganizationSwitcher({
  hidePersonal = false,
  afterSelectOrganizationUrl = "/",
}: OrganizationSwitcherProps) {
  const { data: session } = useSession();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: organizations, isPending } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();

  const handleOrganizationSwitch = async (
    orgId: string,
    event?: React.MouseEvent
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    try {
      await organization.setActive({
        organizationId: orgId,
      });
      // Ensure we use a relative path, not a full URL
      const url =
        afterSelectOrganizationUrl.startsWith("http") ||
        afterSelectOrganizationUrl.startsWith("//")
          ? "/"
          : afterSelectOrganizationUrl;
      router.push(url);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };
  const handleAddOrganization = () => {
    router.push(`${env.NEXT_PUBLIC_WEB_URL}/onboarding/organization`);
  };

  // Auto-select first organization if none is selected
  useEffect(() => {
    const selectFirstOrg = async () => {
      if (
        !isPending &&
        organizations &&
        organizations.length > 0 &&
        !activeOrg
      ) {
        try {
          await organization.setActive({
            organizationId: organizations[0].id,
          });
          router.refresh();
        } catch (error) {
          console.error("Failed to auto-select organization:", error);
        }
      }
    };

    selectFirstOrg();
  }, [isPending, organizations, activeOrg, router]);

  // Redirect to organization creation if no organizations exist
  useEffect(() => {
    if (!isPending && (!organizations || organizations.length === 0)) {
      router.push(`${env.NEXT_PUBLIC_WEB_URL}/onboarding/organization`);
    }
  }, [isPending, organizations, router]);

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If no active org, show create organization button
  if (!activeOrg && (!organizations || organizations.length === 0)) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleAddOrganization} size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Create Organization</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Use active org or first org if no active org is set
  const displayOrg = activeOrg || organizations?.[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div
                className={`flex aspect-square size-8 items-center justify-center rounded-lg ${displayOrg?.logo ? "bg-transparent" : "bg-sidebar-primary"} text-sidebar-primary-foreground`}
              >
                {displayOrg?.logo ? (
                  <Image
                    alt={`${displayOrg.name} logo`}
                    className="size-8 rounded-lg object-cover"
                    height={32}
                    src={displayOrg.logo}
                    width={32}
                  />
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-medium">
                  {displayOrg?.name || "No Organization"}
                </span>
                <span className="text-sidebar-foreground/70 text-xs">
                  {displayOrg ? "Organization" : "Create or join one"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations?.map((org, index) => (
              <DropdownMenuItem
                className="gap-2 p-2"
                key={org.id}
                onClick={(e) => handleOrganizationSwitch(org.id, e)}
              >
                <div
                  className={`flex size-6 items-center justify-center rounded-md ${org.logo ? "" : "border"}`}
                >
                  {org.logo ? (
                    <Image
                      alt={`${org.name} logo`}
                      className="size-6 rounded-md object-cover"
                      height={24}
                      src={org.logo}
                      width={24}
                    />
                  ) : (
                    <Building2 className="size-3.5 shrink-0" />
                  )}
                </div>
                <span className="flex-1">{org.name}</span>
                {org.id === activeOrg?.id && (
                  <Check className="size-4 text-primary" />
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleAddOrganization}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
