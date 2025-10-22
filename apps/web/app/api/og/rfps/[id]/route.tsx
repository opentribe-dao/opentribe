import { ImageResponse } from "next/og";
import { siteName } from "@packages/seo/config";
import { env } from "@/env";
import fs from "node:fs/promises";
import { createRequire } from "node:module";

export const runtime = "nodejs";
const require = createRequire(import.meta.url);

const fontChakra700 = fs.readFile(
  require.resolve("@packages/base/fonts/ChakraPetch-Bold.ttf")
);
const fontChakra500 = fs.readFile(
  require.resolve("@packages/base/fonts/ChakraPetch-Medium.ttf")
);
const fontSatoshi400 = fs.readFile(
  require.resolve("@packages/base/fonts/Satoshi-Regular.otf")
);
const fontSatoshi500 = fs.readFile(
  require.resolve("@packages/base/fonts/Satoshi-Medium.otf")
);
// Local background image (public/images/og-background.png)
const bgImage = fs.readFile(
  new URL("../../../../../public/images/og-background.png", import.meta.url)
);

async function getRfp(id: string) {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/rfps/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.rfp as {
    title?: string;
    organization?: { name?: string; logo?: string };
    grant?: {
      title?: string;
      logoUrl?: string;
      organization?: { name?: string; logo?: string };
    };
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rfp = await getRfp(id);
  const title = rfp?.title ?? "RFP";
  const org =
    (rfp as any)?.grant?.organization?.name ||
    rfp?.organization?.name ||
    siteName;
  const orgLogo =
    (rfp as any)?.grant?.organization?.logo ||
    (rfp as any)?.grant?.logoUrl ||
    rfp?.organization?.logo ||
    null;
  const grantTitle = (rfp as any)?.grant?.title || "";
  const grantOrg = (rfp as any)?.grant?.organization?.name || "";
  const grantLine = `${(grantTitle || "").slice(0, 50)}${grantOrg ? ` | ${grantOrg}` : ""}`;

  const [chakra700, chakra500, satoshi400, satoshi500] = await Promise.all([
    fontChakra700,
    fontChakra500,
    fontSatoshi400,
    fontSatoshi500,
  ]);
  const bgBuffer = await bgImage.catch(() => null);
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
                💡 RFP
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
                {grantLine}
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
