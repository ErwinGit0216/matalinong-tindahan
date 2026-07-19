import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { SalesSummaryItem } from "@/lib/sales-summary";

/**
 * Output schema the model must return, matching spec.md §3 (`GET /api/suggestion`
 * response shape) and §4 (AI prompt contract). Using a schema with generateObject
 * means the SDK validates and retries on malformed output for us, rather than us
 * hand-parsing raw text.
 */
export const suggestionResponseSchema = z.object({
  lowStock: z.array(
    z.object({
      itemId: z.string(),
      name: z.string(),
      reason: z.string(),
    })
  ),
  deadStock: z.array(
    z.object({
      itemId: z.string(),
      name: z.string(),
      reason: z.string(),
    })
  ),
  summary: z.string(),
});

export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

const SYSTEM_PROMPT = `You are a restocking assistant for a small Philippine sari-sari store.
You will receive a JSON summary of recent sales velocity per item. Identify:
- "lowStock": items that are likely running out soon — typically steady recent sales
  (avgPerDay7d meaningfully above 0) that suddenly dropped to 0 in the last 2 days,
  suggesting the item sold out rather than demand disappearing.
- "deadStock": items with little or no sales across the whole window (avgPerDay7d
  at or near 0) — these are reorder candidates to avoid, not to restock.

Only include an item in one list or the other if there's a clear signal — do not
force every item into a category. Keep "reason" short (one sentence) and specific
to the numbers you were given. Write "summary" as a short, actionable note in
Tagalog/Taglish that a busy store owner could read in a few seconds.`;

/**
 * Calls Claude with the aggregated sales summary and returns a validated
 * suggestion object. Throws on failure so the caller (the API route) can decide
 * how to respond (per spec.md §3: fall back to a 502 after one retry).
 */
export async function generateRestockSuggestion(
  salesSummary: SalesSummaryItem[]
): Promise<SuggestionResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — check your environment variables.");
  }

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: suggestionResponseSchema,
    system: SYSTEM_PROMPT,
    prompt: `Sales summary for the last 7-14 days, one entry per item:\n\n${JSON.stringify(
      salesSummary,
      null,
      2
    )}`,
  });

  return object;
}
