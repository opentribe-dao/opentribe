import { auth } from '@packages/auth/server';
import { database } from '@packages/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for bounty creation
const createBountySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  skills: z.array(z.string()).min(1),
  amount: z.number().positive(),
  token: z.string().default('DOT'),
  split: z.enum(['FIXED', 'EQUAL_SPLIT', 'VARIABLE']).default('FIXED'),
  winnings: z.record(z.string(), z.number()), // { "1": 500, "2": 300, "3": 200 }
  deadline: z.string().datetime(),
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
  visibility: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  organizationId: z.string(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'OPEN';

    const bounties = await database.bounty.findMany({
      where: {
        status: status as any,
        visibility: 'PUBLISHED',
      },
      include: {
        organization: {
          select: {
            name: true,
            logo: true,
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
      { bounties },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounties' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// POST /api/v1/bounties - Create bounty
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
    const validatedData = createBountySchema.parse(body);

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        role: {
          in: ['owner', 'admin'], // Only owners and admins can create bounties
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to create bounties for this organization' },
        { status: 403 }
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
    while (await database.bounty.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the bounty
    const bounty = await database.bounty.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        skills: validatedData.skills,
        amount: validatedData.amount,
        token: validatedData.token,
        split: validatedData.split,
        winnings: validatedData.winnings,
        deadline: new Date(validatedData.deadline),
        resources: validatedData.resources || undefined,
        screening: validatedData.screening || undefined,
        visibility: validatedData.visibility,
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
        bounty,
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
    console.error('Bounty creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create bounty' },
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