import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailHighlight,
} from './components';

interface BountyWinnerEmailProps {
  readonly winnerName: string;
  readonly bountyTitle: string;
  readonly organizationName: string;
  readonly position: number;
  readonly prizeAmount: string;
  readonly token: string;
  readonly submissionUrl: string;
  readonly profileUrl: string;
}

export const BountyWinnerEmail = ({
  winnerName,
  bountyTitle,
  organizationName,
  position,
  prizeAmount,
  token,
  submissionUrl,
  profileUrl,
}: BountyWinnerEmailProps) => {
  const positionEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏆';
  const positionText = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
  
  return (
    <BaseTemplate preview="Congratulations! You won a bounty 🎉">
      <EmailHeading>Congratulations, {winnerName}! 🎉</EmailHeading>
      
      <EmailText className="mt-4 text-lg">
        Amazing news! You've won <strong>{positionText} place</strong> in the bounty:
      </EmailText>
      
      <EmailCard className="mt-4 border border-yellow-500/30 bg-yellow-500/10">
        <EmailText className="text-center text-4xl mb-2">{positionEmoji}</EmailText>
        <EmailText className="text-center font-semibold text-lg">
          {bountyTitle}
        </EmailText>
        <EmailText className="text-center text-sm text-white/60 mt-1">
          by {organizationName}
        </EmailText>
      </EmailCard>

      <EmailDivider />

      <EmailCard>
        <EmailText className="font-semibold mb-3">Your Prize</EmailText>
        <EmailHighlight label="Position" value={`${positionText} Place`} />
        <EmailHighlight label="Prize Amount" value={`${prizeAmount} ${token}`} />
        
        <EmailText className="mt-3 text-sm text-white/60">
          The organization will contact you soon with payment details.
        </EmailText>
      </EmailCard>

      <EmailButton href={submissionUrl}>
        View Your Winning Submission
      </EmailButton>

      <EmailButton href={profileUrl} variant="secondary">
        Update Your Profile
      </EmailButton>

      <EmailDivider />

      <EmailText className="text-center">
        🌟 This win has been added to your profile!
      </EmailText>
      
      <EmailText className="text-sm text-white/60 text-center mt-4">
        Share your success with the community and keep building. 
        The Polkadot ecosystem needs talented builders like you!
      </EmailText>
    </BaseTemplate>
  );
};

BountyWinnerEmail.PreviewProps = {
  winnerName: 'Alice',
  bountyTitle: 'Create Polkadot.js Tutorial',
  organizationName: 'Polkadot Builders DAO',
  position: 1,
  prizeAmount: '2,000',
  token: 'USDT',
  submissionUrl: 'https://opentribe.io/bounties/123/submissions/456',
  profileUrl: 'https://opentribe.io/profile/alice',
};

export default BountyWinnerEmail;