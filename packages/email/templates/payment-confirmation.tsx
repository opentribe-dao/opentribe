import BaseTemplate from './base-template';
import {
  EmailButton,
  EmailHeading,
  EmailText,
  EmailCard,
  EmailHighlight,
} from './components';
import { formatCurrency } from '../utils';

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

export default function PaymentConfirmationEmail({ user, bounty, payment }: PaymentConfirmationEmailProps) {
  const displayName = user.firstName || user.username || 'Winner';
  const subscanUrl = `https://polkadot.subscan.io/extrinsic/${payment.transactionId}`;

  return (
    <BaseTemplate>
      <EmailHeading>Payment Confirmed! 💸</EmailHeading>

      <EmailText>Hi {displayName},</EmailText>

      <EmailText>
        Great news! Your prize payment for winning the bounty "{bounty.title}" has been processed and confirmed on the blockchain.
      </EmailText>

      <EmailCard>
        <EmailText className="font-bold mb-4">Payment Details</EmailText>
        
        <EmailHighlight 
          label="Amount" 
          value={`${formatCurrency(parseFloat(payment.amount))} ${payment.token}`} 
        />
        
        <EmailHighlight 
          label="Organization" 
          value={bounty.organization.name} 
        />
        
        <EmailText className="text-sm text-white/60 mt-4">Transaction ID</EmailText>
        <EmailText className="font-mono text-xs break-all">
          {payment.transactionId}
        </EmailText>
      </EmailCard>

      <EmailButton href={subscanUrl}>
        View Transaction on Subscan
      </EmailButton>

      <EmailText>
        The payment has been sent to your registered wallet address. It should be available in your wallet immediately.
      </EmailText>

      <EmailText>
        Thank you for your excellent contribution to the Polkadot ecosystem!
      </EmailText>
    </BaseTemplate>
  );
}