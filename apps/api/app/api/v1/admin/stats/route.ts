import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { database } from "@packages/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const [
      totalUsers,
      totalOrganizations,
      totalGrants,
      totalBounties,
      totalEcosystemProfiles,
      pendingClaims,
      totalImportJobs,
    ] = await Promise.all([
      database.user.count(),
      database.organization.count(),
      database.grant.count(),
      database.bounty.count(),
      database.ecosystemProfile.count(),
      database.claimRequest.count({ where: { status: "PENDING" } }),
      database.importJob.count(),
    ]);

    return NextResponse.json({
      data: {
        totalUsers,
        totalOrganizations,
        totalGrants,
        totalBounties,
        totalEcosystemProfiles,
        pendingClaims,
        totalImportJobs,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
