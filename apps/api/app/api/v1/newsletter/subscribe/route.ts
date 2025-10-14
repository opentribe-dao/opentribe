import { type NextRequest, NextResponse } from "next/server";
import { createContact } from "@packages/email/newsletter";
import { keys } from "@packages/email/keys";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName } = subscribeSchema.parse(body);

    const audienceId = keys().RESEND_GENERAL_AUDIENCE_ID;

    const result = await createContact({
      email,
      audienceId,
      firstName,
      lastName,
      unsubscribed: false,
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          contactId: result.contactId,
          message: "Successfully subscribed to newsletter!",
        },
        {
          status: 201,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to subscribe",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("Newsletter subscription API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process subscription",
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
