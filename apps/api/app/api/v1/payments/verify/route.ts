import { auth } from '@packages/auth/server';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PolkadotClient } from '@packages/polkadot';

// Schema for payment verification
const verifyPaymentSchema = z.object({
  extrinsicHash: z.string(),
  expectedTo: z.string(),
  expectedAmount: z.string(),
});

// POST /api/v1/payments/verify - Verify a payment on the blockchain
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
    const validatedData = verifyPaymentSchema.parse(body);

    // Development mode: Accept test transactions
    if (process.env.NODE_ENV === 'development' && validatedData.extrinsicHash.startsWith('0xtest')) {
      return NextResponse.json(
        {
          verified: true,
          details: {
            blockNumber: 12345678,
            from: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            to: validatedData.expectedTo,
            amount: validatedData.expectedAmount,
            fee: '0.01',
          },
          message: 'Payment verified successfully (development mode)',
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Initialize Polkadot client
    const client = new PolkadotClient();
    
    try {
      // Connect to the blockchain
      await client.connect();
      
      // Verify the transaction
      const result = await client.verifyTransfer({
        extrinsicHash: validatedData.extrinsicHash,
        expectedFrom: '', // We don't check the sender
        expectedTo: validatedData.expectedTo,
        expectedAmount: validatedData.expectedAmount,
      });

      if (result.verified) {
        return NextResponse.json(
          {
            verified: true,
            details: result.details,
            message: 'Payment verified successfully on the blockchain',
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          }
        );
      } else {
        return NextResponse.json(
          {
            verified: false,
            error: result.error || 'Payment verification failed',
          },
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          }
        );
      }
    } finally {
      // Always disconnect
      await client.disconnect();
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        verified: false,
        error: 'Failed to verify payment. Please check the transaction hash and try again.',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}