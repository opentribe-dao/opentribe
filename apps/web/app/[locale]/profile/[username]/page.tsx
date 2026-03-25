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
        next: { revalidate: 60 },
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

  const userData = profile.type === "user" ? (profile.data.user || profile.data) : null;
  const name =
    profile.type === "user"
      ? userData?.name || "Unknown"
      : profile.data.displayName;
  const bio =
    profile.type === "user"
      ? userData?.headline || userData?.bio
      : profile.data.bio;
  const skills =
    profile.type === "user"
      ? userData?.skills
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
    // Map API contribution shape to component's expected shape
    const mappedProfile = {
      ...profile.data,
      contributions: (profile.data.contributions || []).map((c: any) => ({
        id: c.id,
        title: c.grantApplication?.title || "Unknown",
        role: c.role,
        status: c.grantApplication?.status || "PENDING",
        milestoneCount: c.grantApplication?.milestones?.length || 0,
        completedMilestones: (c.grantApplication?.milestones || []).filter(
          (m: any) => m.status === "ACCEPTED" || m.status === "COMPLETED"
        ).length,
        grant: c.grantApplication?.grant
          ? {
              id: c.grantApplication.grant.id,
              slug: c.grantApplication.grant.slug,
              title: c.grantApplication.grant.title,
            }
          : undefined,
      })),
    };
    return <EcosystemProfile profile={mappedProfile} />;
  }

  // API returns user data directly in profile.data (no .user wrapper)
  const userData = profile.data.user || profile.data;
  const stats = profile.data.stats || {};
  return (
    <UserProfile profile={userData} stats={stats} />
  );
}
