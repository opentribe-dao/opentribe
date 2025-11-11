import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailHighlight,
  EmailText,
} from "./components";

interface GrantStatusUpdateEmailProps {
  readonly applicantName: string;
  readonly grantTitle: string;
  readonly organizationName?: string;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly feedback?: string;
  readonly applicationUrl: string;
  readonly nextSteps?: string;
}

export const GrantStatusUpdateEmail = ({
  applicantName,
  grantTitle,
  organizationName,
  previousStatus,
  newStatus,
  feedback,
  applicationUrl,
  nextSteps,
}: GrantStatusUpdateEmailProps) => {
  const isApproved = newStatus.toLowerCase() === "approved";
  const statusEmoji = isApproved
    ? "✅"
    : newStatus.toLowerCase() === "rejected"
      ? "❌"
      : "📋";

  return (
    <BaseTemplate preview={`Grant application status updated: ${newStatus}`}>
      <EmailHeading>Application Status Update {statusEmoji}</EmailHeading>

      <EmailText>Hi {applicantName},</EmailText>

      <EmailText className="mt-4">
        Your application for <strong>"{grantTitle}"</strong> has been updated.
      </EmailText>

      <EmailDivider />

      <EmailCard
        className={
          isApproved ? "border border-green-500/30 bg-green-500/10" : ""
        }
      >
        <EmailText className="mb-3 font-semibold">Status Change</EmailText>
        <EmailHighlight label="Grant" value={grantTitle} />
        {organizationName && (
          <EmailHighlight label="Organization" value={organizationName} />
        )}
        <EmailHighlight label="Previous Status" value={previousStatus} />
        <EmailHighlight label="New Status" value={newStatus} />
      </EmailCard>

      {feedback && (
        <EmailCard className="mt-4">
          <EmailText className="mb-2 font-semibold">Curator Feedback</EmailText>
          <EmailText className="whitespace-pre-wrap text-sm">
            {feedback}
          </EmailText>
        </EmailCard>
      )}

      {nextSteps && (
        <EmailCard className="mt-4">
          <EmailText className="mb-2 font-semibold">Next Steps</EmailText>
          <EmailText className="text-sm">{nextSteps}</EmailText>
        </EmailCard>
      )}

      <EmailButton href={applicationUrl}>View Application Details</EmailButton>

      <EmailDivider />

      {isApproved ? (
        <EmailText className="text-center text-sm text-white/60">
          Congratulations on your approval! The grant team will be in touch with
          further instructions and funding details.
        </EmailText>
      ) : (
        <EmailText className="text-center text-sm text-white/60">
          Don't be discouraged! Use the feedback to improve your application or
          explore other opportunities on Opentribe.
        </EmailText>
      )}
    </BaseTemplate>
  );
};

GrantStatusUpdateEmail.PreviewProps = {
  applicantName: "Alice",
  grantTitle: "Substrate Development Grant",
  organizationName: "Web3 Foundation",
  previousStatus: "Under Review",
  newStatus: "Approved",
  feedback:
    "Strong technical proposal with clear milestones. The team is impressed with your experience in Substrate development.",
  applicationUrl: "https://opentribe.io/applications/789",
  nextSteps:
    "Please schedule a call with the grants team to discuss the agreement and payment schedule.",
};

export default GrantStatusUpdateEmail;
