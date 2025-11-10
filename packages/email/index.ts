import { Resend } from "resend";
import { keys } from "./keys";

export const resend = new Resend(keys().RESEND_TOKEN);

// Export newsletter functions
export * from "./newsletter";

// Export email service functions
export * from "./services/email-service";
// Export all email templates
export * from "./templates";
// Export types
export * from "./types";
