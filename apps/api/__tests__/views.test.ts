import { database } from "@packages/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ViewManager } from "@/lib/views";

describe("ViewManager.extractClientIp", () => {
  it("returns first IP from x-forwarded-for and strips IPv4 port", () => {
    const req = new Request("http://localhost", {
      headers: new Headers({
        "x-forwarded-for": "203.0.113.9:51324, 70.41.3.18",
      }),
    });
    expect(ViewManager.extractClientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when x-forwarded-for missing", () => {
    const req = new Request("http://localhost", {
      headers: new Headers({
        "x-real-ip": "198.51.100.7",
      }),
    });
    expect(ViewManager.extractClientIp(req)).toBe("198.51.100.7");
  });

  it("falls back to cf-connecting-ip when other headers missing", () => {
    const req = new Request("http://localhost", {
      headers: new Headers({
        "cf-connecting-ip": "192.0.2.33",
      }),
    });
    expect(ViewManager.extractClientIp(req)).toBe("192.0.2.33");
  });

  it("returns IPv6 unchanged", () => {
    const req = new Request("http://localhost", {
      headers: new Headers({
        "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      }),
    });
    expect(ViewManager.extractClientIp(req)).toBe(
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
    );
  });
});

describe("ViewManager.cleanupExpired", () => {
  it("deletes rows where exp <= now and returns count", async () => {
    (database.view.deleteMany as any).mockResolvedValue({ count: 3 });
    const count = await ViewManager.cleanupExpired();
    expect(count).toBe(3);
    expect(database.view.deleteMany).toHaveBeenCalledTimes(1);
    const args = (database.view.deleteMany as any).mock.calls[0][0];
    expect(args).toHaveProperty("where.exp.lte");
    expect(args.where.exp.lte).toBeInstanceOf(Date);
  });
});

describe("ViewManager.recordViewForEntity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when no userId or userIp present", async () => {
    const vm = new ViewManager({});
    const result = await vm.recordViewForEntity("grant:abc");
    expect(result).toEqual({
      created: false,
      error: "No user ID or IP provided",
    });
    expect(database.view.findFirst).not.toHaveBeenCalled();
  });

  it("returns error for invalid entity format", async () => {
    const vm = new ViewManager({ userId: "u1" });
    const result = await vm.recordViewForEntity("invalid");
    expect(result).toEqual({
      created: false,
      error: "Invalid entity format. Expected 'type:id'",
    });
  });

  it("no-op when an unexpired view exists", async () => {
    (database.view.findFirst as any).mockResolvedValue({ id: "v1" });
    const vm = new ViewManager({ userId: "u1" });
    const res = await vm.recordViewForEntity("grant:gid");
    expect(res).toEqual({ created: false });
    expect(database.view.create).not.toHaveBeenCalled();
    expect(database.grant.update).not.toHaveBeenCalled();
  });

  const entityCases = [
    { type: "grant", updatePath: () => database.grant.update },
    { type: "bounty", updatePath: () => database.bounty.update },
    { type: "rfp", updatePath: () => database.rFP.update },
    { type: "submission", updatePath: () => database.submission.update },
    { type: "application", updatePath: () => database.grantApplication.update },
  ] as const;

  entityCases.forEach(({ type, updatePath }) => {
    it(`creates view and increments ${type} viewCount (by userId)`, async () => {
      (database.view.findFirst as any).mockResolvedValue(null);
      (database.view.create as any).mockResolvedValue({ id: "v2" });
      (updatePath() as any).mockResolvedValue({});

      const vm = new ViewManager({ userId: "user-123" });
      const res = await vm.recordViewForEntity(`${type}:id-1`);
      expect(res).toEqual({ created: true });

      expect(database.view.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          entity: `${type}:id-1`,
          exp: { gt: expect.any(Date) },
          userId: "user-123",
        }),
      });

      expect(database.view.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: `${type}:id-1`,
          userId: "user-123",
          exp: expect.any(Date),
        }),
      });

      expect(updatePath()).toHaveBeenCalledWith({
        where: { id: "id-1" },
        data: { viewCount: { increment: 1 } },
      });
    });

    it(`creates view and increments ${type} viewCount (by userIp)`, async () => {
      (database.view.findFirst as any).mockResolvedValue(null);
      (database.view.create as any).mockResolvedValue({ id: "v3" });
      (updatePath() as any).mockResolvedValue({});

      const vm = new ViewManager({ userIp: "203.0.113.9" });
      const res = await vm.recordViewForEntity(`${type}:id-2`);
      expect(res).toEqual({ created: true });

      expect(database.view.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          entity: `${type}:id-2`,
          exp: { gt: expect.any(Date) },
          userIp: "203.0.113.9",
        }),
      });

      expect(database.view.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: `${type}:id-2`,
          userIp: "203.0.113.9",
          exp: expect.any(Date),
        }),
      });

      expect(updatePath()).toHaveBeenCalledWith({
        where: { id: "id-2" },
        data: { viewCount: { increment: 1 } },
      });
    });
  });
});
