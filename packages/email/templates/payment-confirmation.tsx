import { formatCurrency } from "../utils";
import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailHeading,
  EmailHighlight,
  EmailText,
} from "./components";

interface PaymentConfirmationEmailProps {
  user: {
    email: string;
    firstName?: string;
    username?: string;
  };
  bounty: {
    id: string;
    title: string;
    organization: {
      name: string;
    };
  };
  payment: {
    amount: string;
    token: string;
    transactionId: string;
  };
}

export default function PaymentConfirmationEmail({
  user,
  bounty,
  payment,
}: PaymentConfirmationEmailProps) {
  const displayName =
    user?.firstName ||
    (user as { name?: string })?.name ||
    user?.username ||
    "Winner";
  const subscanUrl = `https://polkadot.subscan.io/extrinsic/${payment.transactionId}`;

  return (
    <BaseTemplate preview="Payment Confirmed! 💸">
      <EmailHeading>Payment Confirmed! 💸</EmailHeading>

      <EmailText>Hi {displayName},</EmailText>

      <EmailText>
        Great news! Your prize payment for winning the bounty "{bounty.title}"
        has been processed and confirmed on the blockchain.
      </EmailText>

      <EmailCard>
        <EmailText className="mb-4 font-bold">Payment Details</EmailText>

        <EmailHighlight
          label="Amount"
          value={`${formatCurrency(Number.parseFloat(payment.amount))} ${
            payment.token
          }`}
        />

        <EmailHighlight label="Organization" value={bounty.organization.name} />

        <EmailText className="mt-4 text-sm text-white/60">
          Transaction ID
        </EmailText>
        <EmailText className="break-all font-mono text-xs">
          {payment.transactionId}
        </EmailText>
      </EmailCard>

      <EmailButton href={subscanUrl}>View Transaction on Subscan</EmailButton>

      <EmailText>
        The payment has been sent to your registered wallet address. It should
        be available in your wallet immediately.
      </EmailText>

      <EmailText>
        Thank you for your excellent contribution to the Polkadot ecosystem!
      </EmailText>
    </BaseTemplate>
  );
}

PaymentConfirmationEmail.PreviewProps = {
  user: {
    email: "builder@example.com",
    firstName: "Sora",
    username: "sora",
  },
  bounty: {
    id: "bounty-123",
    title: "Build an Opentribe dashboard widget",
    organization: {
      name: "Polkadot Labs",
    },
  },
  payment: {
    amount: "1500",
    token: "USDC",
    transactionId: "0x1234567890abcdef",
  },
};
