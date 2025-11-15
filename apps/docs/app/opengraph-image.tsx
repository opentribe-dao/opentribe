import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Opentribe Documentation";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OGImage() {
  // Get the base URL for assets
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3004";

  const backgroundUrl = `${baseUrl}/og-assets/og-background.png`;
  const logomarkUrl = `${baseUrl}/og-assets/logomark.svg`;

  // Load fonts from local files in the same directory
  const chakraPetchFont = await fetch(
    new URL("../public/fonts/ChakraPetch-Bold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const satoshiRegularFont = await fetch(
    new URL("../public/fonts/Satoshi-Regular.otf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const satoshiBoldFont = await fetch(
    new URL("../public/fonts/Satoshi-Bold.otf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {/* Dark overlay for better text contrast */}
        <div
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "0 64px",
            position: "relative",
          }}
        >
          {/* Logo and title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            {/* Logo image */}
            <img
              src={logomarkUrl}
              alt="Opentribe"
              style={{
                width: "96px",
                height: "96px",
                marginBottom: "24px",
              }}
            />
            <h1
              style={{
                fontSize: "72px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.3em",
                margin: 0,
                fontFamily: "Chakra Petch",
                textTransform: "uppercase",
              }}
            >
              OPENTRIBE
            </h1>
            <div
              style={{
                fontSize: "20px",
                color: "rgba(255, 255, 255, 0.7)",
                marginTop: "12px",
                fontFamily: "Chakra Petch",
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              DOCS
            </div>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: "20px",
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              maxWidth: "768px",
              marginTop: "24px",
              marginBottom: "48px",
              fontFamily: "Satoshi",
            }}
          >
            Complete guides for builders and organizations in the Polkadot
            ecosystem
          </p>

          {/* Feature chips */}
          <div style={{ display: "flex", gap: "16px" }}>
            {["Getting Started", "Payment Guides", "Integrations"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    padding: "10px 20px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      color: "rgba(255, 255, 255, 0.9)",
                      fontFamily: "'Satoshi', sans-serif",
                    }}
                  >
                    {feature}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Bottom branding */}
          <div
            style={{
              position: "absolute",
              bottom: "48px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "14px",
                fontFamily: "'Satoshi', sans-serif",
              }}
            >
              docs.opentribe.io
            </div>
            <div
              style={{
                display: "block",
                width: "1px",
                height: "16px",
                background: "rgba(255, 255, 255, 0.4)",
              }}
            />
            <div
              style={{
                display: "flex",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "14px",
                fontFamily: "'Satoshi', sans-serif",
              }}
            >
              Talent Marketplace for Polkadot
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Chakra Petch",
          data: chakraPetchFont,
          style: "normal",
          weight: 700,
        },
        {
          name: "Satoshi",
          data: satoshiRegularFont,
          style: "normal",
          weight: 400,
        },
        {
          name: "Satoshi",
          data: satoshiBoldFont,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
