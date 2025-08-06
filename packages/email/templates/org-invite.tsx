import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailHighlight,
} from './components';

interface OrgInviteEmailProps {
  readonly inviterName: string;
  readonly inviteeEmail: string;
  readonly organizationName: string;
  readonly organizationLogo?: string;
  readonly role: 'admin' | 'member';
  readonly inviteUrl: string;
}

export const OrgInviteEmail = ({
  inviterName,
  inviteeEmail,
  organizationName,
  organizationLogo,
  role,
  inviteUrl,
}: OrgInviteEmailProps) => (
  <BaseTemplate preview={`You're invited to join ${organizationName} on Opentribe`}>
    <EmailHeading>Organization Invitation 💌</EmailHeading>
    
    <EmailText>
      Hi there,
    </EmailText>
    
    <EmailText className="mt-4">
      {inviterName} has invited you to join <strong>{organizationName}</strong> on 
      Opentribe as {role === 'admin' ? 'an Administrator' : 'a Member'}.
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="font-semibold mb-3">Organization Details</EmailText>
      <EmailHighlight label="Organization" value={organizationName} />
      <EmailHighlight label="Your Role" value={role === 'admin' ? 'Administrator' : 'Member'} />
      <EmailHighlight label="Invited by" value={inviterName} />
    </EmailCard>

    {role === 'admin' && (
      <EmailCard className="mt-4">
        <EmailText className="font-semibold mb-2">As an Administrator, you'll be able to:</EmailText>
        <EmailText className="text-sm">
          • Create and manage bounties<br />
          • Review submissions<br />
          • Invite new members<br />
          • Update organization settings
        </EmailText>
      </EmailCard>
    )}

    <EmailButton href={inviteUrl}>
      Accept Invitation
    </EmailButton>

    <EmailDivider />

    <EmailText className="text-sm text-white/60">
      This invitation will expire in 7 days. If you don't have an Opentribe account yet, 
      you'll be prompted to create one when you accept the invitation.
    </EmailText>
  </BaseTemplate>
);

OrgInviteEmail.PreviewProps = {
  inviterName: 'David Chen',
  inviteeEmail: 'alice@example.com',
  organizationName: 'Polkadot Builders DAO',
  role: 'admin',
  inviteUrl: 'https://dashboard.opentribe.io/invite?token=abc123',
};

export default OrgInviteEmail;