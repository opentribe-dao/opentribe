"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { cn } from "@packages/base/lib/utils";
import { Building2, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  headline?: string | null;
  type?: string | null;
  industry?: string[];
  _count: {
    grants: number;
    members: number;
  };
}

interface OrganizationsDirectoryProps {
  initialOrganizations: OrgListItem[];
  initialTotal: number;
  initialSearch: string;
  initialType: string;
}

const ORG_TYPES = [
  { value: "all", label: "All Types" },
  { value: "COMPANY", label: "Company" },
  { value: "DAO", label: "DAO" },
  { value: "FOUNDATION", label: "Foundation" },
  { value: "CURATOR_GROUP", label: "Curator Group" },
];

const getTypeBadgeColor = (type?: string | null) => {
  switch (type) {
    case "DAO":
      return "bg-blue-500/20 text-blue-400 border-0";
    case "FOUNDATION":
      return "bg-green-500/20 text-green-400 border-0";
    case "CURATOR_GROUP":
      return "bg-purple-500/20 text-purple-300 border-0";
    case "COMPANY":
      return "bg-orange-500/20 text-orange-400 border-0";
    default:
      return "bg-white/10 text-white/60 border-0";
  }
};

const formatTypeLabel = (type?: string | null) => {
  if (!type) return "Organization";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export function OrganizationsDirectory({
  initialOrganizations,
  initialTotal,
  initialSearch,
  initialType,
}: OrganizationsDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [activeType, setActiveType] = useState(initialType);

  const updateUrl = useCallback(
    (newSearch: string, newType: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("search", newSearch);
      if (newType && newType !== "all") params.set("type", newType);
      const qs = params.toString();
      startTransition(() => {
        router.push(`/organizations${qs ? `?${qs}` : ""}`);
      });
    },
    [router]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(search, activeType);
  };

  const handleTypeFilter = (type: string) => {
    setActiveType(type);
    updateUrl(search, type);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="mb-3 font-bold font-heading text-3xl text-white md:text-4xl">
            Organizations
          </h1>
          <p className="max-w-2xl text-lg text-white/60">
            Explore organizations building in the Polkadot ecosystem. Find teams
            funding grants, bounties, and opportunities for builders.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <form className="flex gap-3" onSubmit={handleSearch}>
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 backdrop-blur-md"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                type="text"
                value={search}
              />
            </div>
            <Button
              className="bg-[#E6007A] text-white hover:bg-[#FF1493]"
              type="submit"
            >
              Search
            </Button>
          </form>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {ORG_TYPES.map((type) => (
              <button
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeType === type.value
                    ? "bg-[#E6007A] text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                )}
                key={type.value}
                onClick={() => handleTypeFilter(type.value)}
                type="button"
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-white/50">
            {initialTotal} organization{initialTotal !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Organization Grid */}
        {initialOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {initialOrganizations.map((org) => (
              <Link
                className="group block"
                href={`/organizations/${org.slug}`}
                key={org.id}
              >
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10">
                  <div className="mb-4 flex items-start gap-4">
                    {/* Logo */}
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                      {org.logo ? (
                        <Image
                          alt={org.name}
                          className="object-cover"
                          fill
                          src={org.logo}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name and Type */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-lg text-white group-hover:text-[#E6007A]">
                        {org.name}
                      </h3>
                      {org.type && (
                        <Badge
                          className={cn("mt-1", getTypeBadgeColor(org.type))}
                          variant="secondary"
                        >
                          {formatTypeLabel(org.type)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Headline */}
                  {org.headline && (
                    <p className="mb-4 line-clamp-2 text-sm text-white/60">
                      {org.headline}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>
                        {org._count?.grants ?? 0} grant
                        {(org._count?.grants ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {org._count?.members ?? 0} member
                        {(org._count?.members ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-white/30" />
            <h3 className="mb-2 font-semibold text-lg text-white">
              No organizations found
            </h3>
            <p className="text-white/60">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
