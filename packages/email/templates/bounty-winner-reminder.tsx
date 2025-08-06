import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailHighlight,
} from './components';

interface BountyWinnerReminderEmailProps {
  readonly recipientName: string;
  readonly bountyTitle: string;
  readonly daysPastDeadline: number;
  readonly submissionCount: number;
  readonly totalPrize: string;
  readonly announceUrl: string;
  readonly unsubscribeUrl?: string;
}

export const BountyWinnerReminderEmail = ({
  recipientName,
  bountyTitle,
  daysPastDeadline,
  submissionCount,
  totalPrize,
  announceUrl,
  unsubscribeUrl,
}: BountyWinnerReminderEmailProps) => (
  <BaseTemplate 
    preview="Time to announce bounty winners!"
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>Time to Announce Winners! 🏆</EmailHeading>
    
    <EmailText>
      Hi {recipientName},
    </EmailText>
    
    <EmailText className="mt-4">
      Your bounty <strong>"{bountyTitle}"</strong> ended {daysPastDeadline} days ago. 
      The community is eagerly waiting for the results!
    </EmailText>

    <EmailDivider />

    <EmailCard className="border border-yellow-500/30 bg-yellow-500/10">
      <EmailText className="font-semibold mb-3 text-yellow-400">
        ⚡ Action Required
      </EmailText>
      <EmailText className="text-sm">
        {submissionCount} builders submitted their work and are waiting to hear back. 
        Announcing winners promptly helps maintain community trust and engagement.
      </EmailText>
    </EmailCard>

    <EmailCard className="mt-4">
      <EmailHighlight label="Total Submissions" value={submissionCount.toString()} />
      <EmailHighlight label="Prize Pool to Distribute" value={totalPrize} />
      <EmailHighlight label="Days Since Deadline" value={`${daysPastDeadline} days`} />
    </EmailCard>

    <EmailButton href={announceUrl}>
      Select Winners Now
    </EmailButton>

    <EmailDivider />

    <EmailText className="text-sm text-white/60">
      Need help selecting winners? Here are some tips:
    </EmailText>
    
    <EmailText className="text-sm text-white/60">
      • Review submission quality and completeness<br />
      • Check if requirements were met<br />
      • Consider community engagement (likes & comments)<br />
      • Distribute prizes according to your tier structure
    </EmailText>
  </BaseTemplate>
);

BountyWinnerReminderEmail.PreviewProps = {
  recipientName: 'David',
  bountyTitle: 'Create Polkadot.js Tutorial',
  daysPastDeadline: 7,
  submissionCount: 12,
  totalPrize: '$5,000 USDT',
  announceUrl: 'https://dashboard.opentribe.io/bounties/123/announce-winners',
};

export default BountyWinnerReminderEmail;