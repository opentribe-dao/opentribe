import type { z } from "zod";

/**
 * Formats a Zod validation error into a standardized error response object.
 *
 * @param error - The ZodError instance to format
 * @param options - Optional configuration
 * @param options.errorMessage - Custom error message (default: "Validation failed")
 * @returns Standardized error response object with error, message, and details
 *
 * @example
 * ```typescript
 * try {
 *   const data = schema.parse(body);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const formattedError = formatZodError(error);
 *     return NextResponse.json(formattedError, { status: 400 });
 *   }
 * }
 * ```
 */
export function formatZodError(
  error: z.ZodError,
  options?: { errorMessage?: string }
): {
  error: string;
  message: string;
  details: z.core.$ZodIssue[];
} {
  const errorMessages = error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `${path ? `${path}: ` : ""}${issue.message}`;
  });

  return {
    error: options?.errorMessage ?? "Validation failed",
    message: errorMessages.join(", "),
    details: error.issues,
  };
}
