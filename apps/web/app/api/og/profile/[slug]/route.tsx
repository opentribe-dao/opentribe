import { siteName } from "@packages/seo/config";
import { loadOgAssets } from "@packages/seo/og-assets";
import { ImageResponse } from "next/og";
import { env } from "@/env";

export const runtime = "nodejs";

const ogAssets = loadOgAssets();

interface ProfileData {
  type: "user" | "ecosystem";
  data: {
    user?: {
      name?: string;
      username?: string;
      image?: string | null;
      skills?: string[];
      headline?: string | null;
    };
    displayName?: string;
    slug?: string;
    image?: string | null;
    skills?: string[];
    bio?: string | null;
    source?: string | null;
  };
}

async function getProfile(slug: string): Promise<ProfileData | null> {
  try {
    if (!env.NEXT_PUBLIC_API_URL) return null;
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/profiles/${slug}/public`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  const isEcosystem = profile?.type === "ecosystem";
  const name = isEcosystem
    ? profile?.data?.displayName
    : profile?.data?.user?.name;
  const title = name || "Profile";
  const profileImage = isEcosystem
    ? profile?.data?.image
    : profile?.data?.user?.image;
  const skills = isEcosystem
    ? profile?.data?.skills
    : profile?.data?.user?.skills;
  const subtitle = isEcosystem
    ? profile?.data?.source || "Ecosystem Contributor"
    : profile?.data?.user?.headline || "";

  const { chakra700, chakra500, satoshi400, satoshi500, background, logomark } =
    await ogAssets;
  const bgBuffer = background ?? null;

  const bgDataUrl = bgBuffer
    ? `url(data:image/png;base64,${Buffer.from(bgBuffer).toString("base64")})`
    : undefined;
  const logomarkSrc = logomark
    ? `data:image/svg+xml;base64,${Buffer.from(logomark).toString("base64")}`
    : undefined;

  // Build skills display (max 4 skills)
  const displaySkills = (skills || []).slice(0, 4);

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
        {/* Sidebar with avatar */}
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
          {profileImage ? (
            <img
              alt={title}
              height={140}
              src={profileImage}
              style={{ borderRadius: 9999 }}
              width={140}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 9999,
                background: "linear-gradient(135deg, #E6007A, #7B2FBF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Chakra Petch",
                fontWeight: 700,
                fontSize: 56,
                color: "#fff",
              }}
            >
              {title[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Main content */}
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
              {isEcosystem ? "Ecosystem Profile" : "Builder Profile"}
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

          {/* Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 240,
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: "Chakra Petch",
                fontWeight: 700,
                fontSize: title.length > 30 ? 48 : 60,
                color: "#fff",
                lineHeight: 1.12,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: "Satoshi",
                  fontWeight: 400,
                  fontSize: 24,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Bottom row: skills or source badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 12,
            }}
          >
            {displaySkills.length > 0 ? (
              displaySkills.map((skill) => (
                <div
                  key={skill}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    backgroundColor: "rgba(230,0,122,0.2)",
                    fontFamily: "Satoshi",
                    fontWeight: 500,
                    fontSize: 18,
                    color: "#fff",
                  }}
                >
                  {skill}
                </div>
              ))
            ) : (
              <div
                style={{
                  fontFamily: "Satoshi",
                  fontWeight: 500,
                  fontSize: 22,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {siteName}
              </div>
            )}
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
        {
          name: "Chakra Petch",
          data: chakra700,
          style: "normal",
          weight: 700,
        },
        {
          name: "Chakra Petch",
          data: chakra500,
          style: "normal",
          weight: 500,
        },
        { name: "Satoshi", data: satoshi400, style: "normal", weight: 400 },
        { name: "Satoshi", data: satoshi500, style: "normal", weight: 500 },
      ],
    }
  );
}
