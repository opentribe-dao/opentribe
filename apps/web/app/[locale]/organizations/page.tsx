import { createSiteMetadata } from "@packages/seo/meta";
import type { Metadata } from "next";
import { env } from "@/env";
import { OrganizationsDirectory } from "./components/organizations-directory";

export const metadata: Metadata = createSiteMetadata({
  title: "Organizations",
  description:
    "Explore organizations building in the Polkadot ecosystem. Find DAOs, foundations, companies, and curator groups funding grants and bounties.",
  path: "/organizations",
  keywords: [
    "polkadot",
    "organizations",
    "dao",
    "foundation",
    "grants",
    "bounties",
    "web3",
    "kusama",
  ],
});

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

interface OrganizationsResponse {
  organizations: OrgListItem[];
  total: number;
  page: number;
  pageSize: number;
}

async function getOrganizations(
  search?: string,
  type?: string
): Promise<OrganizationsResponse | null> {
  try {
    const url = new URL(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations`
    );
    if (search) url.searchParams.set("search", search);
    if (type && type !== "all") url.searchParams.set("type", type);
    url.searchParams.set("pageSize", "50");

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string }>;
}) {
  const { search, type } = await searchParams;
  const data = await getOrganizations(search, type);

  return (
    <OrganizationsDirectory
      initialOrganizations={data?.organizations || []}
      initialTotal={data?.total || 0}
      initialSearch={search || ""}
      initialType={type || "all"}
    />
  );
}
