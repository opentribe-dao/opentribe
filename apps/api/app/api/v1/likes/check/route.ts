import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/likes/check - Check if user has liked something
export async function GET(request: NextRequest) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationIds =
      searchParams.get("applicationIds")?.split(",").filter(Boolean) || [];
    const submissionIds =
      searchParams.get("submissionIds")?.split(",").filter(Boolean) || [];

    if (applicationIds.length === 0 && submissionIds.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Get all likes for the user matching the provided IDs
    const likes = await database.like.findMany({
      where: {
        userId: sessionData.user.id,
        OR: [
          ...(applicationIds.length > 0
            ? [{ applicationId: { in: applicationIds } }]
            : []),
          ...(submissionIds.length > 0
            ? [{ submissionId: { in: submissionIds } }]
            : []),
        ],
      },
      select: {
        applicationId: true,
        submissionId: true,
      },
    });

    // Create a map of liked items
    const likedApplicationIds = new Set(
      likes.filter((l) => l.applicationId).map((l) => l.applicationId)
    );
    const likedSubmissionIds = new Set(
      likes.filter((l) => l.submissionId).map((l) => l.submissionId)
    );

    return NextResponse.json({
      applications: Object.fromEntries(
        applicationIds.map((id) => [id, likedApplicationIds.has(id)])
      ),
      submissions: Object.fromEntries(
        submissionIds.map((id) => [id, likedSubmissionIds.has(id)])
      ),
    });
  } catch (error) {
    console.error("Error checking likes:", error);
    return NextResponse.json(
      { error: "Failed to check likes" },
      { status: 500 }
    );
  }
}
