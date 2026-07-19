import { z } from "zod";

/**
 * Validates POST /api/sales-log request bodies per spec.md §3.
 * - itemId: required, must be a UUID (existence in the DB is checked separately,
 *   since that requires a database call rather than pure schema validation)
 * - quantity: required, positive integer
 * - loggedAt: optional ISO date string, must not be in the future
 */
export const salesLogInputSchema = z.object({
  itemId: z.string().uuid({ message: "itemId must be a valid UUID" }),
  quantity: z
    .number({ invalid_type_error: "quantity must be a number" })
    .int({ message: "quantity must be an integer" })
    .positive({ message: "quantity must be greater than 0" }),
  loggedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "loggedAt must be a valid date" })
    .refine((val) => new Date(val) <= new Date(), {
      message: "loggedAt cannot be in the future",
    })
    .optional(),
});

export type SalesLogInput = z.infer<typeof salesLogInputSchema>;

export type ValidationResult =
  | { success: true; data: SalesLogInput }
  | { success: false; error: string };

/**
 * Validates a raw request body and returns a discriminated result rather than
 * throwing, so API routes can handle invalid input as a normal 400 response
 * instead of an unhandled exception.
 */
export function validateSalesLogInput(body: unknown): ValidationResult {
  const result = salesLogInputSchema.safeParse(body);
  if (!result.success) {
    // Take the first issue for a concise, user-facing error message.
    const firstIssue = result.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Invalid input" };
  }
  return { success: true, data: result.data };
}
