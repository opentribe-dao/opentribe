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
} from '@react-email/components';

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
      <Body className="bg-black font-sans">
        <Container className="mx-auto max-w-[600px] py-12">
          {/* Header */}
          <Section className="mb-8 text-center">
            <Img
              src="https://opentribe.io/logo.png"
              alt="Opentribe"
              className="mx-auto h-12"
            />
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
                href={unsubscribeUrl}
                className="mt-4 inline-block text-sm text-white/40 underline"
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