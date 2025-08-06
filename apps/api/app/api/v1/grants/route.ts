import { auth } from '@packages/auth/server';
import { database } from '@packages/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for grant creation
const createGrantSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  skills: z.array(z.string()).default([]),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  totalFunds: z.number().positive().optional(),
  token: z.string().default('DOT'),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
  })).optional(),
  screening: z.array(z.object({
    question: z.string(),
    type: z.enum(['text', 'url', 'file']),
    optional: z.boolean(),
  })).optional(),
  applicationUrl: z.string().url().optional(),
  visibility: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  source: z.enum(['NATIVE', 'EXTERNAL']).default('NATIVE'),
  organizationId: z.string(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'OPEN';
    const source = searchParams.get('source') || 'ALL';

    const whereClause: any = {
      status: status as any,
      visibility: 'PUBLISHED',
    };

    if (source !== 'ALL') {
      whereClause.source = source;
    }

    const grants = await database.grant.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            location: true,
            industry: true,
          },
        },
        _count: {
          select: {
            applications: true,
            rfps: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        publishedAt: 'desc',
      },
    });

    return NextResponse.json(
      { grants },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grants' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// POST /api/v1/grants - Create grant
export async function POST(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGrantSchema.parse(body);

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        role: {
          in: ['owner', 'admin'], // Only owners and admins can create grants
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to create grants for this organization' },
        { status: 403 }
      );
    }

    // Validate amount logic
    if (validatedData.minAmount && validatedData.maxAmount && validatedData.minAmount > validatedData.maxAmount) {
      return NextResponse.json(
        { error: 'Minimum amount cannot be greater than maximum amount' },
        { status: 400 }
      );
    }

    // Generate a unique slug from the title
    let baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and append number if needed
    while (await database.grant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the grant
    const grant = await database.grant.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        summary: validatedData.summary,
        instructions: validatedData.instructions,
        logoUrl: validatedData.logoUrl,
        bannerUrl: validatedData.bannerUrl,
        skills: validatedData.skills,
        minAmount: validatedData.minAmount,
        maxAmount: validatedData.maxAmount,
        totalFunds: validatedData.totalFunds,
        token: validatedData.token,
        resources: validatedData.resources || undefined,
        screening: validatedData.screening || undefined,
        applicationUrl: validatedData.applicationUrl,
        visibility: validatedData.visibility,
        source: validatedData.source,
        status: 'OPEN',
        organizationId: validatedData.organizationId,
        publishedAt: validatedData.visibility === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        success: true,
        grant,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Grant creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create grant' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}