import { resend } from "@packages/email";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.email("Valid email is required"),
  organizationType: z.enum([
    "dao",
    "protocol",
    "parachain",
    "foundation",
    "ecosystem",
    "other",
  ]),
  inquiryType: z.enum([
    "list-opportunity",
    "partnership",
    "feature-request",
    "other",
  ]),
  message: z.string().min(50, "Message must be at least 50 characters"),
  acceptsMarketing: z.boolean().optional(),
});

const organizationTypeLabels = {
  dao: "DAO",
  protocol: "Protocol",
  parachain: "Parachain",
  foundation: "Foundation",
  ecosystem: "Ecosystem Project",
  other: "Other",
};

const inquiryTypeLabels = {
  "list-opportunity": "List an Opportunity",
  partnership: "Partnership Inquiry",
  "feature-request": "Feature Request",
  other: "Other",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Send notification email to support team
    const emailHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E6007A;">New Contact Form Submission</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Organization Details</h3>
          <p><strong>Organization:</strong> ${validatedData.organizationName}</p>
          <p><strong>Contact Person:</strong> ${validatedData.contactName}</p>
          <p><strong>Email:</strong> <a href="mailto:${validatedData.email}">${validatedData.email}</a></p>
          <p><strong>Organization Type:</strong> ${organizationTypeLabels[validatedData.organizationType]}</p>
          <p><strong>Inquiry Type:</strong> ${inquiryTypeLabels[validatedData.inquiryType]}</p>
          <p><strong>Accepts Marketing:</strong> ${validatedData.acceptsMarketing ? "Yes" : "No"}</p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${validatedData.message}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Response Time:</strong> Please respond within 24 hours<br/>
          <strong>Submitted:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
        </p>
      </div>
    `;

    const emailText = `
New Contact Form Submission

Organization Details:
- Organization: ${validatedData.organizationName}
- Contact Person: ${validatedData.contactName}
- Email: ${validatedData.email}
- Organization Type: ${organizationTypeLabels[validatedData.organizationType]}
- Inquiry Type: ${inquiryTypeLabels[validatedData.inquiryType]}
- Accepts Marketing: ${validatedData.acceptsMarketing ? "Yes" : "No"}

Message:
${validatedData.message}

---
Response Time: Please respond within 24 hours
Submitted: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
    `;

    await resend.emails.send({
      from: "Opentribe Contact <hello@notifications.opentribe.io>",
      to: ["support@opentribe.io"],
      replyTo: validatedData.email,
      subject: `Contact Form: ${inquiryTypeLabels[validatedData.inquiryType]} - ${validatedData.organizationName}`,
      html: emailHtml,
      text: emailText,
    });

    // Optionally, send confirmation email to the submitter
    const confirmationHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E6007A;">Thank You for Contacting Opentribe!</h2>

        <p>Hi ${validatedData.contactName},</p>

        <p>We've received your message and will respond within 24 hours.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Submission</h3>
          <p><strong>Organization:</strong> ${validatedData.organizationName}</p>
          <p><strong>Inquiry Type:</strong> ${inquiryTypeLabels[validatedData.inquiryType]}</p>
          <p style="margin-bottom: 0;"><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; margin-top: 5px;">${validatedData.message}</p>
        </div>

        <p>In the meantime, you can:</p>
        <ul>
          <li><a href="${process.env.NEXT_PUBLIC_WEB_URL}/bounties">Explore bounties</a> from the Polkadot ecosystem</li>
          <li><a href="${process.env.NEXT_PUBLIC_WEB_URL}/grants">Browse available grants</a></li>
          <li><a href="${process.env.NEXT_PUBLIC_DOCS_URL}">Read our documentation</a></li>
        </ul>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          Best regards,<br/>
          The Opentribe Team
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Opentribe <hello@notifications.opentribe.io>",
      to: [validatedData.email],
      subject: "Thank you for contacting Opentribe",
      html: confirmationHtml,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form API error:", error);

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
        error: "Failed to submit contact form",
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
