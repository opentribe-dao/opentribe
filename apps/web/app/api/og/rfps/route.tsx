import { loadOgAssets } from "@packages/seo/og-assets";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Load shared fonts/background from seo package
const ogAssets = loadOgAssets();

export async function GET() {
  const {
    chakra700,
    chakra500,
    satoshi400,
    satoshi500,
    satoshi700,
    background,
    organizationIllustration,
    logomark,
  } = await ogAssets;
  const bgBuffer = background ?? null;
  const bgDataUrl = bgBuffer
    ? `url(data:image/png;base64,${Buffer.from(bgBuffer).toString("base64")})`
    : undefined;
  const orgSrc = organizationIllustration
    ? `data:image/png;base64,${Buffer.from(organizationIllustration).toString("base64")}`
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
        backgroundImage: bgDataUrl,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Frame */}
      <div
        style={{
          width: 1100,
          height: 520,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left text block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
          {/* Logo + Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logomarkSrc && (
              <img
                alt="Opentribe"
                height={46}
                src={logomarkSrc}
                style={{ display: "block" }}
                width={40}
              />
            )}
            <div
              style={{
                fontFamily: "Chakra Petch",
                fontWeight: 700,
                fontSize: 28,
                color: "#fff",
                letterSpacing: 4,
              }}
            >
              OPENTRIBE
            </div>
          </div>
          {/* Headline (Satoshi bold) */}
          <div
            style={{
              fontFamily: "Satoshi",
              fontWeight: 700,
              fontSize: 52,
              color: "#fff",
              lineHeight: 1.18,
              maxWidth: 600,
            }}
          >
            💡 Submit Proposals for Polkadot Projects
          </div>
          {/* CTA chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 420,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              fontFamily: "Chakra Petch",
              fontWeight: 700,
              fontSize: 24,
              color: "#fff",
            }}
          >
            https://opentribe.io/rfps
          </div>
        </div>
        {/* Right illustration */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            height: 420,
          }}
        >
          {orgSrc && (
            <img
              alt="Organization"
              height={420}
              src={orgSrc}
              style={{ objectFit: "contain" }}
              width={420}
            />
          )}
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
        { name: "Satoshi", data: satoshi700, style: "normal", weight: 700 },
        { name: "Satoshi", data: satoshi500, style: "normal", weight: 500 },
        { name: "Satoshi", data: satoshi400, style: "normal", weight: 400 },
      ],
    }
  );
}
