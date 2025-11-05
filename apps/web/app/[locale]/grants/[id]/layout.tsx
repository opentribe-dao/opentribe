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

async function getGrant(id: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`, {
    next: { revalidate: 3600 },
    cache: "force-cache",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.grant as Grant | null;
}

type Props = { params: Promise<{ id: string }> };

type Grant = {
  title?: string;
  organization?: { name?: string };
  summary?: string | null;
  deadline?: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const grant = await getGrant(id);

  const titleBase = grant?.title ?? "Grant";
  const orgName = grant?.organization?.name ?? "Opentribe";
  // Title: "{title} | Opentribe Grants"
  const title = clampTitle(`${titleBase} | Opentribe Grants`);

  // Description: "{org} is accepting grant applications for “{title}”. Apply on Opentribe."
  const description = clampDescription(
    `${orgName} is accepting grant applications for “${titleBase}”. Apply on Opentribe.`
  );

  const path = `/grants/${id}`;
  const image = `/api/og/grants/${id}`;
  return createDetailMetadata({ title, description, path, image });
}

export default async function GrantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Grants", path: "/grants" },
    { name: "Grant Details", path: `/grants/${id}` },
  ]);

  return (
    <>
      <JsonLd code={breadcrumbSchema} />
      {children}
    </>
  );
}
