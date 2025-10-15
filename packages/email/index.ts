import { Resend } from "resend";
import { keys } from "./keys";

export const resend = new Resend(keys().RESEND_TOKEN);

// Export all email templates
export * from "./templates";

// Export email service functions
export * from "./services/email-service";

// Export types
export * from "./types";

// Export newsletter functions
export * from "./newsletter";
