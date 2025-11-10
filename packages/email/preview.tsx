import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BountyDeadlineReminderEmail from "./templates/bounty-deadline-reminder";
import BountyFirstSubmissionEmail from "./templates/bounty-first-submission";
import BountySkillMatchEmail from "./templates/bounty-skill-match";
import BountyWinnerEmail from "./templates/bounty-winner";
import BountyWinnerReminderEmail from "./templates/bounty-winner-reminder";
import CommentReplyEmail from "./templates/comment-reply";
import GrantFirstApplicationEmail from "./templates/grant-first-application";
import GrantStatusUpdateEmail from "./templates/grant-status-update";
import OnboardingCompleteEmail from "./templates/onboarding-complete";
import OrgInviteEmail from "./templates/org-invite";
import PasswordResetEmail from "./templates/password-reset";
// Import all templates
import VerificationEmail from "./templates/verification-email";
import WeeklyDigestEmail from "./templates/weekly-digest";
import WelcomeEmail from "./templates/welcome-email";

const templates = [
  { name: "verification-email", component: VerificationEmail },
  { name: "welcome-email", component: WelcomeEmail },
  { name: "password-reset", component: PasswordResetEmail },
  { name: "onboarding-complete", component: OnboardingCompleteEmail },
  { name: "org-invite", component: OrgInviteEmail },
  { name: "bounty-first-submission", component: BountyFirstSubmissionEmail },
  { name: "bounty-deadline-reminder", component: BountyDeadlineReminderEmail },
  { name: "bounty-winner-reminder", component: BountyWinnerReminderEmail },
  { name: "bounty-winner", component: BountyWinnerEmail },
  { name: "bounty-skill-match", component: BountySkillMatchEmail },
  { name: "grant-first-application", component: GrantFirstApplicationEmail },
  { name: "grant-status-update", component: GrantStatusUpdateEmail },
  { name: "comment-reply", component: CommentReplyEmail },
  { name: "weekly-digest", component: WeeklyDigestEmail },
];

// Create preview directory
const previewDir = path.join(__dirname, "preview");
if (!fs.existsSync(previewDir)) {
  fs.mkdirSync(previewDir, { recursive: true });
}

// Generate HTML files for each template
templates.forEach(({ name, component }) => {
  const Component = component as any;
  const props = Component.PreviewProps || {};

  try {
    const html = renderToStaticMarkup(React.createElement(Component, props));
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Email Preview</title>
  <style>
    body { margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    ${html}
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(previewDir, `${name}.html`), fullHtml);
    console.log(`✅ Generated preview for ${name}`);
  } catch (error) {
    console.error(`❌ Error generating ${name}:`, error);
  }
});

// Create index page
const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Templates Preview</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; background: #0a0a0a; color: white; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #E6007A; }
    .templates { display: grid; gap: 20px; margin-top: 40px; }
    .template { 
      background: rgba(255,255,255,0.05); 
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; 
      padding: 20px;
      transition: all 0.2s;
    }
    .template:hover { 
      background: rgba(255,255,255,0.1);
      border-color: #E6007A;
    }
    a { color: #E6007A; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .description { color: rgba(255,255,255,0.6); margin-top: 8px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Opentribe Email Templates</h1>
    <p>Click on any template to preview:</p>
    <div class="templates">
      ${templates
        .map(
          ({ name }) => `
        <div class="template">
          <a href="${name}.html" target="_blank">${name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</a>
          <div class="description">Preview the ${name.replace(/-/g, " ")} email template</div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(previewDir, "index.html"), indexHtml);
console.log("\n✨ Preview files generated in packages/email/preview/");
console.log(
  "📧 Open packages/email/preview/index.html in your browser to view all templates"
);
