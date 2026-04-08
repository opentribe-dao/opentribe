import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  orgType: z.enum(["COMPANY", "DAO", "FOUNDATION", "CURATOR_GROUP"]).optional(),
  visibility: z.enum(["ACTIVE", "UNDER_REVIEW", "ARCHIVED", "VERIFIED"]).optional(),
  managedByPlatform: z.boolean().optional(),
  websiteUrl: z.string().optional(),
  email: z.string().optional(),
  logo: z.string().optional(),
  location: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const orgType = searchParams.get("orgType") || "";
    const visibility = searchParams.get("visibility") || "";
    const managed = searchParams.get("managed") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (orgType && orgType !== "all") {
      where.orgType = orgType;
    }

    if (visibility && visibility !== "all") {
      where.visibility = visibility;
    }

    if (managed === "true") {
      where.managedByPlatform = true;
    } else if (managed === "false") {
      where.managedByPlatform = false;
    }

    const [organizations, total] = await Promise.all([
      database.organization.findMany({
        where,
        include: {
          members: {
            select: {
              id: true,
              role: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            take: 5,
          },
          _count: {
            select: {
              bounties: true,
              grants: true,
              members: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.organization.count({ where }),
    ]);

    return NextResponse.json({
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin organizations list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const validated = createOrgSchema.parse(body);

    // Generate slug from name if not provided
    let slug = validated.slug;
    if (!slug) {
      const baseSlug = validated.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      slug = baseSlug;
      let counter = 1;
      while (await database.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const organization = await database.organization.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        orgType: validated.orgType || "COMPANY",
        visibility: validated.visibility || "ACTIVE",
        managedByPlatform: validated.managedByPlatform ?? true,
        websiteUrl: validated.websiteUrl,
        email: validated.email,
        logo: validated.logo,
        location: validated.location,
        twitter: validated.twitter,
        github: validated.github,
        linkedin: validated.linkedin,
      },
    });

    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error) {
    console.error("Admin organization create error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
