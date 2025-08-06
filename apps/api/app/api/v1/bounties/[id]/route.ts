import { auth } from '@packages/auth/server';
import { database } from '@packages/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for bounty update
const updateBountySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  amount: z.number().positive().optional(),
  token: z.string().optional(),
  split: z.enum(['FIXED', 'EQUAL_SPLIT', 'VARIABLE']).optional(),
  winnings: z.record(z.string(), z.number()).optional(),
  deadline: z.string().datetime().optional(),
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
  visibility: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  status: z.enum(['OPEN', 'REVIEWING', 'COMPLETED', 'CLOSED', 'CANCELLED']).optional(),
});

// GET /api/v1/bounties/[id] - Get bounty details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bountyId = (await params).id;

    // Try to find by ID first, then by slug
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyId },
          { slug: bountyId }
        ]
      },
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
            submissions: true,
            comments: true,
          },
        },
        submissions: {
          where: {
            status: {
              in: ['SUBMITTED', 'APPROVED', 'REJECTED'], // Show all reviewed submissions, not drafts
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            submissionUrl: true,
            position: true,
            winningAmount: true,
            isWinner: true,
            createdAt: true,
            responses: true, // Include screening question responses
            status: true,
            likesCount: true,
            submitter: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [
            { isWinner: 'desc' }, // Winners first
            { position: 'asc' },  // Then by position
            { createdAt: 'desc' }, // Then by creation date
          ],
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          where: {
            parentId: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Show all submissions after winners have been announced
    // Before winners are announced, submissions are private
    if (!bounty.winnersAnnouncedAt) {
      // If winners haven't been announced, don't show any submissions publicly
      bounty.submissions = [];
    }
    // If winners have been announced, all submissions are already included from the query

    return NextResponse.json(
      { bounty },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounty' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// PATCH /api/v1/bounties/[id] - Update bounty
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const bountyId = (await params).id;

    // Get the bounty and check permissions
    // Try to find by ID first, then by slug
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyId },
          { slug: bountyId }
        ]
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ['owner', 'admin'],
                },
              },
            },
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    if (bounty.organization.members.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to update this bounty' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBountySchema.parse(body);

    // Prepare update data
    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.skills !== undefined) updateData.skills = validatedData.skills;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.token !== undefined) updateData.token = validatedData.token;
    if (validatedData.split !== undefined) updateData.split = validatedData.split;
    if (validatedData.winnings !== undefined) updateData.winnings = validatedData.winnings;
    if (validatedData.deadline !== undefined) updateData.deadline = new Date(validatedData.deadline);
    if (validatedData.resources !== undefined) updateData.resources = validatedData.resources;
    if (validatedData.screening !== undefined) updateData.screening = validatedData.screening;
    if (validatedData.visibility !== undefined) {
      updateData.visibility = validatedData.visibility;
      // Update publishedAt if changing from DRAFT to PUBLISHED
      if (bounty.visibility === 'DRAFT' && validatedData.visibility === 'PUBLISHED' && !bounty.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    // Update the bounty
    const updatedBounty = await database.bounty.update({
      where: { id: bountyId },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        success: true,
        bounty: updatedBounty,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Bounty update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update bounty' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/bounties/[id] - Delete bounty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const bountyId = (await params).id;

    // Get the bounty and check permissions
    // Try to find by ID first, then by slug
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyId },
          { slug: bountyId }
        ]
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ['owner', 'admin'],
                },
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    if (bounty.organization.members.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this bounty' },
        { status: 403 }
      );
    }

    // Don't allow deletion if there are submissions
    if (bounty._count.submissions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a bounty with submissions' },
        { status: 400 }
      );
    }

    // Delete the bounty
    await database.bounty.delete({
      where: { id: bountyId },
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Bounty deleted successfully',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Bounty deletion error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete bounty' },
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
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}