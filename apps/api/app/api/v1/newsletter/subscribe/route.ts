import { createContact } from "@packages/email";
import { formatZodError } from "@/lib/zod-errors";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName } = subscribeSchema.parse(body);

    const result = await createContact({
      email,
      firstName,
      lastName,
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
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
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
