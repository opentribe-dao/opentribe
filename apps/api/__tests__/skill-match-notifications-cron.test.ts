import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  bountyFindMany,
  notificationSettingFindMany,
  userFindMany,
  sendSkillMatchBountyEmail,
} = vi.hoisted(() => ({
  bountyFindMany: vi.fn(),
  notificationSettingFindMany: vi.fn(),
  userFindMany: vi.fn(),
  sendSkillMatchBountyEmail: vi.fn(),
}));

vi.mock("@packages/db", () => ({
  database: {
    bounty: {
      findMany: bountyFindMany,
    },
    notificationSetting: {
      findMany: notificationSettingFindMany,
    },
    user: {
      findMany: userFindMany,
    },
  },
}));

vi.mock("@packages/email", () => ({
  sendSkillMatchBountyEmail,
}));

import { GET } from "../app/cron/skill-match-notifications/route";

describe("Skill Match Notifications Cron", () => {
  const authHeader = {
    authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    bountyFindMany.mockResolvedValue([]);
    notificationSettingFindMany.mockResolvedValue([]);
    userFindMany.mockResolvedValue([]);
    sendSkillMatchBountyEmail.mockResolvedValue(undefined);
  });

  test("rejects requests without cron auth", async () => {
    const response = await GET(
      new Request("http://localhost:3002/cron/skill-match-notifications")
    );

    expect(response.status).toBe(401);
    expect(bountyFindMany).not.toHaveBeenCalled();
  });

  test("rejects requests with invalid cron auth", async () => {
    const response = await GET(
      new Request("http://localhost:3002/cron/skill-match-notifications", {
        headers: {
          authorization: "Bearer invalid-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    expect(bountyFindMany).not.toHaveBeenCalled();
  });

  test("queries enabled email notification settings only", async () => {
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Need Rust dev",
        skills: ["Rust"],
        amount: 100,
        amountUSD: 100,
        token: "DOT",
        deadline: new Date("2026-03-25T00:00:00.000Z"),
        description: "desc",
        organization: { name: "Org" },
      },
    ]);
    notificationSettingFindMany.mockResolvedValue([
      {
        user: {
          id: "user-1",
          email: "user@example.com",
          username: "user",
          firstName: "User",
          skills: ["Rust"],
          lastSeen: new Date(),
        },
      },
    ]);

    const response = await GET(
      new Request("http://localhost:3002/cron/skill-match-notifications", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(notificationSettingFindMany).toHaveBeenCalledWith({
      where: {
        channel: "EMAIL",
        type: "NEW_BOUNTY_MATCHING_SKILLS",
        isEnabled: true,
        user: {
          profileCompleted: true,
          skills: {
            isEmpty: false,
          },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            skills: true,
            lastSeen: true,
          },
        },
      },
    });
    expect(data.stats.emailsSent).toBe(1);
  });

  test("reports email failures without aborting the cron", async () => {
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Need Rust dev",
        skills: ["Rust"],
        amount: 100,
        amountUSD: 100,
        token: "DOT",
        deadline: new Date("2026-03-25T00:00:00.000Z"),
        description: "desc",
        organization: { name: "Org" },
      },
    ]);
    notificationSettingFindMany.mockResolvedValue([
      {
        user: {
          id: "user-1",
          email: "user@example.com",
          username: "user",
          firstName: "User",
          skills: ["Rust"],
          lastSeen: new Date(),
        },
      },
    ]);
    sendSkillMatchBountyEmail.mockRejectedValueOnce(new Error("mail failed"));

    const response = await GET(
      new Request("http://localhost:3002/cron/skill-match-notifications", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.errors).toBe(1);
    expect(data.errors).toEqual(["User user-1: mail failed"]);
  });

  test("falls back to legacy user preference opt-ins", async () => {
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Need Rust dev",
        skills: ["Rust"],
        amount: 100,
        amountUSD: 100,
        token: "DOT",
        deadline: new Date("2026-03-25T00:00:00.000Z"),
        description: "desc",
        organization: { name: "Org" },
      },
    ]);
    notificationSettingFindMany.mockResolvedValue([]);
    userFindMany.mockResolvedValue([
      {
        id: "legacy-user-1",
        email: "legacy@example.com",
        username: "legacy",
        firstName: "Legacy",
        skills: ["Rust"],
        lastSeen: new Date(),
      },
    ]);

    const response = await GET(
      new Request("http://localhost:3002/cron/skill-match-notifications", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        profileCompleted: true,
        skills: {
          isEmpty: false,
        },
        preferences: {
          path: ["notifications", "skillMatch"],
          equals: true,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        skills: true,
        lastSeen: true,
      },
    });
    expect(data.stats.emailsSent).toBe(1);
  });
});
