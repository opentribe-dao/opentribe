import { database } from "@packages/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/users - Search users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const id = searchParams.get("id");

    if (!username && !id) {
      return NextResponse.json(
        { error: "Username or ID parameter required" },
        { status: 400 }
      );
    }

    // Handle both username and ID searches
    let whereCondition: any = {};

    if (username) {
      // First try exact username match, then try as ID
      whereCondition = {
        username: {
          equals: username,
          mode: "insensitive",
        },
      };
    } else if (id) {
      whereCondition = { id };
    }

    const users = await database.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        headline: true,
        private: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
