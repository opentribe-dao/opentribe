import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// GET /api/v1/organizations/[organizationId]/public - Get public organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    const organization = await database.organization.findFirst({
      where: {
        OR: [
          { slug: { equals: organizationId, mode: "insensitive" } },
          { id: organizationId },
        ],
        visibility: {
          in: ["ACTIVE", "VERIFIED"],
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        headline: true,
        description: true,
        industry: true,
        twitter: true,
        github: true,
        linkedin: true,
        location: true,
        websiteUrl: true,
        email: true,
        visibility: true,
        isVerified: true,
        orgType: true,
        createdAt: true,
        grants: {
          where: {
            visibility: "PUBLISHED",
          },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            status: true,
            token: true,
            minAmount: true,
            maxAmount: true,
            totalFunds: true,
            skills: true,
            applicationCount: true,
            rfpCount: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get ecosystem profiles linked as curators for this org's grants
    const grantIds = organization.grants.map((g) => g.id);

    let ecosystemCurators: any[] = [];
    let ecosystemContributors: any[] = [];

    if (grantIds.length > 0) {
      // Find curators linked via ecosystem profiles
      const curators = await database.curator.findMany({
        where: {
          grantId: { in: grantIds },
          ecosystemProfileId: { not: null },
        },
        include: {
          ecosystemProfile: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              github: true,
              twitter: true,
              bio: true,
              skills: true,
              location: true,
            },
          },
        },
      });

      // Deduplicate by ecosystem profile id
      const curatorProfileMap = new Map<string, any>();
      for (const c of curators) {
        if (c.ecosystemProfile && !curatorProfileMap.has(c.ecosystemProfile.id)) {
          curatorProfileMap.set(c.ecosystemProfile.id, c.ecosystemProfile);
        }
      }
      ecosystemCurators = Array.from(curatorProfileMap.values());

      // Find contributors linked via ecosystem contributions
      const contributions = await database.ecosystemContribution.findMany({
        where: {
          grantApplication: {
            grantId: { in: grantIds },
          },
        },
        include: {
          ecosystemProfile: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              github: true,
              twitter: true,
              bio: true,
              skills: true,
              location: true,
            },
          },
        },
      });

      // Deduplicate by ecosystem profile id
      const contributorProfileMap = new Map<string, any>();
      for (const c of contributions) {
        if (c.ecosystemProfile && !contributorProfileMap.has(c.ecosystemProfile.id)) {
          contributorProfileMap.set(c.ecosystemProfile.id, c.ecosystemProfile);
        }
      }
      ecosystemContributors = Array.from(contributorProfileMap.values());
    }

    return NextResponse.json({
      organization: {
        ...organization,
        grants: organization.grants.map((grant) => ({
          ...grant,
          minAmount: grant.minAmount
            ? Number.parseFloat(grant.minAmount.toString())
            : null,
          maxAmount: grant.maxAmount
            ? Number.parseFloat(grant.maxAmount.toString())
            : null,
          totalFunds: grant.totalFunds
            ? Number.parseFloat(grant.totalFunds.toString())
            : null,
        })),
      },
      ecosystemCurators,
      ecosystemContributors,
    });
  } catch (error) {
    console.error("Error fetching public organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
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
