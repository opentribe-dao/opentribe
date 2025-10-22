import { ImageResponse } from "next/og";
import { siteName, defaultDescription } from "@packages/seo/config";
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hasTitle = searchParams.has("title");
  const title = hasTitle
    ? (searchParams.get("title") || "").slice(0, 100)
    : siteName;

  const [chakra700, chakra500, satoshi400, satoshi500] = await Promise.all([
    fontChakra700,
    fontChakra500,
    fontSatoshi400,
    fontSatoshi500,
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 60% at 20% 10%, rgba(230,0,122,0.35) 0%, rgba(230,0,122,0) 70%), radial-gradient(50% 50% at 80% 90%, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: 80,
            textAlign: "center",
          }}
        >
          {/* Wordmark */}
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

          {/* Title */}
          <div
            style={{
              fontFamily: "Chakra Petch",
              fontWeight: 700,
              fontSize: 80,
              color: "#fff",
              lineHeight: 1.08,
            }}
          >
            {title}
          </div>
          {/* Subline */}
          <div
            style={{
              fontFamily: "Satoshi",
              fontWeight: 500,
              fontSize: 36,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 1000,
            }}
          >
            {defaultDescription}
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
