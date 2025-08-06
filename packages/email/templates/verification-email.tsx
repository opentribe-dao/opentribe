import React from 'react';
import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
} from './components';

interface VerificationEmailProps {
  readonly username: string;
  readonly verificationUrl: string;
  readonly verificationCode?: string;
}

export const VerificationEmail = ({
  username,
  verificationUrl,
  verificationCode,
}: VerificationEmailProps) => (
  <BaseTemplate preview="Verify your email address for Opentribe">
    <EmailHeading>Welcome to Opentribe! 🚀</EmailHeading>
    
    <EmailText>
      Hi {username},
    </EmailText>
    
    <EmailText className="mt-4">
      Thanks for joining Opentribe, the talent marketplace for the Polkadot ecosystem. 
      Please verify your email address to get started.
    </EmailText>

    <EmailDivider />

    <EmailButton href={verificationUrl}>
      Verify Email Address
    </EmailButton>

    {verificationCode && (
      <React.Fragment>
        <EmailText className="mt-6 text-center text-sm">
          Or enter this verification code:
        </EmailText>
        <EmailText className="mt-2 text-center text-2xl font-mono font-bold text-[#E6007A]">
          {verificationCode}
        </EmailText>
      </React.Fragment>
    )}

    <EmailDivider />

    <EmailText className="text-sm text-white/60">
      This link will expire in 24 hours. If you didn't create an account with Opentribe, 
      you can safely ignore this email.
    </EmailText>
  </BaseTemplate>
);

VerificationEmail.PreviewProps = {
  username: 'builder123',
  verificationUrl: 'https://opentribe.io/verify?token=abc123',
  verificationCode: '123456',
};

export default VerificationEmail;