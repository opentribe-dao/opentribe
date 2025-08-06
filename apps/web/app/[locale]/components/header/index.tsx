"use client";

import { env } from "@/env";
import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
import {
  Building2,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  MoveRight,
  Settings,
  User,
  X,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@packages/i18n";
import Image from "next/image";
import { AuthModal } from "../auth-modal";

type HeaderProps = {
  dictionary: Dictionary;
};

const UserMenu = ({
  user,
  onSignOut,
}: {
  user: any;
  onSignOut: () => void;
}) => {
  const [userProfile, setUserProfile] = useState<{
    organizations: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            organizations: data.user.organizations || [],
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

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
  const firstName = user.name ? user.name.split(" ")[0] : displayName;
  const hasOrganization = userProfile?.organizations && userProfile.organizations.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2 hover:bg-white/10 rounded-lg"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={`${displayName} avatar`}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white font-medium text-xs">
              {userInitials}
            </div>
          )}
          <span className="text-white font-medium">{firstName}</span>
          <ChevronDown className="h-4 w-4 text-white/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-black/90 border-white/10 text-white"
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{displayName}</p>
            <p className="text-white/60 text-xs leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="cursor-pointer focus:bg-white/10 focus:text-white"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="cursor-pointer focus:bg-white/10 focus:text-white"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        {hasOrganization ? (
          <DropdownMenuItem asChild>
            <a
              href={`${env.NEXT_PUBLIC_DASHBOARD_URL}`}
              className="cursor-pointer focus:bg-white/10 focus:text-white"
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href="/onboarding/organization"
              className="cursor-pointer focus:bg-white/10 focus:text-white"
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Create Organization</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a
            href={env.NEXT_PUBLIC_DOCS_URL || "https://docs.opentribe.io"}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer focus:bg-white/10 focus:text-white"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={env.NEXT_PUBLIC_DOCS_URL || "https://docs.opentribe.io"}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer focus:bg-white/10 focus:text-white"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={onSignOut} 
          className="text-red-400 focus:bg-white/10 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Header = ({ dictionary }: HeaderProps) => {
  const { data: session } = useSession();
  const [isOpen, setOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    const { signOut } = await import("@packages/auth/client");
    await signOut();
  };

  const navigationItems = [
    {
      title: "💰 Bounties",
      href: "/bounties",
      description: "",
    },
    {
      title: "🖌 Grants",
      href: "/grants",
      description: "",
    },
    {
      title: "🗒️ RFPs",
      href: "/rfps",
      description: "",
    },
  ];

  const isActive = (href: string) => {
    // Remove locale prefix if present
    const cleanPathname = pathname.replace(/^\/[a-z]{2}/, '');
    const cleanHref = href.replace(/^\/[a-z]{2}/, '');
    return cleanPathname === cleanHref || cleanPathname.startsWith(`${cleanHref}/`);
  };

  return (
    <header className="sticky top-0 left-0 z-40 w-full border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="container relative mx-auto flex min-h-20 flex-row items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-heading font-bold tracking-[0.25em] bg-gradient-to-r from-white/35 to-white bg-clip-text text-transparent leading-[1.75]">
              OPENTRIBE
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`text-sm transition-colors ${
                isActive(item.href)
                  ? "text-white font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <UserMenu user={session.user} onSignOut={handleSignOut} />
          ) : (
            <>
              <AuthModal defaultTab="sign-up">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full font-heading font-bold text-base"
                >
                  Login / Sign Up
                </Button>
              </AuthModal>
            </>
          )}
        </div>
        <div className="flex w-12 shrink items-end justify-end lg:hidden">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {isOpen && (
            <div className="container absolute top-20 right-0 flex w-full flex-col gap-8 border-t bg-background py-4 px-6 shadow-lg">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-4 ${
                          isActive(item.href) ? "text-white" : ""
                        }`}
                        target={
                          item.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          item.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <span className="text-lg">{item.title}</span>
                        <MoveRight className="h-4 w-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg pl-4">{item.title}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
