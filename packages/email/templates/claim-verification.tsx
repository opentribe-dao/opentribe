import React from "react";
import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailDivider,
  EmailHeading,
  EmailText,
} from "./components";

interface ClaimVerificationEmailProps {
  readonly profileName: string;
  readonly verificationUrl: string;
  readonly verificationCode: string;
}

export const ClaimVerificationEmail = ({
  profileName,
  verificationUrl,
  verificationCode,
}: ClaimVerificationEmailProps) => (
  <BaseTemplate preview={`Verify your claim for the profile "${profileName}" on Opentribe`}>
    <EmailHeading>Claim Profile Verification</EmailHeading>

    <EmailText>
      Someone requested to claim the ecosystem profile{" "}
      <strong>{profileName}</strong> on Opentribe. If this was you, please
      verify by clicking the button below or entering the verification code.
    </EmailText>

    <EmailDivider />

    <EmailButton href={verificationUrl}>Verify Profile Claim</EmailButton>

    <EmailText className="mt-6 text-center text-sm">
      Or use this verification code:
    </EmailText>
    <EmailText className="mt-2 text-center font-bold font-mono text-2xl text-[#E6007A]">
      {verificationCode}
    </EmailText>

    <EmailDivider />

    <EmailText className="text-sm text-white/60">
      This link will expire in 7 days. If you did not request this, you can
      safely ignore this email. Your profile will not be claimed without
      verification.
    </EmailText>
  </BaseTemplate>
);

ClaimVerificationEmail.PreviewProps = {
  profileName: "Alice Builder",
  verificationUrl: "https://opentribe.io/profile/claim/verify?token=abc123",
  verificationCode: "ABC123",
};

export default ClaimVerificationEmail;
