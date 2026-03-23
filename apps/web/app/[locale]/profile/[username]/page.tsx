import {
  clampDescription,
  clampTitle,
  createDetailMetadata,
} from "@packages/seo/meta";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { env } from "@/env";
import { EcosystemProfile } from "./components/ecosystem-profile";
import { UserProfile } from "./components/user-profile";

type Props = {
  params: Promise<{ username: string }>;
};

type ProfileResponse =
  | {
      type: "user";
      data: {
        user: any;
        stats: any;
      };
    }
  | {
      type: "ecosystem";
      data: any;
    }
  | {
      type: "redirect";
      data: {
        slug: string;
      };
    };

async function getProfile(slug: string): Promise<ProfileResponse | null> {
  try {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/profiles/${slug}/public`,
      {
        next: { revalidate: 300 },
        cache: "force-cache",
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return createDetailMetadata({
      title: "Profile Not Found",
      description: "This profile does not exist on Opentribe.",
      path: `/profile/${username}`,
    });
  }

  if (profile.type === "redirect") {
    return {};
  }

  const name =
    profile.type === "user"
      ? profile.data.user.name
      : profile.data.displayName;
  const bio =
    profile.type === "user"
      ? profile.data.user.headline || profile.data.user.bio
      : profile.data.bio;
  const skills =
    profile.type === "user"
      ? profile.data.user.skills
      : profile.data.skills;

  const title = clampTitle(`${name} | Opentribe Profile`);
  const description = clampDescription(
    bio || `View ${name}'s profile on Opentribe - the talent marketplace for the Polkadot ecosystem.`
  );

  return createDetailMetadata({
    title,
    description,
    path: `/profile/${username}`,
    image: `/api/og/profile/${username}`,
    keywords: [
      "polkadot",
      "profile",
      name,
      ...(skills || []).slice(0, 5),
    ],
  });
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  if (profile.type === "redirect") {
    redirect(`/profile/${profile.data.slug}`);
  }

  if (profile.type === "ecosystem") {
    return <EcosystemProfile profile={profile.data} />;
  }

  return (
    <UserProfile profile={profile.data.user} stats={profile.data.stats} />
  );
}
