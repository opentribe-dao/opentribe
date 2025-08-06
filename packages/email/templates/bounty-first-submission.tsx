import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailHighlight,
} from './components';

interface BountyFirstSubmissionEmailProps {
  readonly recipientName: string;
  readonly bountyTitle: string;
  readonly submitterName: string;
  readonly submissionTitle: string;
  readonly submissionPreview: string;
  readonly viewSubmissionUrl: string;
  readonly viewAllUrl: string;
  readonly unsubscribeUrl?: string;
}

export const BountyFirstSubmissionEmail = ({
  recipientName,
  bountyTitle,
  submitterName,
  submissionTitle,
  submissionPreview,
  viewSubmissionUrl,
  viewAllUrl,
  unsubscribeUrl,
}: BountyFirstSubmissionEmailProps) => (
  <BaseTemplate 
    preview={`First submission received for "${bountyTitle}"`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>First Submission Received! 🎯</EmailHeading>
    
    <EmailText>
      Hi {recipientName},
    </EmailText>
    
    <EmailText className="mt-4">
      Great news! Your bounty <strong>"{bountyTitle}"</strong> just received its 
      first submission. The momentum is building!
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="font-semibold mb-3">Submission Details</EmailText>
      <EmailHighlight label="Submitted by" value={submitterName} />
      <EmailHighlight label="Title" value={submissionTitle} />
      
      <EmailText className="mt-3 text-sm text-white/60">Preview:</EmailText>
      <EmailText className="mt-1 text-sm">
        {submissionPreview.length > 150 
          ? `${submissionPreview.substring(0, 150)}...` 
          : submissionPreview}
      </EmailText>
    </EmailCard>

    <EmailButton href={viewSubmissionUrl}>
      Review This Submission
    </EmailButton>

    <EmailButton href={viewAllUrl} variant="secondary">
      View All Submissions
    </EmailButton>

    <EmailDivider />

    <EmailText className="text-sm text-white/60 text-center">
      You'll continue to receive submissions until the deadline. We'll remind you 
      when it's time to announce winners.
    </EmailText>
  </BaseTemplate>
);

BountyFirstSubmissionEmail.PreviewProps = {
  recipientName: 'David',
  bountyTitle: 'Create Polkadot.js Tutorial',
  submitterName: 'Alice Chen',
  submissionTitle: 'Comprehensive Polkadot.js Guide with Examples',
  submissionPreview: 'I have created a detailed tutorial covering wallet integration, transaction signing, and chain queries with Polkadot.js. The guide includes 10+ code examples and a sample dApp.',
  viewSubmissionUrl: 'https://dashboard.opentribe.io/bounties/123/submissions/456',
  viewAllUrl: 'https://dashboard.opentribe.io/bounties/123/submissions',
};

export default BountyFirstSubmissionEmail;