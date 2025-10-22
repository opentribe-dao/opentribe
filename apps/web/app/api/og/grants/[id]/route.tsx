import { ImageResponse } from "next/og";
import { siteName } from "@packages/seo/config";
import { env } from "@/env";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { formatCurrency } from "@packages/base/lib/utils";

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
const bgImage = fs.readFile(
  new URL("../../../../../public/images/og-background.png", import.meta.url)
);

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

  const token = (grant as any)?.token || "DOT";
  const minRaw = (grant as any)?.minAmount;
  const maxRaw = (grant as any)?.maxAmount;
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

  const [chakra700, chakra500, satoshi400, satoshi500, bgBuffer] =
    await Promise.all([
      fontChakra700,
      fontChakra500,
      fontSatoshi400,
      fontSatoshi500,
      bgImage,
    ]);

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


<!-- HTML Meta Tags -->
<title>Sonic SVM Mascot: Sonunu Fanart contest | Superteam Earn</title>
<meta name="description" content="Bounty on Superteam Earn | Sonic is seeking freelancers and builders to work on Sonic SVM Mascot: Sonunu Fanart contest">

<!-- Facebook Meta Tags -->
<meta property="og:url" content="https://earn.superteam.fun/listing/sonunu-fanart">
<meta property="og:type" content="website">
<meta property="og:title" content="Sonic SVM Mascot: Sonunu Fanart contest | Superteam Earn">
<meta property="og:description" content="Bounty on Superteam Earn | Sonic is seeking freelancers and builders to work on Sonic SVM Mascot: Sonunu Fanart contest">
<meta property="og:image" content="https://earn.superteam.fun/api/dynamic-og/listing/?title=Sonic%2520SVM%2520Mascot%253A%2520Sonunu%2520Fanart%2520contest&reward=1000&token=USDC&sponsor=Sonic&logo=https%3A%2F%2Fres.cloudinary.com%2Fdgvnuwspr%2Fimage%2Fupload%2Fv1725277239%2Fearn-sponsor%2Fcsyapkfgudqkameoasfz.png&type=bounty&compensationType=fixed&minRewardAsk=&maxRewardAsk=&isSponsorVerified=false">

<!-- Twitter Meta Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta property="twitter:domain" content="earn.superteam.fun">
<meta property="twitter:url" content="https://earn.superteam.fun/listing/sonunu-fanart">
<meta name="twitter:title" content="Sonic SVM Mascot: Sonunu Fanart contest | Superteam Earn">
<meta name="twitter:description" content="Bounty on Superteam Earn | Sonic is seeking freelancers and builders to work on Sonic SVM Mascot: Sonunu Fanart contest">
<meta name="twitter:image" content="https://earn.superteam.fun/api/dynamic-og/listing/?title=Sonic%2520SVM%2520Mascot%253A%2520Sonunu%2520Fanart%2520contest&reward=1000&token=USDC&sponsor=Sonic&logo=https%3A%2F%2Fres.cloudinary.com%2Fdgvnuwspr%2Fimage%2Fupload%2Fv1725277239%2Fearn-sponsor%2Fcsyapkfgudqkameoasfz.png&type=bounty&compensationType=fixed&minRewardAsk=&maxRewardAsk=&isSponsorVerified=false">

<!-- Meta Tags Generated via https://www.opengraph.xyz --></meta>

<title>Create Substrate Pallet Tutorial Series — Community DAO Bou… | Opentribe</title><meta name="description" content="Win 10K DOT from Community DAO. Skills: smart-contracts, polkadot-sdk, photography. Deadline 2025-11-08. Submit on Opentribe."/><meta name="application-name" content="Opentribe"/><link rel="author" href="https://opentribe.io"/><meta name="author" content="Opentribe"/><meta name="keywords" content="polkadot,grants,bounties,rfps,web3 jobs,open source,dot,kusama,parachains,developer opportunities,talent marketplace"/><meta name="creator" content="Opentribe"/><meta name="publisher" content="Opentribe"/><link rel="canonical" href="http://localhost:3000/bounties/substrate-pallet-tutorials"/><meta property="og:title" content="Create Substrate Pallet Tutorial Series — Community DAO Bou… | Opentribe"/><meta property="og:description" content="Win 10K DOT from Community DAO. Skills: smart-contracts, polkadot-sdk, photography. Deadline 2025-11-08. Submit on Opentribe."/><meta property="og:url" content="http://localhost:3000/bounties/substrate-pallet-tutorials"/><meta property="og:site_name" content="Opentribe"/><meta property="og:image" content="http://localhost:3000/api/og/bounties/substrate-pallet-tutorials"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Create Substrate Pallet Tutorial Series — Community DAO Bou…"/><meta property="og:type" content="article"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:creator" content="@opentribe_io"/><meta name="twitter:title" content="Create Substrate Pallet Tutorial Series — Community DAO Bou… | Opentribe"/><meta name="twitter:description" content="Win 10K DOT from Community DAO. Skills: smart-contracts, polkadot-sdk, photography. Deadline 2025-11-08. Submit on Opentribe."/><meta name="twitter:image" content="http://localhost:3000/api/og/bounties/substrate-pallet-tutorials"/><link rel="icon" href="/en/icon.png?icon.99eff9f1.png" sizes="32x32" type="image/png"/><link rel="apple-touch-icon" href="/en/apple-icon.png?apple-icon.be30e690.png" sizes="192x192" type="image/png"/>