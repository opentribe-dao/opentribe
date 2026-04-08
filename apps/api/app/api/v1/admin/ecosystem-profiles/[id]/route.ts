import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  telegram: z.string().optional(),
  walletAddresses: z.array(z.string()).optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  source: z
    .enum([
      "W3F_GRANTS",
      "POLKADOT_OPEN_SOURCE",
      "FAST_GRANTS",
      "ON_CHAIN_BOUNTY",
      "HACKATHON",
      "PBA",
      "FELLOWSHIP",
      "MANUAL_ADMIN",
    ])
    .optional(),
  contactable: z.boolean().optional(),
  outreachStatus: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const profile = await database.ecosystemProfile.findUnique({
      where: { id },
      include: {
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
                  select: { id: true, title: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        claimRequests: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Ecosystem profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("Admin ecosystem profile detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ecosystem profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const profile = await database.ecosystemProfile.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("Admin ecosystem profile update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update ecosystem profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    await database.ecosystemProfile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin ecosystem profile delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete ecosystem profile" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
