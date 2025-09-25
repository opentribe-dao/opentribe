"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@packages/auth/client";
import { Button as BaseButton } from "@packages/base/components/ui/button";
import { Search, Filter, Settings, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
  CommandItem,
} from "@packages/base/components/ui/command";
import { env } from "@/env";

// Types for search functionality
type SearchType = "bounties" | "grants" | "rfps";

interface SearchResult {
  id: string;
  title: string;
  slug?: string;
  type: SearchType;
}

// Safe Button wrapper for React 19 compatibility
const Button = (props: any) => {
  const { children, onClick, variant, className } = props;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        variant === "outline"
          ? "border border-white/20 text-white hover:bg-white/10"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      } ${className || ""}`}
    >
      {children}
    </button>
  );
};

export function HeroSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "";

  const bountyResults = searchResults.filter((r) => r.type === "bounties");
  const grantResults = searchResults.filter((r) => r.type === "grants");
  const rfpResults = searchResults.filter((r) => r.type === "rfps");

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced / abortable search
  useEffect(() => {
    const handler = setTimeout(async () => {
      // cancel previous in-flight request
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }

      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const apiUrl = env.NEXT_PUBLIC_API_URL;
        const controller = new AbortController();
        searchAbortRef.current = controller;

        const res = await fetch(
          `${apiUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        const data = await res.json();
        setSearchResults(Array.isArray(data.results) ? data.results : []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          // only log non-abort errors
          console.error("Search error:", err);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <>
      <section className="container mx-auto px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            {session?.user ? (
              <>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome Back{userName ? `, ${userName}` : ""}!
                </h1>
                <p className="text-white/60">
                  We are so glad to have you back on Opentribe
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-2">
                  Find your next high paying gig
                </h1>
                <p className="text-white/60">
                  Connect with top organizations in the Polkadot ecosystem
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100 ml-2">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            {/* <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button> */}
          </div>
        </div>
      </section>

      {/* Search Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            // reset state when closing for a clean reopen
            setSearchTerm("");
            setSearchResults([]);
            setIsSearching(false);
            if (searchAbortRef.current) searchAbortRef.current.abort();
          }
        }}
      >
        <CommandInput
          placeholder="Search..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          {/* Optional: simple loading hint when typing */}
          {isSearching && searchTerm && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </div>
          )}

          {searchTerm === "" ? (
            <CommandGroup heading="Suggestions">
              <CommandItem
                value="go-to-bounties"
                onSelect={() => {
                  router.push("/bounties");
                  setOpen(false);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Bounties</span>
              </CommandItem>
              <CommandItem
                value="go-to-grants"
                onSelect={() => {
                  router.push("/grants");
                  setOpen(false);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Grants</span>
              </CommandItem>
              <CommandItem
                value="go-to-rfps"
                onSelect={() => {
                  router.push("/rfps");
                  setOpen(false);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>RFPs</span>
              </CommandItem>
            </CommandGroup>
          ) : (
            <>
              {bountyResults.length > 0 && (
                <CommandGroup heading="Bounties">
                  {bountyResults.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={r.title ?? r.id}
                      onSelect={() => {
                        router.push(`/bounties/${r.slug || r.id}`);
                        setOpen(false);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {grantResults.length > 0 && (
                <CommandGroup heading="Grants">
                  {grantResults.map((r: any) => (
                    <CommandItem
                      key={r.id}
                      value={r.title ?? r.id}
                      onSelect={() => {
                        router.push(`/grants/${r.slug || r.id}`);
                        setOpen(false);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {rfpResults.length > 0 && (
                <CommandGroup heading="RFPs">
                  {rfpResults.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={r.title ?? r.id}
                      onSelect={() => {
                        router.push(`/rfps/${r.slug || r.id}`);
                        setOpen(false);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isSearching && searchResults.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
            </>
          )}

          <CommandSeparator />

          {session?.user && (
            <CommandGroup heading="Settings">
              <CommandItem
                value="profile"
                onSelect={() => {
                  router.push("/profile");
                  setOpen(false);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </CommandItem>
              <CommandItem
                value="settings"
                onSelect={() => {
                  router.push("/settings");
                  setOpen(false);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
