import { auth } from "@packages/auth/server";
import { OPTIONAL_URL_REGEX, URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { sendBountyFirstSubmissionEmail } from "@packages/email";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for submission creation
const createSubmissionSchema = z.object({
  submissionUrl: z
    .string()
    .regex(OPTIONAL_URL_REGEX, {
      message: "Invalid URL format for submission URL",
    })
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .min(1, { message: "Title must be at least 1 character" })
    .max(200, { message: "Title must be at most 200 characters" })
    .optional(),
  description: z.string().optional(),
  attachments: z
    .array(
      z
        .string()
        .regex(URL_REGEX, { message: "Invalid URL format for attachment" })
    )
    .optional(), // File URLs - required URL format
  responses: z
    .record(
      z.string(),
      z.union([z.string(), z.boolean()], {
        message: "Response must be a string or boolean",
      })
    )
    .optional(), // For screening question responses
});

type ScreeningQuestion = {
  question: string;
  type: "text" | "url" | "file" | "boolean";
  optional?: boolean;
};

type ScreeningQuestionResponses = Record<string, string | boolean>;

type ScreeningValidationResult =
  | { success: true; responses: ScreeningQuestionResponses }
  | { success: false; error: string };

const BOOLEAN_TRUE_VALUES = new Set(["yes", "true", "1"]);
const BOOLEAN_FALSE_VALUES = new Set(["no", "false", "0"]);

const normalizeBooleanResponse = (value: string | boolean): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (BOOLEAN_TRUE_VALUES.has(normalized)) {
      return true;
    }

    if (BOOLEAN_FALSE_VALUES.has(normalized)) {
      return false;
    }
  }

  return null;
};

const validateScreeningResponses = (
  screening: ScreeningQuestion[] | null | undefined,
  responses: ScreeningQuestionResponses | undefined
): ScreeningValidationResult => {
  if (!screening?.length) {
    if (!responses) {
      return { success: true, responses: {} };
    }

    const sanitized: ScreeningQuestionResponses = {};

    for (const [question, value] of Object.entries(responses)) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) {
          sanitized[question] = trimmed;
        }
      } else if (typeof value === "boolean") {
        sanitized[question] = value;
      }
    }

    return { success: true, responses: sanitized };
  }

  const sanitized: ScreeningQuestionResponses = {};

  for (const question of screening) {
    const rawValue = responses?.[question.question];

    const isMissing =
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === "string" && rawValue.trim() === "");

    if (!question.optional && isMissing) {
      return {
        success: false,
        error: `Missing response for required question: ${question.question}`,
      };
    }

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    switch (question.type) {
      case "text":
      case "file": {
        if (typeof rawValue !== "string") {
          return {
            success: false,
            error: `Invalid response for question: ${question.question}`,
          };
        }

        const trimmed = rawValue.trim();

        if (!trimmed) {
          if (question.optional) {
            continue;
          }

          return {
            success: false,
            error: `Missing response for required question: ${question.question}`,
          };
        }

        sanitized[question.question] = trimmed;
        break;
      }
      case "url": {
        if (typeof rawValue !== "string") {
          return {
            success: false,
            error: `Invalid response type for URL question: ${question.question}. Expected string.`,
          };
        }

        const trimmed = rawValue.trim();

        if (!trimmed) {
          if (question.optional) {
            continue;
          }

          return {
            success: false,
            error: `Missing response for required question: ${question.question}`,
          };
        }

        // Use URL_REGEX for required URLs, OPTIONAL_URL_REGEX for optional ones
        const urlRegex = question.optional ? OPTIONAL_URL_REGEX : URL_REGEX;

        if (!urlRegex.test(trimmed)) {
          return {
            success: false,
            error: `Invalid URL format for question: ${question.question}`,
          };
        }

        sanitized[question.question] = trimmed;
        break;
      }
      case "boolean": {
        const normalized = normalizeBooleanResponse(rawValue);

        if (normalized === null) {
          return {
            success: false,
            error: `Invalid yes/no response for question: ${question.question}`,
          };
        }

        sanitized[question.question] = normalized;
        break;
      }
      default:
        // Treat unknown types as text/file to ensure backward compatibility
        // and handle cases where type might be missing in legacy data
        if (typeof rawValue === "string") {
          const trimmed = rawValue.trim();
          if (trimmed) {
            sanitized[question.question] = trimmed;
          } else if (!question.optional) {
            return {
              success: false,
              error: `Missing response for required question: ${question.question}`,
            };
          }
        }
        break;
    }
  }

  return { success: true, responses: sanitized };
};

// GET /api/v1/bounties/[id]/submissions - Get submissions for a bounty
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth (optional for public bounties)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const bountyIdentifier = (await params).id;

    // Get the bounty
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyIdentifier },
          { slug: { equals: bountyIdentifier, mode: "insensitive" } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            members: session?.user
              ? {
                  where: {
                    userId: session.user.id,
                  },
                }
              : undefined,
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        {
          status: 404,
        }
      );
    }

    // Check if user can view submissions
    const isOrgMember =
      session?.user &&
      bounty.organization.members &&
      bounty.organization.members.length > 0;

    // For public bounties, only show submitted submissions
    // For org members, show all submissions
    const whereClause: any = {
      bountyId: bounty.id,
    };

    if (!isOrgMember) {
      // For public, show all non-draft submissions
      whereClause.status = {
        in: ["SUBMITTED", "APPROVED", "REJECTED"],
      };
    }

    // Get submissions
    const submissions = await database.submission.findMany({
      where: whereClause,
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: isOrgMember, // Only show email to org members
            image: true,
            headline: true,
            skills: true,
            walletAddress: isOrgMember, // Only show wallet address to org members
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        payments: isOrgMember
          ? {
              select: {
                id: true,
                status: true,
                extrinsicHash: true,
                amount: true,
                token: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          : false,
      },
      orderBy: [
        { isWinner: "desc" },
        { position: "asc" },
        { submittedAt: "desc" },
      ],
    });

    // Add additional stats
    const submissionsWithStats = submissions.map((submission) => ({
      ...submission,
      stats: {
        commentsCount: submission._count.comments,
        likesCount: submission._count.likes,
      },
    }));

    return NextResponse.json({
      submissions: submissionsWithStats,
      total: submissionsWithStats.length,
      isOrgMember,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      {
        status: 500,
      }
    );
  }
}

// POST /api/v1/bounties/[id]/submissions - Create a submission
export async function POST(
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
        { error: "You must be logged in to submit" },
        { status: 401 }
      );
    }

    // Check if user has completed profile
    const user = await database.user.findUnique({
      where: { id: session.user.id },
      select: {
        profileCompleted: true,
      },
    });

    if (!user?.profileCompleted) {
      return NextResponse.json(
        { error: "You must complete your profile to submit a submission" },
        { status: 400 }
      );
    }

    const bountyIdentifier = (await params).id;

    // Check if bounty exists and is open
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyIdentifier },
          { slug: { equals: bountyIdentifier, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        screening: true,
        organizationId: true,
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.visibility !== "PUBLISHED" || bounty.status !== "OPEN") {
      return NextResponse.json(
        { error: "This bounty is not accepting submissions" },
        { status: 400 }
      );
    }

    // Enforce 1 submission per user per bounty
    const existingSubmission = await database.submission.findFirst({
      where: {
        bountyId: bounty.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: "You have already submitted to this bounty",
          message: "Only one submission per user per bounty is allowed",
        },
        { status: 400 }
      );
    }

    // Check if user is a member of the org
    const membership = await database.member.findMany({
      where: {
        organizationId: bounty.organizationId,
        userId: session.user.id,
      },
    });

    if (membership.length !== 0) {
      return NextResponse.json(
        {
          error:
            "Members of the same organization cannot submit to the same bounty",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = createSubmissionSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error);
        return NextResponse.json(formattedError, { status: 400 });
      }
      throw error;
    }

    const screeningQuestions = Array.isArray(bounty.screening)
      ? (bounty.screening as ScreeningQuestion[])
      : undefined;

    const screeningValidation = validateScreeningResponses(
      screeningQuestions,
      validatedData.responses
    );

    if (!screeningValidation.success) {
      return NextResponse.json(
        { error: screeningValidation.error },
        { status: 400 }
      );
    }

    const sanitizedResponses =
      Object.keys(screeningValidation.responses).length > 0
        ? screeningValidation.responses
        : undefined;

    // Create the submission
    const submissionData: any = {
      bountyId: bounty.id,
      userId: session.user.id,
      submissionUrl:
        validatedData.submissionUrl === "" || !validatedData.submissionUrl
          ? null
          : validatedData.submissionUrl,
      title: validatedData.title || `Submission for ${bounty.title}`,
      description: validatedData.description,
      responses: sanitizedResponses,
      status: "SUBMITTED",
      submittedAt: new Date(),
    };

    // Only include attachments if explicitly provided and not empty
    if (
      validatedData.attachments !== undefined &&
      Array.isArray(validatedData.attachments) &&
      validatedData.attachments.length > 0
    ) {
      submissionData.attachments = validatedData.attachments;
    }

    const submission = await database.submission.create({
      data: submissionData,
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    // Update bounty submission count
    await database.bounty.update({
      where: { id: bounty.id },
      data: {
        submissionCount: {
          increment: 1,
        },
      },
    });

    // Check if this is the first submission and send email to org members
    const submissionCount = await database.submission.count({
      where: { bountyId: bounty.id },
    });

    if (submissionCount === 1) {
      // Get bounty curators
      const bountyCurators = await database.curator.findMany({
        where: { bountyId: bounty.id },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      // Send first submission email only to the bounty curators
      for (const curator of bountyCurators) {
        if (curator.user) {
          try {
            await sendBountyFirstSubmissionEmail(
              {
                email: curator.user.email,
                firstName: curator.user.firstName || undefined,
                username: curator.user.username || undefined,
              },
              {
                id: bounty.id,
                title: bounty.title,
              },
              {
                id: submission.id,
                title: submission.title || "",
                description: submission.description || "",
                submitter: {
                  firstName: submission.submitter.firstName || undefined,
                  username: submission.submitter.username || "Anonymous",
                },
              }
            );
          } catch (error) {
            console.error("Failed to send first submission email:", error);
            // Don't fail the request if email fails
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Submission creation error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.issues);
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to create submission",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
