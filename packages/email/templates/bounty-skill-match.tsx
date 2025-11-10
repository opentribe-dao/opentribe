import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailHighlight,
  EmailText,
} from "./components";

interface BountySkillMatchEmailProps {
  readonly recipientName: string;
  readonly bountyTitle: string;
  readonly organizationName: string;
  readonly matchingSkills: string[];
  readonly bountyDescription: string;
  readonly prizeAmount: string;
  readonly deadline: string;
  readonly bountyUrl: string;
  readonly unsubscribeUrl?: string;
}

export const BountySkillMatchEmail = ({
  recipientName,
  bountyTitle,
  organizationName,
  matchingSkills,
  bountyDescription,
  prizeAmount,
  deadline,
  bountyUrl,
  unsubscribeUrl,
}: BountySkillMatchEmailProps) => (
  <BaseTemplate
    preview={`New bounty matches your skills: ${bountyTitle}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>Perfect Match Found! 🎯</EmailHeading>

    <EmailText>Hi {recipientName},</EmailText>

    <EmailText className="mt-4">
      A new bounty from <strong>{organizationName}</strong> perfectly matches
      your skills!
    </EmailText>

    <EmailDivider />

    <EmailCard className="border border-pink-500/30">
      <EmailText className="mb-3 font-semibold text-lg">
        {bountyTitle}
      </EmailText>

      <EmailText className="mb-4 text-sm text-white/80">
        {bountyDescription.length > 150
          ? `${bountyDescription.substring(0, 150)}...`
          : bountyDescription}
      </EmailText>

      <EmailHighlight label="Prize" value={prizeAmount} />
      <EmailHighlight label="Deadline" value={deadline} />
    </EmailCard>

    <EmailCard className="mt-4 bg-pink-500/10">
      <EmailText className="mb-2 font-semibold">
        🎨 Your Matching Skills
      </EmailText>
      <EmailText className="text-sm">{matchingSkills.join(" • ")}</EmailText>
    </EmailCard>

    <EmailButton href={bountyUrl}>View Bounty Details</EmailButton>

    <EmailDivider />

    <EmailText className="text-center text-sm text-white/60">
      This bounty was matched based on your profile skills. Keep your skills
      updated to receive the most relevant opportunities.
    </EmailText>
  </BaseTemplate>
);

BountySkillMatchEmail.PreviewProps = {
  recipientName: "Alice",
  bountyTitle: "Build Cross-chain Bridge UI",
  organizationName: "Interlay",
  matchingSkills: ["React", "TypeScript", "Web3.js", "UI/UX"],
  bountyDescription:
    "We need an experienced frontend developer to build a user-friendly interface for our cross-chain bridge. The UI should support Bitcoin to Polkadot transfers with real-time status updates.",
  prizeAmount: "$5,000 USDT",
  deadline: "April 15, 2024",
  bountyUrl: "https://opentribe.io/bounties/xyz123",
};

export default BountySkillMatchEmail;
