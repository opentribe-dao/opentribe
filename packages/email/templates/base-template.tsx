import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://opentribe.io";
const LOGOMARK_URL = `${BASE_URL}/logomark.png`;
const WORDMARK_URL = `${BASE_URL}/wordmark-dark.png`;

const colorSchemeStyles = `
  :root {
    color-scheme: dark;
    supported-color-schemes: dark;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #040308 !important;
  }
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #040308 !important;
      color: #ffffff !important;
    }
  }
`;

const outerCellStyle: CSSProperties = {
  padding: "36px 16px 48px",
  backgroundColor: "#040308",
  backgroundImage:
    "radial-gradient(circle at top, rgba(230, 0, 122, 0.12), rgba(4,3,8,0.96) 55%)",
};

const innerTableStyle: CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  borderSpacing: 0,
};

const cardTableStyle: CSSProperties = {
  width: "100%",
  borderSpacing: 0,
  backgroundColor: "#11101b",
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 35px 120px rgba(0,0,0,0.55)",
};

const cardCellStyle: CSSProperties = {
  padding: "40px 44px",
  borderRadius: "28px",
};

const footerTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  fontSize: "13px",
  lineHeight: "20px",
};

type BaseTemplateProps = {
  readonly preview: string;
  readonly children: ReactNode;
  readonly unsubscribeUrl?: string;
};

export const BaseTemplate = ({
  preview,
  children,
  unsubscribeUrl,
}: BaseTemplateProps) => (
  <Tailwind>
    <Html>
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{colorSchemeStyles}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="bg-black font-sans"
        data-ogsc="dark"
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          backgroundColor: "#040308",
        }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          width="100%"
          style={{ width: "100%", borderSpacing: 0 }}
        >
          <tbody>
            <tr>
              <td align="center" style={outerCellStyle}>
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  role="presentation"
                  style={innerTableStyle}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td align="center" style={{ paddingBottom: "28px" }}>
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          role="presentation"
                          style={{ margin: "0 auto" }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ paddingRight: "6px" }}>
                                <Img
                                  alt="Opentribe logomark"
                                  height="28"
                                  src={LOGOMARK_URL}
                                  width="28"
                                  style={{
                                    display: "block",
                                    border: "0",
                                    outline: "none",
                                    height: "28px",
                                    width: "28px",
                                  }}
                                />
                              </td>
                              <td>
                                <Img
                                  alt="Opentribe"
                                  height="16"
                                  src={WORDMARK_URL}
                                  width="160"
                                  style={{
                                    display: "block",
                                    border: "0",
                                    outline: "none",
                                    height: "16px",
                                    width: "160px",
                                  }}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Card */}
                    <tr>
                      <td>
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          role="presentation"
                          style={cardTableStyle}
                        >
                          <tbody>
                            <tr>
                              <td style={cardCellStyle}>{children}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td align="center" style={{ paddingTop: "32px" }}>
                        <Text style={footerTextStyle}>
                          © {new Date().getFullYear()} Opentribe. All rights
                          reserved.
                        </Text>
                        <Text style={{ ...footerTextStyle, marginTop: "4px" }}>
                          The Talent Layer for Polkadot Ecosystem
                        </Text>
                        {unsubscribeUrl && (
                          <Link
                            href={unsubscribeUrl}
                            style={{
                              ...footerTextStyle,
                              display: "inline-block",
                              marginTop: "12px",
                              textDecoration: "underline",
                            }}
                          >
                            Unsubscribe from these emails
                          </Link>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  </Tailwind>
);

export default BaseTemplate;
