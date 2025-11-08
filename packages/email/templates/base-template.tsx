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
      <Body
        className="bg-black font-sans"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(0, 0, 0, 0) 30%, rgba(59, 130, 246, 0.08) 100%)',
        }}
      >
        <Container
          className="mx-auto max-w-[600px] py-12"
          style={{
            background: 'radial-gradient(ellipse 800px 400px at 50% 0%, rgba(230, 0, 122, 0.04), transparent)',
          }}
        >
          {/* Header */}
          <Section className="mb-8 text-center">
            <table align="center" style={{ margin: '0 auto' }}>
              <tr>
                <td align="center">
                  <svg
                    viewBox="0 0 519 602"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="28"
                    style={{ display: 'inline-block', verticalAlign: 'middle' }}
                  >
                    <g clipPath="url(#clip0_676_89)">
                      <path
                        d="M95.5772 228.565L174.496 182.164L175.657 99.649L344.338 0.0923911C402.27 35.3139 462.073 67.8459 518.475 105.387L518.341 300.518L423.935 357.903L423.205 504.497L259.674 602L96.5946 505.236L95.5258 502.197L95.3717 357.092L0.17369 299.737L0.0195312 105.911L2.08525 102.842L175.236 0L232.264 33.5277L196.654 55.8966C193.365 56.2149 180.652 45.2717 176.788 44.1938C175.328 43.7831 174.311 43.7215 172.965 44.5428L37.1717 126.586V278.19L95.5772 313.771V228.565ZM423.421 227.539V312.744L482.022 278.138L481.487 125.909L344.379 44.2656L297.042 72.0035L344.132 100.922L344.471 182.206L423.441 227.539H423.421ZM308.151 121.967L259.509 94.1568L211.72 122.326L210.62 125.334L210.179 202.911L134.703 248.655L131.578 252.721L132.051 335.349L258.646 411.069C260.414 411.212 272.397 403.79 275.1 402.24C310.546 381.996 348.212 360.017 382.63 338.213C384.491 337.033 387.111 336.109 387.471 333.809L387.266 251.868L308.819 203.959L308.151 121.977V121.967ZM387.45 379.471L259.499 455.057L131.548 379.471V482.641L259.499 559.038L387.45 482.641V379.471Z"
                        fill="url(#paint0_linear_676_89)"
                      />
                      <path
                        d="M71.9406 446.198V489.314L0 445.685V338.408L36.4739 359.966L37.1727 424.979L71.9406 446.198Z"
                        fill="url(#paint1_linear_676_89)"
                      />
                      <path
                        d="M518.999 338.408V445.685L447.059 489.314V446.198L481.837 424.989L482.505 359.946L518.999 338.408Z"
                        fill="url(#paint2_linear_676_89)"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_676_89"
                        x1="259.247"
                        y1="0"
                        x2="259.247"
                        y2="602"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0.08" stopColor="white" />
                        <stop offset="1" stopColor="#999999" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_676_89"
                        x1="35.9703"
                        y1="338.408"
                        x2="35.9703"
                        y2="489.314"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0.08" stopColor="white" />
                        <stop offset="1" stopColor="#999999" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_676_89"
                        x1="483.029"
                        y1="338.408"
                        x2="483.029"
                        y2="489.314"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0.08" stopColor="white" />
                        <stop offset="1" stopColor="#999999" />
                      </linearGradient>
                      <clipPath id="clip0_676_89">
                        <rect width="519" height="602" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </td>
                <td align="center" style={{ paddingLeft: '8px' }}>
                  <span
                    style={{
                      background: 'linear-gradient(to right, rgba(255, 255, 255, 0.35), white)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      letterSpacing: '0.25em',
                      fontFamily: 'Arial, sans-serif',
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