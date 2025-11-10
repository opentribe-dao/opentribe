import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailHighlight,
  EmailText,
} from "./components";

interface BountyDeadlineReminderEmailProps {
  readonly recipientName: string;
  readonly bountyTitle: string;
  readonly deadline: string;
  readonly daysRemaining: number;
  readonly submissionCount: number;
  readonly totalPrize: string;
  readonly reviewUrl: string;
  readonly unsubscribeUrl?: string;
}

export const BountyDeadlineReminderEmail = ({
  recipientName,
  bountyTitle,
  deadline,
  daysRemaining,
  submissionCount,
  totalPrize,
  reviewUrl,
  unsubscribeUrl,
}: BountyDeadlineReminderEmailProps) => (
  <BaseTemplate
    preview={`Bounty deadline approaching - ${daysRemaining} days left`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>Bounty Deadline Approaching ⏰</EmailHeading>

    <EmailText>Hi {recipientName},</EmailText>

    <EmailText className="mt-4">
      Your bounty <strong>"{bountyTitle}"</strong> deadline is approaching. You
      have <strong>{daysRemaining} days</strong> to review submissions and
      prepare for winner selection.
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="mb-3 font-semibold">Bounty Status</EmailText>
      <EmailHighlight label="Deadline" value={deadline} />
      <EmailHighlight
        label="Total Submissions"
        value={submissionCount.toString()}
      />
      <EmailHighlight label="Total Prize Pool" value={totalPrize} />
      <EmailHighlight label="Days Remaining" value={`${daysRemaining} days`} />
    </EmailCard>

    <EmailText className="mt-4">Now is a great time to:</EmailText>

    <EmailText className="text-sm">
      • Review all submissions
      <br />• Ask clarifying questions via comments
      <br />• Prepare your winner selection criteria
      <br />• Plan your announcement
    </EmailText>

    <EmailButton href={reviewUrl}>Review Submissions Now</EmailButton>

    <EmailDivider />

    <EmailText className="text-center text-sm text-white/60">
      After the deadline, we'll send you a reminder to announce winners. The
      community is excited to see the results!
    </EmailText>
  </BaseTemplate>
);

BountyDeadlineReminderEmail.PreviewProps = {
  recipientName: "David",
  bountyTitle: "Create Polkadot.js Tutorial",
  deadline: "March 15, 2024",
  daysRemaining: 3,
  submissionCount: 12,
  totalPrize: "$5,000 USDT",
  reviewUrl: "https://dashboard.opentribe.io/bounties/123/submissions",
};

export default BountyDeadlineReminderEmail;
