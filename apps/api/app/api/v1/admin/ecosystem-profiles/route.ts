import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createProfileSchema = z.object({
  displayName: z.string().min(1),
  slug: z.string().min(1).optional(),
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
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const claimed = searchParams.get("claimed") || "";
    const contactable = searchParams.get("contactable") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { github: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (source && source !== "all") {
      where.source = source;
    }

    if (claimed === "true") {
      where.claimedByUserId = { not: null };
    } else if (claimed === "false") {
      where.claimedByUserId = null;
    }

    if (contactable === "true") {
      where.contactable = true;
    } else if (contactable === "false") {
      where.contactable = false;
    }

    const [profiles, total] = await Promise.all([
      database.ecosystemProfile.findMany({
        where,
        include: {
          claimedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { contributions: true, claimRequests: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.ecosystemProfile.count({ where }),
    ]);

    return NextResponse.json({
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin ecosystem profiles list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ecosystem profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const validated = createProfileSchema.parse(body);

    // Generate slug
    let slug = validated.slug;
    if (!slug) {
      const baseSlug = validated.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      slug = baseSlug;
      let counter = 1;
      while (
        await database.ecosystemProfile.findUnique({ where: { slug } })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const profile = await database.ecosystemProfile.create({
      data: {
        displayName: validated.displayName,
        slug,
        email: validated.email,
        github: validated.github,
        twitter: validated.twitter,
        linkedin: validated.linkedin,
        website: validated.website,
        telegram: validated.telegram,
        walletAddresses: validated.walletAddresses || [],
        bio: validated.bio,
        skills: validated.skills || [],
        location: validated.location,
        source: validated.source || "MANUAL_ADMIN",
        contactable: validated.contactable ?? false,
      },
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) {
    console.error("Admin ecosystem profile create error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create ecosystem profile" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
