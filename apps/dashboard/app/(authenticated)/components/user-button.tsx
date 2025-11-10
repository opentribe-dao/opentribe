"use client";
import { signOut, useSession } from "@packages/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@packages/base/components/ui/sidebar";
import { ChevronsUpDown, LogOut, Settings, User, UserIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UserButtonProps {
  showName?: boolean;
  appearance?: {
    elements?: {
      rootBox?: string;
      userButtonBox?: string;
      userButtonOuterIdentifier?: string;
    };
  };
}

export function UserButton({ showName = false, appearance }: UserButtonProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to sign-in page after successful sign out
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const handleSettings = () => {
    router.push("/settings/billing");
  };

  const handleProfile = () => {
    router.push("/settings/profile");
  };

  if (!user) {
    return (
      <SidebarMenuButton disabled size="lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <UserIcon className="h-4 w-4" />
        </div>
        {showName && (
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Loading...</span>
          </div>
        )}
      </SidebarMenuButton>
    );
  }

  // Get user initials for fallback avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const userInitials = getInitials(user.name, user.email);
  const displayName = user.name || user.email || "User";

  return (
    <div
      className={appearance?.elements?.rootBox || "flex w-full overflow-hidden"}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            size="lg"
          >
            <div
              className={
                appearance?.elements?.userButtonBox || "flex items-center gap-2"
              }
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary font-medium text-sidebar-primary-foreground text-sm">
                {user.image ? (
                  <Image
                    alt={`${displayName} avatar`}
                    className="h-8 w-8 rounded-full"
                    height={32}
                    src={user.image}
                    width={32}
                  />
                ) : (
                  userInitials
                )}
              </div>
              {showName && (
                <div
                  className={`grid flex-1 text-left text-sm leading-tight ${
                    appearance?.elements?.userButtonOuterIdentifier ||
                    "truncate pl-0"
                  }`}
                >
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
              )}
              {showName && <ChevronsUpDown className="ml-auto size-4" />}
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-lg"
          side="right"
          sideOffset={4}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none">{displayName}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onClick={handleProfile}>
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={handleSettings}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-red-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
