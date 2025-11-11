import { Section } from "@react-email/components";
import React from "react";
import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailHighlight,
  EmailLink,
  EmailText,
} from "./components";

interface Opportunity {
  readonly title: string;
  readonly organization: string;
  readonly amount: string;
  readonly url: string;
}

interface WeeklyDigestEmailProps {
  readonly recipientName: string;
  readonly weekStartDate: string;
  readonly newBounties: Opportunity[];
  readonly newGrants: Opportunity[];
  readonly applicationUpdates: {
    readonly title: string;
    readonly status: string;
    readonly url: string;
  }[];
  readonly platformStats: {
    readonly totalOpportunities: number;
    readonly totalPrizePool: string;
    readonly activeBuilders: number;
  };
  readonly dashboardUrl: string;
  readonly unsubscribeUrl?: string;
}

export const WeeklyDigestEmail = ({
  recipientName,
  weekStartDate,
  newBounties,
  newGrants,
  applicationUpdates,
  platformStats,
  dashboardUrl,
  unsubscribeUrl,
}: WeeklyDigestEmailProps) => (
  <BaseTemplate
    preview="Your Opentribe weekly digest"
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>Your Weekly Opentribe Digest 📊</EmailHeading>

    <EmailText>Hi {recipientName},</EmailText>

    <EmailText className="mt-4">
      Here's what's happening in the Polkadot ecosystem for the week of{" "}
      {weekStartDate}:
    </EmailText>

    <EmailDivider />

    {/* New Opportunities */}
    {(newBounties.length > 0 || newGrants.length > 0) && (
      <React.Fragment>
        <EmailText className="mb-4 font-semibold text-lg">
          🆕 New Opportunities
        </EmailText>

        {newBounties.length > 0 && (
          <EmailCard className="mb-4">
            <EmailText className="mb-3 font-semibold">Fresh Bounties</EmailText>
            {newBounties.map((bounty, idx) => (
              <Section className="mb-3 last:mb-0" key={idx}>
                <EmailLink href={bounty.url}>{bounty.title}</EmailLink>
                <EmailText className="mt-1 text-white/60 text-xs">
                  {bounty.organization} • {bounty.amount}
                </EmailText>
              </Section>
            ))}
          </EmailCard>
        )}

        {newGrants.length > 0 && (
          <EmailCard>
            <EmailText className="mb-3 font-semibold">
              Grant Opportunities
            </EmailText>
            {newGrants.map((grant, idx) => (
              <Section className="mb-3 last:mb-0" key={idx}>
                <EmailLink href={grant.url}>{grant.title}</EmailLink>
                <EmailText className="mt-1 text-white/60 text-xs">
                  {grant.organization} • Up to {grant.amount}
                </EmailText>
              </Section>
            ))}
          </EmailCard>
        )}

        <EmailDivider />
      </React.Fragment>
    )}

    {/* Application Updates */}
    {applicationUpdates.length > 0 && (
      <React.Fragment>
        <EmailText className="mb-4 font-semibold text-lg">
          📋 Your Application Updates
        </EmailText>

        <EmailCard>
          {applicationUpdates.map((update, idx) => (
            <Section className="mb-3 last:mb-0" key={idx}>
              <EmailLink href={update.url}>{update.title}</EmailLink>
              <EmailText className="mt-1 text-xs">
                Status:{" "}
                <span className="font-semibold text-pink-400">
                  {update.status}
                </span>
              </EmailText>
            </Section>
          ))}
        </EmailCard>

        <EmailDivider />
      </React.Fragment>
    )}

    {/* Platform Stats */}
    <EmailText className="mb-4 font-semibold text-lg">
      📈 Ecosystem Pulse
    </EmailText>

    <EmailCard>
      <EmailHighlight
        label="Total Active Opportunities"
        value={platformStats.totalOpportunities.toString()}
      />
      <EmailHighlight
        label="Total Prize Pool"
        value={platformStats.totalPrizePool}
      />
      <EmailHighlight
        label="Active Builders This Week"
        value={platformStats.activeBuilders.toString()}
      />
    </EmailCard>

    <EmailButton href={dashboardUrl}>Visit Your Dashboard</EmailButton>

    <EmailDivider />

    <EmailText className="text-center text-sm text-white/60">
      Stay active to increase your chances of winning bounties and grants. The
      Polkadot ecosystem is growing, and so are the opportunities!
    </EmailText>
  </BaseTemplate>
);

WeeklyDigestEmail.PreviewProps = {
  recipientName: "Alice",
  weekStartDate: "March 11, 2024",
  newBounties: [
    {
      title: "Build a Substrate Pallet Tutorial",
      organization: "Parity Technologies",
      amount: "$3,000 USDT",
      url: "https://opentribe.io/bounties/abc123",
    },
    {
      title: "Create Polkadot.js Integration Guide",
      organization: "Web3 Foundation",
      amount: "$2,000 DOT",
      url: "https://opentribe.io/bounties/def456",
    },
  ],
  newGrants: [
    {
      title: "Infrastructure Development Grant",
      organization: "Polkadot Treasury",
      amount: "$50,000",
      url: "https://opentribe.io/grants/ghi789",
    },
  ],
  applicationUpdates: [
    {
      title: "DeFi Protocol Development",
      status: "Under Review",
      url: "https://opentribe.io/applications/123",
    },
  ],
  platformStats: {
    totalOpportunities: 47,
    totalPrizePool: "$250,000",
    activeBuilders: 312,
  },
  dashboardUrl: "https://dashboard.opentribe.io",
};

export default WeeklyDigestEmail;
