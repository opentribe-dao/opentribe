import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailDivider,
  EmailHeading,
  EmailText,
} from "./components";

interface PasswordResetEmailProps {
  readonly username: string;
  readonly resetUrl: string;
}

export const PasswordResetEmail = ({
  username,
  resetUrl,
}: PasswordResetEmailProps) => (
  <BaseTemplate preview="Reset your Opentribe password">
    <EmailHeading>Password Reset Request 🔐</EmailHeading>

    <EmailText>Hi {username},</EmailText>

    <EmailText className="mt-4">
      We received a request to reset your password. Click the button below to
      create a new password:
    </EmailText>

    <EmailDivider />

    <EmailButton href={resetUrl}>Reset Password</EmailButton>

    <EmailDivider />

    <EmailText className="text-sm text-white/60">
      This link will expire in 1 hour for security reasons. If you didn't
      request a password reset, you can safely ignore this email. Your password
      won't be changed.
    </EmailText>

    <EmailText className="mt-4 text-sm text-white/60">
      For security tips, visit our help center.
    </EmailText>
  </BaseTemplate>
);

PasswordResetEmail.PreviewProps = {
  username: "builder123",
  resetUrl: "https://opentribe.io/reset-password?token=xyz789",
};

export default PasswordResetEmail;
