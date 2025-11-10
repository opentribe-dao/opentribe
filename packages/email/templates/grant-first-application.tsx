import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailHighlight,
  EmailText,
} from "./components";

interface GrantFirstApplicationEmailProps {
  readonly curatorName: string;
  readonly grantTitle: string;
  readonly applicantName: string;
  readonly applicationTitle: string;
  readonly applicationSummary: string;
  readonly requestedAmount: string;
  readonly viewApplicationUrl: string;
  readonly viewAllUrl: string;
  readonly unsubscribeUrl?: string;
}

export const GrantFirstApplicationEmail = ({
  curatorName,
  grantTitle,
  applicantName,
  applicationTitle,
  applicationSummary,
  requestedAmount,
  viewApplicationUrl,
  viewAllUrl,
  unsubscribeUrl,
}: GrantFirstApplicationEmailProps) => (
  <BaseTemplate
    preview={`First application received for "${grantTitle}"`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>First Grant Application! 📝</EmailHeading>

    <EmailText>Hi {curatorName},</EmailText>

    <EmailText className="mt-4">
      Exciting news! Your grant <strong>"{grantTitle}"</strong> just received
      its first application. This is a great start!
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="mb-3 font-semibold">Application Overview</EmailText>
      <EmailHighlight label="Applicant" value={applicantName} />
      <EmailHighlight label="Project Title" value={applicationTitle} />
      <EmailHighlight label="Requested Amount" value={requestedAmount} />

      <EmailText className="mt-3 text-sm text-white/60">Summary:</EmailText>
      <EmailText className="mt-1 text-sm">
        {applicationSummary.length > 200
          ? `${applicationSummary.substring(0, 200)}...`
          : applicationSummary}
      </EmailText>
    </EmailCard>

    <EmailButton href={viewApplicationUrl}>Review This Application</EmailButton>

    <EmailButton href={viewAllUrl} variant="secondary">
      View All Applications
    </EmailButton>

    <EmailDivider />

    <EmailText className="text-center text-sm text-white/60">
      Take your time to review applications thoroughly. Good grant curation
      helps build a stronger Polkadot ecosystem.
    </EmailText>
  </BaseTemplate>
);

GrantFirstApplicationEmail.PreviewProps = {
  curatorName: "Sofia",
  grantTitle: "Substrate Development Grant",
  applicantName: "Alice Chen",
  applicationTitle: "DeFi Lending Protocol on Substrate",
  applicationSummary:
    "We propose to build a decentralized lending protocol using Substrate that enables cross-chain collateral from multiple parachains. Our team has extensive experience in DeFi development and Substrate runtime engineering.",
  requestedAmount: "$30,000",
  viewApplicationUrl:
    "https://dashboard.opentribe.io/grants/123/applications/456",
  viewAllUrl: "https://dashboard.opentribe.io/grants/123/applications",
};

export default GrantFirstApplicationEmail;
