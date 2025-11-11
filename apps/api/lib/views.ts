import { database } from "@packages/db";

type ViewManagerInit = { exp?: number; userId?: string; userIp?: string };

export class ViewManager {
  private readonly expireHours: number;
  private readonly userId?: string;
  private readonly userIp?: string;

  constructor(init: ViewManagerInit) {
    this.expireHours = Math.max(1, Number(init.exp ?? 24) || 24);
    this.userId = init.userId;
    this.userIp = init.userIp;
  }

  static async cleanupExpired(): Promise<number> {
    const now = new Date();
    const res = await database.view.deleteMany({
      where: { exp: { lte: now } },
    });
    return res.count;
  }

  static extractClientIp(req: Request): string | undefined {
    try {
      const headers = (req as any).headers as Headers;
      const normalize = (raw: string): string => {
        const first = raw.split(",")[0]?.trim() ?? "";
        // Strip IPv4 port (e.g., 203.0.113.1:12345). Keep IPv6 as-is.
        if (/^\d{1,3}(?:\.\d{1,3}){3}:(\d+)$/.test(first)) {
          return first.split(":")[0] ?? first;
        }
        return first;
      };

      const xff = headers.get("x-forwarded-for");
      if (xff) return normalize(xff);
      const realIp = headers.get("x-real-ip");
      if (realIp) return normalize(realIp);
      const cfIp = headers.get("cf-connecting-ip");
      if (cfIp) return normalize(cfIp);
    } catch {}
    return;
  }

  async recordViewForEntity(
    entity: string
  ): Promise<{ created: boolean } | { created: boolean; error: string }> {
    const [entityType, entityId] = entity.split(":");
    if (!(entityType && entityId)) {
      return {
        created: false,
        error: "Invalid entity format. Expected 'type:id'",
      };
    }

    const now = new Date();
    const exp = new Date(now.getTime() + this.expireHours * 60 * 60 * 1000);

    // Check if a non-expired view exists for this user (by id or ip)
    const whereBase: any = { entity, exp: { gt: now } };
    if (this.userId) whereBase.userId = this.userId;
    else if (this.userIp) whereBase.userIp = this.userIp;
    else {
      return {
        created: false,
        error: "No user ID or IP provided",
      };
    }

    const existing = await database.view.findFirst({ where: whereBase });
    if (existing) return { created: false };

    // Create view row
    await database.view.create({
      data: {
        entity,
        userId: this.userId || undefined,
        userIp: this.userIp || undefined,
        exp,
      },
    });

    // Increment corresponding entity viewCount
    await this.incrementEntityViewCount(entityType, entityId);
    return { created: true };
  }

  private async incrementEntityViewCount(
    entityType: string,
    id: string
  ): Promise<void> {
    switch (entityType) {
      case "grant": {
        await database.grant.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return;
      }
      case "bounty": {
        await database.bounty.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return;
      }
      case "rfp": {
        await database.rFP.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return;
      }
      case "submission": {
        await database.submission.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return;
      }
      case "application":
      case "grant_application": {
        await database.grantApplication.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        return;
      }
      default:
        return;
    }
  }
}
