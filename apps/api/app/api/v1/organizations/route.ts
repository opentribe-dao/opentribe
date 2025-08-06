import { auth } from '@packages/auth/server';
import { database } from '@packages/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOnboardingCompleteEmail } from '@packages/email';

// Schema for organization creation
const createOrganizationSchema = z.object({
  userProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    location: z.string(),
    walletAddress: z.string(),
    website: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    profileCompleted: z.boolean(),
  }),
  organization: z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    website: z.string(),
    logo: z.string().optional(),
    location: z.string(),
    industry: z.string(),
  }),
  teamMembers: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'member']),
  })).optional(),
});

// POST /api/v1/organizations - Create organization
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

    // For MVP, allow any authenticated user to create an organization
    // Later we can add more restrictions based on subscription tiers or roles

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Check if this is the first time completing profile
    const isFirstCompletion = !session.user.profileCompleted;

    // Start a transaction
    const result = await database.$transaction(async (tx) => {
      // 1. Update user profile
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          ...validatedData.userProfile,
          name: `${validatedData.userProfile.firstName} ${validatedData.userProfile.lastName}`,
        },
      });

      // 2. Generate a unique slug from the organization name
      let baseSlug = validatedData.organization.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and append number if needed
      while (await tx.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 3. Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organization.name,
          slug,
          description: validatedData.organization.description,
          websiteUrl: validatedData.organization.website,
          logo: validatedData.organization.logo,
          location: validatedData.organization.location,
          industry: [validatedData.organization.industry],
          metadata: JSON.stringify({
            type: validatedData.organization.type,
          }),
          visibility: 'ACTIVE',
          isVerified: false,
        },
      });

      // 4. Add user as owner of the organization
      await tx.member.create({
        data: {
          userId: session.user.id,
          organizationId: organization.id,
          role: 'owner',
        },
      });

      // 5. Create invitations for team members if provided
      if (validatedData.teamMembers && validatedData.teamMembers.length > 0) {
        await tx.invitation.createMany({
          data: validatedData.teamMembers.map(member => ({
            organizationId: organization.id,
            email: member.email,
            role: member.role,
            inviterId: session.user.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })),
        });
      }

      return { organization, user: updatedUser, isFirstCompletion };
    });

    // Send onboarding complete email if this is the first time completing profile
    if (result.isFirstCompletion) {
      try {
        await sendOnboardingCompleteEmail(
          {
            email: result.user.email,
            firstName: result.user.firstName || undefined,
            username: result.user.username || undefined,
          },
          'organization' // Organization onboarding
        );
      } catch (error) {
        console.error('Failed to send onboarding complete email:', error);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      organization: result.organization,
      user: result.user,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Organization creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// GET /api/v1/organizations - List organizations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      database.organization.findMany({
        where: { visibility: 'ACTIVE' },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      database.organization.count({ where: { visibility: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Organizations list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
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