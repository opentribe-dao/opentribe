import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createGrantSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  organizationId: z.string().min(1),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  token: z.string().optional(),
  skills: z.array(z.string()).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  totalFunds: z.number().optional(),
  status: z.enum(["OPEN", "PAUSED", "CLOSED"]).optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  source: z.enum(["NATIVE", "EXTERNAL"]).optional(),
  fundingSource: z.enum(["SELF_FUNDED", "TREASURY"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const visibility = searchParams.get("visibility") || "";
    const fundingSource = searchParams.get("fundingSource") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (source && source !== "all") {
      where.source = source;
    }

    if (visibility && visibility !== "all") {
      where.visibility = visibility;
    }

    if (fundingSource && fundingSource !== "all") {
      where.fundingSource = fundingSource;
    }

    const [grants, total] = await Promise.all([
      database.grant.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          _count: {
            select: { applications: true, rfps: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.grant.count({ where }),
    ]);

    return NextResponse.json({
      data: grants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin grants list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const validated = createGrantSchema.parse(body);

    // Generate slug
    const baseSlug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await database.grant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const grant = await database.grant.create({
      data: {
        title: validated.title,
        slug,
        description: validated.description,
        organizationId: validated.organizationId,
        summary: validated.summary,
        instructions: validated.instructions,
        token: validated.token || "DOT",
        skills: validated.skills || [],
        minAmount: validated.minAmount,
        maxAmount: validated.maxAmount,
        totalFunds: validated.totalFunds,
        status: validated.status || "OPEN",
        visibility: validated.visibility || "DRAFT",
        source: validated.source || "NATIVE",
        fundingSource: validated.fundingSource || "SELF_FUNDED",
      },
    });

    return NextResponse.json({ data: grant }, { status: 201 });
  } catch (error) {
    console.error("Admin grant create error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create grant" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
