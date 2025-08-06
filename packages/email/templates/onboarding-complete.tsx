import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailList,
} from './components';

interface OnboardingCompleteEmailProps {
  readonly firstName: string;
  readonly userType: 'builder' | 'organization';
  readonly exploreUrl: string;
  readonly profileUrl: string;
}

export const OnboardingCompleteEmail = ({
  firstName,
  userType,
  exploreUrl,
  profileUrl,
}: OnboardingCompleteEmailProps) => {
  const isBuilder = userType === 'builder';
  
  return (
    <BaseTemplate preview="Your Opentribe profile is ready!">
      <EmailHeading>Profile Complete! 🎊</EmailHeading>
      
      <EmailText>
        Congratulations {firstName}!
      </EmailText>
      
      <EmailText className="mt-4">
        Your {isBuilder ? 'Builder' : 'Organization'} profile is now live on Opentribe. 
        You're all set to {isBuilder ? 'explore opportunities' : 'start posting opportunities'} 
        in the Polkadot ecosystem.
      </EmailText>

      <EmailDivider />

      <EmailCard>
        <EmailText className="font-semibold text-lg mb-3">
          {isBuilder ? '💼 What you can do now:' : '🏢 Get started with:'}
        </EmailText>
        <EmailList items={
          isBuilder ? [
            'Browse and apply to grants',
            'Submit work to bounties',
            'Vote on RFPs that interest you',
            'Follow organizations you like',
          ] : [
            'Post your first bounty',
            'Create grant opportunities',
            'Invite team members',
            'Set up your organization profile',
          ]
        } />
      </EmailCard>

      <EmailButton href={exploreUrl}>
        {isBuilder ? 'Explore Opportunities' : 'Create First Bounty'}
      </EmailButton>

      <EmailButton href={profileUrl} variant="secondary">
        View Your Profile
      </EmailButton>

      <EmailDivider />

      <EmailText className="text-sm text-white/60 text-center">
        Pro tip: {isBuilder 
          ? 'Set up skill match notifications to get alerts about relevant opportunities.' 
          : 'Complete your organization description to attract top talent.'}
      </EmailText>
    </BaseTemplate>
  );
};

OnboardingCompleteEmail.PreviewProps = {
  firstName: 'Alice',
  userType: 'builder',
  exploreUrl: 'https://opentribe.io/bounties',
  profileUrl: 'https://opentribe.io/profile/alice',
};

export default OnboardingCompleteEmail;