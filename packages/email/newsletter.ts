import { resend } from "./index";
import { keys } from "./keys";

interface CreateContactParams {
  email: string;
  audienceId?: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}

interface CreateContactResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

/**
 * Create a contact in Resend audience
 */
export async function createContact({
  email,
  firstName,
  lastName,
  audienceId = keys().RESEND_GENERAL_AUDIENCE_ID,
  unsubscribed = false,
}: CreateContactParams): Promise<CreateContactResult> {
  try {
    const response = await resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed,
      audienceId,
    });

    if (response.error) {
      console.error("Resend contact creation error:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to create contact",
      };
    }

    return {
      success: true,
      contactId: response.data?.id,
    };
  } catch (error) {
    console.error("Contact creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
