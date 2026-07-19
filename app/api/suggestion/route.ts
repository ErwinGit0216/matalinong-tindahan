import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { aggregateSalesLogs } from "@/lib/sales-summary";
import { generateRestockSuggestion } from "@/lib/ai";

const LOOKBACK_DAYS = 14;

export async function GET() {
  try {
    const supabase = getServerSupabaseClient();

    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, name");

    if (itemsError) {
      console.error("Failed to fetch items:", itemsError.message);
      return NextResponse.json({ error: "Could not load items" }, { status: 500 });
    }

    const lookbackStart = new Date();
    lookbackStart.setDate(lookbackStart.getDate() - LOOKBACK_DAYS);
    const lookbackStartStr = lookbackStart.toISOString().slice(0, 10);

    const { data: logs, error: logsError } = await supabase
      .from("sales_logs")
      .select("item_id, quantity, logged_at")
      .gte("logged_at", lookbackStartStr);

    if (logsError) {
      console.error("Failed to fetch sales logs:", logsError.message);
      return NextResponse.json({ error: "Could not load sales logs" }, { status: 500 });
    }

    const salesSummary = aggregateSalesLogs(items ?? [], logs ?? []);

    // Retry once on failure (malformed AI output or transient API error) before
    // giving up, per spec.md §3.
    let suggestion;
    try {
      suggestion = await generateRestockSuggestion(salesSummary);
    } catch (firstError) {
      console.error("AI suggestion attempt 1 failed:", firstError);
      try {
        suggestion = await generateRestockSuggestion(salesSummary);
      } catch (secondError) {
        console.error("AI suggestion attempt 2 failed:", secondError);
        return NextResponse.json(
          { error: "Could not generate suggestion, please try again." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(suggestion, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in GET /api/suggestion:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
