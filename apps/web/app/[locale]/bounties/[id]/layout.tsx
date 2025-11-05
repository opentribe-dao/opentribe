import type { Metadata } from "next";
import {
  createDetailMetadata,
  clampDescription,
  clampTitle,
} from "@packages/seo/meta";
import { env } from "@/env";
import type { ReactNode } from "react";
import { createBreadcrumbSchema } from "@packages/seo/breadcrumbs";
import { JsonLd } from "@packages/seo/json-ld";

async function getBounty(id: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}`, {
    next: { revalidate: 3600 },
    cache: "force-cache",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.bounty as Bounty | null;
}

type Props = { params: Promise<{ id: string }> };

type Bounty = {
  title?: string;
  organization?: { name?: string };
  winnings?: Record<string, number> | string | undefined;
  token?: string;
  skills?: string[];
  deadline?: string | null;
  amount?: number | string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bounty = await getBounty(id);

  const titleBase = bounty?.title ?? "Bounty";
  const orgName = bounty?.organization?.name ?? "Opentribe";

  const totalPrize = (() => {
    try {
      const amountRaw = bounty?.amount;
      const token = bounty?.token || "DOT";
      const amount = amountRaw != null ? Number(amountRaw) : 0;
      if (!amount || Number.isNaN(amount)) return null;
      const short =
        amount >= 1000 ? `${Math.round(amount / 100) / 10}K` : `${amount}`;
      return `${short} ${token}`;
    } catch {
      return null;
    }
  })();

  // Title: "{title} | Opentribe Bounties"
  const title = clampTitle(`${titleBase} | Opentribe Bounties`);

  // Description: "{org} is seeking builders for “{title}”. Apply to this bounty on Opentribe."
  const description = clampDescription(
    `${orgName} is seeking builders for “${titleBase}”. Apply to this bounty on Opentribe.`
  );

  const path = `/bounties/${id}`;
  const image = `/api/og/bounties/${id}`;
  return createDetailMetadata({ title, description, path, image });
}

export default async function BountyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Bounties", path: "/bounties" },
    { name: "Bounty Details", path: `/bounties/${id}` },
  ]);

  return (
    <>
      <JsonLd code={breadcrumbSchema} />
      {children}
    </>
  );
}
