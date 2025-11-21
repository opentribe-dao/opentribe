import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function OPTIONS() {
    return NextResponse.json({});
}

// GET /api/v1/bounties/[id]/submissions/me - Get current user's submission
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const authHeaders = await headers();
        const sessionData = await auth.api.getSession({
            headers: authHeaders,
        });

        if (!sessionData?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the bounty
        const bounty = await database.bounty.findFirst({
            where: {
                OR: [
                    { id: (await params).id },
                    { slug: { equals: (await params).id, mode: "insensitive" } },
                ],
            },
        });

        if (!bounty) {
            return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }

        // Find user's submission for this bounty
        const submission = await database.submission.findFirst({
            where: {
                bountyId: bounty.id,
                userId: sessionData.user.id,
            },
            orderBy: {
                createdAt: "desc", // Get the most recent submission
            },
        });

        if (!submission) {
            return NextResponse.json(
                { error: "No submission found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ submission });
    } catch (error) {
        console.error("Error fetching user submission:", error);
        return NextResponse.json(
            { error: "Failed to fetch submission" },
            { status: 500 }
        );
    }
}
