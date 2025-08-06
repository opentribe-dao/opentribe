import { database } from '@packages/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'OPEN';

    const rfps = await database.rFP.findMany({
      where: {
        status: status as any,
        visibility: 'PUBLISHED',
      },
      include: {
        grant: {
          include: {
            organization: {
              select: {
                name: true,
                logo: true,
              },
            },
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
      { rfps },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFPs' },
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