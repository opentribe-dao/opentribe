import { beforeEach, describe, expect, test, vi } from "vitest";

const WEEKLY_DIGEST_EMAIL_CONCURRENCY = 5;

const {
  userFindMany,
  userCount,
  bountyFindMany,
  bountyCount,
  bountyAggregate,
  grantFindMany,
  grantCount,
  grantAggregate,
  sendWeeklyDigestEmail,
} = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userCount: vi.fn(),
  bountyFindMany: vi.fn(),
  bountyCount: vi.fn(),
  bountyAggregate: vi.fn(),
  grantFindMany: vi.fn(),
  grantCount: vi.fn(),
  grantAggregate: vi.fn(),
  sendWeeklyDigestEmail: vi.fn(),
}));

vi.mock("@packages/db", () => ({
  database: {
    user: {
      findMany: userFindMany,
      count: userCount,
    },
    bounty: {
      findMany: bountyFindMany,
      count: bountyCount,
      aggregate: bountyAggregate,
    },
    grant: {
      findMany: grantFindMany,
      count: grantCount,
      aggregate: grantAggregate,
    },
  },
}));

vi.mock("@packages/email", () => ({
  sendWeeklyDigestEmail,
}));

import { GET } from "../app/cron/weekly-digest/route";

describe("Weekly Digest Cron", () => {
  const authHeader = {
    authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userFindMany.mockResolvedValue([]);
    userCount.mockResolvedValue(0);
    bountyFindMany.mockResolvedValue([]);
    bountyCount.mockResolvedValue(0);
    bountyAggregate.mockResolvedValue({ _sum: { amountUSD: 0 } });
    grantFindMany.mockResolvedValue([]);
    grantCount.mockResolvedValue(0);
    grantAggregate.mockResolvedValue({ _sum: { totalFundsUSD: 0 } });
    sendWeeklyDigestEmail.mockResolvedValue(undefined);
  });

  test("rejects requests without cron auth", async () => {
    const response = await GET(
      new Request("http://localhost:3002/cron/weekly-digest")
    );

    expect(response.status).toBe(401);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  test("rejects requests with invalid cron auth", async () => {
    const response = await GET(
      new Request("http://localhost:3002/cron/weekly-digest", {
        headers: {
          authorization: "Bearer invalid-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  test("uses the dedicated weekly digest notification setting", async () => {
    await GET(
      new Request("http://localhost:3002/cron/weekly-digest", {
        headers: authHeader,
      })
    );

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          notificationSettings: {
            some: {
              channel: "EMAIL",
              type: "WEEKLY_DIGEST",
              isEnabled: true,
            },
          },
        }),
      })
    );
  });

  test("aggregates mixed success, skip, and failure results", async () => {
    userFindMany.mockResolvedValue([
      {
        id: "user-1",
        email: "success@example.com",
        firstName: "A",
        username: "a",
        skills: ["Rust"],
        applications: [],
      },
      {
        id: "user-2",
        email: "skip@example.com",
        firstName: "B",
        username: "b",
        skills: ["TypeScript"],
        applications: [],
      },
      {
        id: "user-3",
        email: "fail@example.com",
        firstName: "C",
        username: "c",
        skills: ["Rust"],
        applications: [],
      },
    ]);
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Rust bounty",
        skills: ["Rust"],
        amount: 100,
        token: "DOT",
        organization: { name: "Org" },
      },
    ]);
    sendWeeklyDigestEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("email failed"));

    const response = await GET(
      new Request("http://localhost:3002/cron/weekly-digest", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.usersProcessed).toBe(3);
    expect(data.emailsSent).toBe(1);
    expect(data.errors).toEqual([
      {
        userId: "user-3",
        email: "fail@example.com",
        error: "email failed",
      },
    ]);
  });

  test("limits concurrent email sends", async () => {
    userFindMany.mockResolvedValue(
      Array.from(
        { length: WEEKLY_DIGEST_EMAIL_CONCURRENCY + 2 },
        (_, index) => ({
          id: `user-${index}`,
          email: `user-${index}@example.com`,
          firstName: `User${index}`,
          username: `user-${index}`,
          skills: ["Rust"],
          applications: [],
        })
      )
    );
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Rust bounty",
        skills: ["Rust"],
        amount: 100,
        token: "DOT",
        organization: { name: "Org" },
      },
    ]);

    let inFlight = 0;
    let maxInFlight = 0;
    sendWeeklyDigestEmail.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight--;
    });

    const response = await GET(
      new Request("http://localhost:3002/cron/weekly-digest", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.emailsSent).toBe(WEEKLY_DIGEST_EMAIL_CONCURRENCY + 2);
    expect(maxInFlight).toBeLessThanOrEqual(WEEKLY_DIGEST_EMAIL_CONCURRENCY);
  });

  test("continues when a user has malformed skills payload", async () => {
    userFindMany.mockResolvedValue([
      {
        id: "user-1",
        email: "bad@example.com",
        firstName: "Bad",
        username: "bad",
        skills: "{not-json}",
        applications: [],
      },
      {
        id: "user-2",
        email: "good@example.com",
        firstName: "Good",
        username: "good",
        skills: ["Rust"],
        applications: [],
      },
    ]);
    bountyFindMany.mockResolvedValue([
      {
        id: "bounty-1",
        title: "Rust bounty",
        skills: ["Rust"],
        amount: 100,
        token: "DOT",
        organization: { name: "Org" },
      },
    ]);

    const response = await GET(
      new Request("http://localhost:3002/cron/weekly-digest", {
        headers: authHeader,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.emailsSent).toBe(1);
    expect(data.errors).toEqual([
      {
        userId: "user-1",
        email: "bad@example.com",
        error: expect.stringContaining("JSON"),
      },
    ]);
  });
});
