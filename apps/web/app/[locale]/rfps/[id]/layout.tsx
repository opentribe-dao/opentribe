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

async function getRfp(id: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/rfps/${id}`, {
    next: { revalidate: 3600 },
    cache: "force-cache",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.rfp as Rfp | null;
}

type Props = { params: Promise<{ id: string }> };

type Rfp = {
  title?: string;
  organization?: { name?: string };
  summary?: string | null;
  deadline?: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rfp = await getRfp(id);

  const titleBase = rfp?.title ?? "RFP";
  const orgName = rfp?.organization?.name ?? "Opentribe";
  // Title: "{title} | Opentribe RFPs"
  const title = clampTitle(`${titleBase} | Opentribe RFPs`);

  // Description: "{org} is inviting proposals for “{title}”. Apply with this RFP on Open."
  const description = clampDescription(
    `${orgName} is inviting proposals for “${titleBase}”. Apply with this RFP on Opentribe.`
  );

  const path = `/rfps/${id}`;
  const image = `/api/og/rfps/${id}`;
  return createDetailMetadata({ title, description, path, image });
}

export default async function RfpLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "RFPs", path: "/rfps" },
    { name: "RFP Details", path: `/rfps/${id}` },
  ]);

  return (
    <>
      <JsonLd code={breadcrumbSchema} />
      {children}
    </>
  );
}
