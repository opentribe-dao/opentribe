import { blog } from "@packages/cms";
import { loadOgAssets } from "@packages/seo/og-assets";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Shared OG assets (fonts + background)
const ogAssets = loadOgAssets();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = blog.getPost(slug);

  const title = post?._title ?? "Blog Post";
  const author = post?.authors?.[0] ?? "Opentribe";
  const date = post?.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Adjust title size based on length
  const tLen = title.length;
  const titleSize = tLen > 60 ? 44 : tLen > 40 ? 52 : 60;

  const {
    chakra700,
    chakra500,
    satoshi400,
    satoshi500,
    satoshi700,
    background,
    logomark,
  } = await ogAssets;
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
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.1)",
              fontFamily: "Chakra Petch",
              fontWeight: 700,
              fontSize: 48,
              color: "#fff",
            }}
          >
            📰
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            height: 520,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          {/* Top row: Label + Wordmark */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Category label */}
            <div
              style={{
                fontFamily: "Satoshi",
                fontWeight: 500,
                fontSize: 24,
                color: "#E6007A",
              }}
            >
              📰 Blog Post
            </div>
            {/* Logo + Wordmark */}
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
                  color: "#fff",
                  letterSpacing: 4,
                }}
              >
                OPENTRIBE
              </div>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: "Chakra Petch",
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.2,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {title}
          </div>

          {/* Bottom metadata: Author + Date */}
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
              {`By ${author}${date ? " · " : ""}${date || ""}`}
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
        { name: "Satoshi", data: satoshi700, style: "normal", weight: 700 },
        { name: "Satoshi", data: satoshi500, style: "normal", weight: 500 },
        { name: "Satoshi", data: satoshi400, style: "normal", weight: 400 },
      ],
    }
  );
}
