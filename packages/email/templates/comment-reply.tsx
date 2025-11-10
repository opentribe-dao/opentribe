import BaseTemplate from "./base-template";
import {
  EmailButton,
  EmailCard,
  EmailDivider,
  EmailHeading,
  EmailText,
} from "./components";

interface CommentReplyEmailProps {
  readonly recipientName: string;
  readonly replierName: string;
  readonly originalComment: string;
  readonly replyContent: string;
  readonly contextType:
    | "grant"
    | "bounty"
    | "rfp"
    | "submission"
    | "application";
  readonly contextTitle: string;
  readonly threadUrl: string;
  readonly unsubscribeUrl?: string;
}

export const CommentReplyEmail = ({
  recipientName,
  replierName,
  originalComment,
  replyContent,
  contextType,
  contextTitle,
  threadUrl,
  unsubscribeUrl,
}: CommentReplyEmailProps) => (
  <BaseTemplate
    preview={`${replierName} replied to your comment`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <EmailHeading>New Reply to Your Comment 💬</EmailHeading>

    <EmailText>Hi {recipientName},</EmailText>

    <EmailText className="mt-4">
      <strong>{replierName}</strong> replied to your comment on the{" "}
      {contextType}:<strong> "{contextTitle}"</strong>
    </EmailText>

    <EmailDivider />

    <EmailCard>
      <EmailText className="mb-2 text-sm text-white/60">
        Your comment:
      </EmailText>
      <EmailText className="text-sm italic">
        "
        {originalComment.length > 150
          ? `${originalComment.substring(0, 150)}...`
          : originalComment}
        "
      </EmailText>
    </EmailCard>

    <EmailCard className="mt-4 border border-pink-500/30">
      <EmailText className="mb-2 text-sm text-white/60">
        {replierName} replied:
      </EmailText>
      <EmailText className="text-sm">{replyContent}</EmailText>
    </EmailCard>

    <EmailButton href={threadUrl}>View Full Conversation</EmailButton>

    <EmailDivider />

    <EmailText className="text-center text-sm text-white/60">
      Keep the conversation going! Active discussions help build a stronger
      Polkadot community.
    </EmailText>
  </BaseTemplate>
);

CommentReplyEmail.PreviewProps = {
  recipientName: "Alice",
  replierName: "Bob Smith",
  originalComment:
    "Great tutorial! I think adding a section on error handling would make it even better.",
  replyContent:
    "Thanks for the suggestion, Alice! I have just updated the tutorial with a comprehensive error handling section. Check it out and let me know what you think!",
  contextType: "bounty",
  contextTitle: "Create Polkadot.js Tutorial",
  threadUrl: "https://opentribe.io/bounties/123#comment-456",
};

export default CommentReplyEmail;
