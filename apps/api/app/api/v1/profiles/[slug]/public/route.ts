import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// GET /api/v1/profiles/[slug]/public - Resolve a profile by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Try to find a User by username
    const user = await database.user.findFirst({
      where: {
        username: {
          equals: slug,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        firstName: true,
        lastName: true,
        image: true,
        headline: true,
        bio: true,
        interests: true,
        location: true,
        skills: true,
        twitter: true,
        discord: true,
        github: true,
        linkedin: true,
        website: true,
        telegram: true,
        employer: true,
        workExperience: true,
        cryptoExperience: true,
        workPreference: true,
        private: true,
        createdAt: true,
      },
    });

    if (user) {
      // If profile is private, return limited data
      if (user.private) {
        return NextResponse.json({
          type: "user",
          data: {
            id: user.id,
            username: user.username,
            private: true,
          },
        });
      }

      // Check if there's an unclaimed EcosystemProfile with the same slug
      const matchingEcosystemProfile = await database.ecosystemProfile.findFirst({
        where: {
          slug: { equals: slug, mode: "insensitive" },
          claimedByUserId: null,
        },
        select: {
          id: true,
          slug: true,
          displayName: true,
          github: true,
          githubAccountId: true,
          source: true,
        },
      });

      // Fetch claimed ecosystem profiles and their contributions
      const claimedProfiles = await database.ecosystemProfile.findMany({
        where: { claimedByUserId: user.id },
        select: {
          id: true,
          slug: true,
          displayName: true,
          source: true,
          contributions: {
            include: {
              grantApplication: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  grant: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                  grantMilestones: {
                    select: {
                      id: true,
                      number: true,
                      title: true,
                      status: true,
                    },
                    orderBy: { number: "asc" as const },
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        type: "user",
        data: {
          ...user,
          claimableProfile: matchingEcosystemProfile || undefined,
          claimedProfiles: claimedProfiles.length > 0 ? claimedProfiles : undefined,
        },
      });
    }

    // 2. Try to find an EcosystemProfile by slug, or by ID if slug looks like a cuid
    const isCuid = /^c[a-z0-9]{24}$/.test(slug);
    const ecosystemProfile = await database.ecosystemProfile.findFirst({
      where: isCuid
        ? { OR: [{ id: slug }, { slug: { equals: slug, mode: "insensitive" } }] }
        : { slug: { equals: slug, mode: "insensitive" } },
      include: {
        claimedBy: {
          select: {
            id: true,
            username: true,
          },
        },
        contributions: {
          include: {
            grantApplication: {
              select: {
                id: true,
                title: true,
                status: true,
                grant: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
                grantMilestones: {
                  select: {
                    id: true,
                    number: true,
                    title: true,
                    description: true,
                    status: true,
                    amount: true,
                    amountUSD: true,
                    token: true,
                    deliveryUrl: true,
                    evaluationUrl: true,
                    evaluationResult: true,
                    evaluatorName: true,
                    paymentStatus: true,
                    submittedAt: true,
                    reviewedAt: true,
                  },
                  orderBy: {
                    number: "asc",
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!ecosystemProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // If claimed AND the linked user has a username, redirect
    if (
      ecosystemProfile.claimedByUserId &&
      ecosystemProfile.claimedBy?.username
    ) {
      return NextResponse.json({
        type: "redirect",
        data: {
          slug: ecosystemProfile.claimedBy.username,
        },
      });
    }

    // Unclaimed OR claimed user has no username — return ecosystem profile
    const { claimedBy, ...profileFields } = ecosystemProfile;

    // Transform contributions to a cleaner shape
    const contributions = ecosystemProfile.contributions.map((c) => ({
      id: c.id,
      role: c.role,
      createdAt: c.createdAt,
      grantApplication: c.grantApplication
        ? {
            id: c.grantApplication.id,
            title: c.grantApplication.title,
            status: c.grantApplication.status,
            grant: c.grantApplication.grant
              ? {
                  id: c.grantApplication.grant.id,
                  title: c.grantApplication.grant.title,
                  slug: c.grantApplication.grant.slug,
                }
              : null,
            milestones: c.grantApplication.grantMilestones,
          }
        : null,
    }));

    return NextResponse.json({
      type: "ecosystem",
      data: {
        id: profileFields.id,
        displayName: profileFields.displayName,
        slug: profileFields.slug,
        email: profileFields.email,
        github: profileFields.github,
        twitter: profileFields.twitter,
        linkedin: profileFields.linkedin,
        website: profileFields.website,
        telegram: profileFields.telegram,
        walletAddresses: profileFields.walletAddresses,
        onChainName: profileFields.onChainName,
        onChainVerified: profileFields.onChainVerified,
        bio: profileFields.bio,
        skills: profileFields.skills,
        location: profileFields.location,
        source: profileFields.source,
        claimStatus: profileFields.claimedByUserId ? "claimed" : "unclaimed",
        createdAt: profileFields.createdAt,
        updatedAt: profileFields.updatedAt,
        contributions,
      },
    });
  } catch (error) {
    console.error("Error resolving profile:", error);
    return NextResponse.json(
      { error: "Failed to resolve profile" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
