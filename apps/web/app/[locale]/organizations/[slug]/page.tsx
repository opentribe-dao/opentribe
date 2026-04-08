import { Badge } from "@packages/base/components/ui/badge";
import {
  clampDescription,
  clampTitle,
  createDetailMetadata,
} from "@packages/seo/meta";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Twitter,
} from "lucide-react";
import { env } from "@/env";

type Props = {
  params: Promise<{ slug: string }>;
};

interface OrgGrant {
  id: string;
  title: string;
  slug: string;
  status: string;
  token?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  applicationCount?: number;
  rfpCount?: number;
  summary?: string | null;
  skills?: string[];
  _count?: {
    applications: number;
  };
}

interface OrgProfile {
  id: string;
  slug: string;
  displayName: string;
  image?: string | null;
  role?: string | null;
}

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  headline?: string | null;
  description?: string | null;
  type?: string | null;
  industry?: string[];
  location?: string | null;
  websiteUrl?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
  email?: string | null;
  isVerified?: boolean;
  grants?: OrgGrant[];
  profiles?: OrgProfile[];
  _count?: {
    grants: number;
    members: number;
    bounties: number;
  };
}

async function getOrganization(slug: string): Promise<OrgDetail | null> {
  try {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${slug}/public`,
      {
        next: { revalidate: 300 },
        cache: "force-cache",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.organization || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    return createDetailMetadata({
      title: "Organization Not Found",
      description: "This organization does not exist on Opentribe.",
      path: `/organizations/${slug}`,
    });
  }

  const title = clampTitle(`${org.name} | Opentribe Organizations`);
  const description = clampDescription(
    org.headline ||
      org.description ||
      `Explore ${org.name} on Opentribe - grants, bounties, and opportunities in the Polkadot ecosystem.`
  );

  return createDetailMetadata({
    title,
    description,
    path: `/organizations/${slug}`,
    keywords: [
      "polkadot",
      "organization",
      org.name,
      ...(org.industry || []),
    ],
  });
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-green-500/20 text-green-400 border-0";
    case "PAUSED":
      return "bg-yellow-500/20 text-yellow-400 border-0";
    case "CLOSED":
      return "bg-red-500/20 text-red-400 border-0";
    default:
      return "bg-white/10 text-white/60 border-0";
  }
};

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

export default async function OrganizationDetailPage({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="items-start justify-between md:flex">
              <div className="items-start gap-6 md:flex">
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                  {org.logo ? (
                    <Image
                      alt={org.name}
                      className="object-cover"
                      fill
                      src={org.logo}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Org Info */}
                <div>
                  <div className="mt-2 mb-2 flex items-center gap-3 md:mt-0">
                    <h1 className="font-bold font-heading text-2xl sm:text-3xl">
                      {org.name}
                    </h1>
                    {org.isVerified && (
                      <Badge className="border-0 bg-blue-500/20 text-blue-400">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 text-white/60 md:flex-row md:items-center">
                    {org.type && (
                      <Badge className={getTypeBadgeColor(org.type)}>
                        {formatTypeLabel(org.type)}
                      </Badge>
                    )}
                    {org.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {org.location}
                      </span>
                    )}
                    {org.industry && org.industry.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {org.industry[0]}
                      </span>
                    )}
                  </div>
                  {org.headline && (
                    <p className="mt-3 max-w-2xl text-white/70">
                      {org.headline}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {org._count && (
                <div className="mt-4 flex gap-4 md:mt-0">
                  <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                    <p className="font-bold text-lg text-white">
                      {org._count.grants}
                    </p>
                    <p className="text-white/50 text-xs">Grants</p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                    <p className="font-bold text-lg text-white">
                      {org._count.bounties}
                    </p>
                    <p className="text-white/50 text-xs">Bounties</p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                    <p className="font-bold text-lg text-white">
                      {org._count.members}
                    </p>
                    <p className="text-white/50 text-xs">Members</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            {org.description && (
              <section>
                <h2 className="mb-4 font-bold font-heading text-2xl">About</h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <p className="whitespace-pre-wrap text-white/80">
                    {org.description}
                  </p>
                </div>
              </section>
            )}

            {/* Grants */}
            <section>
              <h2 className="mb-4 font-bold font-heading text-2xl">Grants</h2>
              {org.grants && org.grants.length > 0 ? (
                <div className="space-y-4">
                  {org.grants.map((grant) => (
                    <Link
                      className="block"
                      href={`/grants/${grant.slug || grant.id}`}
                      key={grant.id}
                    >
                      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 font-semibold text-lg text-white">
                              {grant.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-white/50">
                              {grant.token && (
                                <span>
                                  {grant.minAmount && grant.maxAmount
                                    ? `${grant.minAmount} - ${grant.maxAmount} ${grant.token}`
                                    : grant.maxAmount
                                      ? `Up to ${grant.maxAmount} ${grant.token}`
                                      : grant.token}
                                </span>
                              )}
                              <span>
                                {grant.applicationCount ?? grant._count?.applications ?? 0} application
                                {(grant.applicationCount ?? grant._count?.applications ?? 0) !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(grant.status)}>
                            {grant.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                  <p className="text-white/60">No grants listed yet</p>
                </div>
              )}
            </section>

            {/* Team / Profiles */}
            {org.profiles && org.profiles.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold font-heading text-2xl">Team</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {org.profiles.map((profile) => (
                    <Link
                      className="block"
                      href={`/profile/${profile.slug}`}
                      key={profile.id}
                    >
                      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                        {profile.image ? (
                          <Image
                            alt={profile.displayName}
                            className="h-12 w-12 rounded-full"
                            height={48}
                            src={profile.image}
                            width={48}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                            {profile.displayName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {profile.displayName}
                          </p>
                          {profile.role && (
                            <p className="text-sm text-white/50">
                              {profile.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Links Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-medium text-sm text-white/60">Links</h3>
              <div className="space-y-3">
                {org.websiteUrl && (
                  <a
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                    href={org.websiteUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="truncate text-sm">
                      {org.websiteUrl.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0 text-white/40" />
                  </a>
                )}
                {org.twitter && (
                  <a
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                    href={
                      org.twitter.startsWith("http")
                        ? org.twitter
                        : `https://twitter.com/${org.twitter}`
                    }
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">Twitter</span>
                    <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0 text-white/40" />
                  </a>
                )}
                {org.github && (
                  <a
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                    href={
                      org.github.startsWith("http")
                        ? org.github
                        : `https://github.com/${org.github}`
                    }
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">GitHub</span>
                    <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0 text-white/40" />
                  </a>
                )}
                {org.linkedin && (
                  <a
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                    href={
                      org.linkedin.startsWith("http")
                        ? org.linkedin
                        : `https://linkedin.com/company/${org.linkedin}`
                    }
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                    <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0 text-white/40" />
                  </a>
                )}
                {org.email && (
                  <a
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                    href={`mailto:${org.email}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate text-sm">{org.email}</span>
                  </a>
                )}
                {!org.websiteUrl &&
                  !org.twitter &&
                  !org.github &&
                  !org.linkedin &&
                  !org.email && (
                    <p className="text-sm text-white/40">
                      No links available
                    </p>
                  )}
              </div>
            </div>

            {/* Industry Tags */}
            {org.industry && org.industry.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-medium text-sm text-white/60">
                  Industry
                </h3>
                <div className="flex flex-wrap gap-2">
                  {org.industry.map((ind) => (
                    <Badge
                      className="border-0 bg-white/10 text-white/80"
                      key={ind}
                      variant="secondary"
                    >
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
