import { ImageResponse } from "next/og";
import { siteName } from "@packages/seo/config";
import { env } from "@/env";
import { formatCurrency } from "@packages/base/lib/utils";
import type { Grant } from "@/hooks/use-grants-data";
import { loadOgAssets } from "@packages/seo/og-assets";

export const runtime = "nodejs";

const ogAssets = loadOgAssets();

async function getGrant(id: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.grant as {
    title?: string;
    organization?: { name?: string; logo?: string };
    minAmount?: number | string | null;
    maxAmount?: number | string | null;
    token?: string | null;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const grant = await getGrant(id);
  const title = grant?.title ?? "Grant";
  const org = grant?.organization?.name ?? siteName;
  const orgLogo = grant?.organization?.logo || null;

  const token = (grant as Grant)?.token || "DOT";
  const minRaw = (grant as Grant)?.minAmount;
  const maxRaw = (grant as Grant)?.maxAmount;
  const min = minRaw != null ? Number(minRaw) : null;
  const max = maxRaw != null ? Number(maxRaw) : null;
  const range = (() => {
    const fmtMin =
      typeof min === "number" && !Number.isNaN(min)
        ? formatCurrency(min)
        : null;
    const fmtMax =
      typeof max === "number" && !Number.isNaN(max)
        ? formatCurrency(max)
        : null;
    if (fmtMin && fmtMax) return `${fmtMin}-${fmtMax} ${token}`;
    if (fmtMax && !fmtMin) return `${fmtMax} ${token}`;
    if (fmtMin && !fmtMax) return `${fmtMin} ${token}`;
    return null;
  })();

  const { chakra700, chakra500, satoshi400, satoshi500, background } =
    await ogAssets;
  const bgBuffer = background ?? null;

  const bgDataUrl = bgBuffer
    ? `url(data:image/png;base64,${Buffer.from(bgBuffer).toString("base64")})`
    : undefined;

  return new ImageResponse(
    (
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
          {/* Sidebar */}
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
                src={orgLogo}
                width={140}
                height={140}
                alt={orgLogo}
                style={{ borderRadius: 9999 }}
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
          {/* Main */}
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
                🖋️ Grant
              </div>
              <div
                style={{
                  fontFamily: "Chakra Petch",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: "4px",
                }}
              >
                OPENTRIBE
              </div>
            </div>
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
                  fontWeight: 700,
                  fontSize: 60,
                  color: "#fff",
                  lineHeight: 1.12,
                }}
              >
                {title}
              </div>
            </div>
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
                {`${range || ""}${range && org ? " | " : ""}${org || ""}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
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
