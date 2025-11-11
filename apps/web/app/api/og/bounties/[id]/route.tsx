import { siteName } from "@packages/seo/config";
import { loadOgAssets } from "@packages/seo/og-assets";
import { ImageResponse } from "next/og";
import { env } from "@/env";
import type { Bounty } from "@/hooks/use-bounties-data";

export const runtime = "nodejs";

// Shared OG assets (fonts + background)
const ogAssets = loadOgAssets();

async function getBounty(id: string) {
  try {
    if (!env.NEXT_PUBLIC_API_URL) return null;
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.bounty as { title?: string; organization?: { name?: string } };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  const title = bounty?.title ?? "Bounty";
  const org = bounty?.organization?.name ?? siteName;
  const orgLogo = (bounty as Bounty)?.organization?.logo || null;

  // Derive total prize directly from bounty.amount and bounty.token
  const totalPrize = (() => {
    try {
      const amountRaw = (bounty as Bounty)?.amount;
      const token = (bounty as Bounty)?.token || "DOT";
      const amount = amountRaw != null ? Number(amountRaw) : 0;
      if (!amount || Number.isNaN(amount)) return null;
      const short =
        amount >= 1000 ? `${Math.round(amount / 100) / 10}K` : `${amount}`;
      return `${short} ${token}`;
    } catch {
      return null;
    }
  })();

  // Adjust title size based on length (smaller for better balance)
  const tLen = title.length;
  const titleSize = tLen > 60 ? 44 : tLen > 40 ? 52 : 60;

  const { chakra700, chakra500, satoshi400, satoshi500, background, logomark } =
    await ogAssets;
  const bgBuffer = background ?? null;
  const bgDataUrl = bgBuffer
    ? `url(data:image/png;base64,${Buffer.from(bgBuffer).toString("base64")})`
    : undefined;
  const logomarkSrc = logomark
    ? `data:image/svg+xml;base64,${Buffer.from(logomark).toString("base64")}`
    : undefined;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage: bgDataUrl,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Content frame */}
      <div
        style={{
          width: 1100,
          height: 520,
          display: "flex",
          flexDirection: "row",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Sidebar with logo */}
        <div
          style={{
            width: 220,
            height: 520,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 24,
          }}
        >
          {orgLogo ? (
            <img
              alt={orgLogo}
              height={140}
              src={orgLogo}
              style={{ borderRadius: 9999 }}
              width={140}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 9999,
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            />
          )}
        </div>

        {/* Main column */}
        <div
          style={{
            flex: 1,
            height: 520,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 16,
            padding: 8,
          }}
        >
          {/* Top label row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Satoshi",
                fontWeight: 500,
                fontSize: 24,
                color: "#E6007A",
                letterSpacing: "0.4px",
              }}
            >
              ⚡ Bounty
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {logomarkSrc && (
                <img
                  alt="Opentribe"
                  height={37}
                  src={logomarkSrc}
                  style={{ display: "block" }}
                  width={32}
                />
              )}
              <div
                style={{
                  fontFamily: "Chakra Petch",
                  fontWeight: 700,
                  fontSize: 26,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "4px",
                }}
              >
                OPENTRIBE
              </div>
            </div>
          </div>

          {/* Title (left-aligned) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              textAlign: "left",
              minHeight: 300,
            }}
          >
            <div
              style={{
                fontFamily: "Chakra Petch",
                textAlign: "left",
                fontWeight: 700,
                fontSize: titleSize,
                color: "#fff",
                lineHeight: 1.12,
              }}
            >
              {title}
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Satoshi",
                fontWeight: 600,
                fontSize: 28,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {`${totalPrize || ""}${totalPrize && org ? " | " : ""}${org || ""}`}
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
      fonts: [
        { name: "Chakra Petch", data: chakra700, style: "normal", weight: 700 },
        { name: "Chakra Petch", data: chakra500, style: "normal", weight: 500 },
        { name: "Satoshi", data: satoshi400, style: "normal", weight: 400 },
        { name: "Satoshi", data: satoshi500, style: "normal", weight: 500 },
      ],
    }
  );
}
