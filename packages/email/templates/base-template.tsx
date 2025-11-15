import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BaseTemplateProps {
  readonly preview: string;
  readonly children: React.ReactNode;
  readonly unsubscribeUrl?: string;
}

export const BaseTemplate = ({
  preview,
  children,
  unsubscribeUrl,
}: BaseTemplateProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        className="bg-black font-sans"
        style={{
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(0, 0, 0, 0) 30%, rgba(59, 130, 246, 0.08) 100%)",
        }}
      >
        <Container
          className="mx-auto max-w-[600px] py-12"
          style={{
            background:
              "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(230, 0, 122, 0.04), transparent)",
          }}
        >
          {/* Header */}
          <Section className="mb-8 text-center">
            <table align="center" style={{ margin: "0 auto" }}>
              <tr>
                <td align="center">
                  <Img
                    alt="Opentribe Logo"
                    height="28"
                    src="https://opentribe.io/logomark.png"
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                    width="28"
                  />
                </td>
                <td align="center" style={{ paddingLeft: "4px" }}>
                  <span
                    style={{
                      background:
                        "linear-gradient(to right, rgba(255, 255, 255, 0.35), white)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: "bold",
                      fontSize: "20px",
                      letterSpacing: "0.25em",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    OPENTRIBE
                  </span>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main Content */}
          <Section className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            {children}
          </Section>

          {/* Footer */}
          <Section className="mt-8 text-center">
            <Text className="text-sm text-white/40">
              © {new Date().getFullYear()} Opentribe. All rights reserved.
            </Text>
            <Text className="mt-2 text-sm text-white/40">
              The Talent Layer for Polkadot Ecosystem
            </Text>
            {unsubscribeUrl && (
              <Link
                className="mt-4 inline-block text-sm text-white/40 underline"
                href={unsubscribeUrl}
              >
                Unsubscribe from these emails
              </Link>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

export default BaseTemplate;
