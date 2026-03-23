import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  runProductionSeed,
  assertProductionSeedPermission,
} from "../seed-production";

const createMockDb = () => ({
  user: {
    findUnique: vi.fn(),
  },
  organization: {
    upsert: vi.fn(),
  },
  member: {
    upsert: vi.fn(),
  },
  grant: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  rFP: {
    upsert: vi.fn(),
  },
  $disconnect: vi.fn(),
});

describe("seed-production", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("requires explicit permission in production", () => {
    expect(() =>
      assertProductionSeedPermission({
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv)
    ).toThrow("seed-production.ts requires ALLOW_PRODUCTION_SEED_UPSERT=true");

    expect(() =>
      assertProductionSeedPermission({
        NODE_ENV: "production",
        ALLOW_PRODUCTION_SEED_UPSERT: "true",
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });

  test("upserts organization, grants, and rfps without deleting data", async () => {
    const db = createMockDb();

    db.user.findUnique.mockResolvedValue({ id: "user-1" });
    db.organization.upsert.mockResolvedValue({
      id: "org-1",
      slug: "web3-foundation",
    });
    db.member.upsert.mockResolvedValue({ id: "member-1" });
    db.grant.upsert
      .mockResolvedValueOnce({
        id: "grant-1",
        slug: "proof-of-personhood-bounty",
      })
      .mockResolvedValueOnce({ id: "grant-2", slug: "kusama-zk-bounty" })
      .mockResolvedValueOnce({
        id: "grant-3",
        slug: "ksm-art-social-experiments",
      });
    db.rFP.upsert.mockResolvedValue({ id: "rfp-1", slug: "000-privacy-os" });

    await runProductionSeed({
      db: db as never,
      now: new Date("2026-03-22T00:00:00.000Z"),
      logger: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
    });

    expect(db.organization.upsert).toHaveBeenCalledTimes(1);
    expect(db.member.upsert).toHaveBeenCalledTimes(1);
    expect(db.grant.upsert).toHaveBeenCalledTimes(3);
    expect(db.rFP.upsert).toHaveBeenCalledTimes(1);
    expect(db.grant.update).toHaveBeenCalledTimes(3);

    expect(db.organization.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "web3-foundation" },
      })
    );

    expect(db.grant.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { slug: "kusama-zk-bounty" },
        create: expect.objectContaining({
          organizationId: "org-1",
        }),
        update: expect.not.objectContaining({
          publishedAt: expect.anything(),
          applicationCount: expect.anything(),
          rfpCount: expect.anything(),
        }),
      })
    );

    expect(db.rFP.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "000-privacy-os" },
        create: expect.objectContaining({
          grantId: "grant-2",
        }),
        update: expect.not.objectContaining({
          publishedAt: expect.anything(),
          applicationCount: expect.anything(),
        }),
      })
    );
  });

  test("skips owner membership upsert when seed owner is missing", async () => {
    const db = createMockDb();

    db.user.findUnique.mockResolvedValue(null);
    db.organization.upsert.mockResolvedValue({
      id: "org-1",
      slug: "web3-foundation",
    });
    db.grant.upsert
      .mockResolvedValueOnce({
        id: "grant-1",
        slug: "proof-of-personhood-bounty",
      })
      .mockResolvedValueOnce({ id: "grant-2", slug: "kusama-zk-bounty" })
      .mockResolvedValueOnce({
        id: "grant-3",
        slug: "ksm-art-social-experiments",
      });
    db.rFP.upsert.mockResolvedValue({ id: "rfp-1", slug: "000-privacy-os" });

    const logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    await runProductionSeed({
      db: db as never,
      now: new Date("2026-03-22T00:00:00.000Z"),
      logger,
    });

    expect(db.member.upsert).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping owner membership upsert")
    );
  });
});
