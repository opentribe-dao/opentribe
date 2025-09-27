import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailDivider,
  EmailCard,
  EmailList,
} from "./components";

interface WelcomeEmailProps {
  readonly firstName: string;
  readonly url: string;
}

export const WelcomeEmail = ({ firstName, url }: WelcomeEmailProps) => (
  <BaseTemplate preview="Welcome to Opentribe - Complete your profile">
    <EmailHeading>Welcome to Opentribe, {firstName}! 🎉</EmailHeading>

    <EmailText className="mt-4">
      Your email has been verified! You're now part of the Polkadot ecosystem's
      premier talent marketplace.
    </EmailText>

    <EmailText className="mt-4">
      To get the most out of Opentribe, complete your profile setup:
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="font-semibold text-lg mb-3">
        🚀 Quick Start Guide
      </EmailText>
      <EmailList
        items={[
          "Complete your Builder or Organization profile",
          "Add your skills and interests",
          "Upload a professional photo",
          "Connect your social profiles",
        ]}
      />
    </EmailCard>

    <EmailButton href={url}>Complete Your Profile</EmailButton>

    <EmailDivider />

    <EmailText className="text-sm text-white/60 text-center">
      Need help? Check out our getting started guide or reach out to our
      community on Discord.
    </EmailText>
  </BaseTemplate>
);

WelcomeEmail.PreviewProps = {
  firstName: "Alice",
  url: `${process.env.NEXT_PUBLIC_WEB_URL}/onboarding`,
};

export default WelcomeEmail;
