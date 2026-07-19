import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { validateSalesLogInput } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateSalesLogInput(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { itemId, quantity, loggedAt } = validation.data;

  try {
    const supabase = getServerSupabaseClient();

    // Confirm the item actually exists before logging a sale against it —
    // the schema check alone only guarantees itemId is a well-formed UUID.
    const { data: item, error: itemLookupError } = await supabase
      .from("items")
      .select("id")
      .eq("id", itemId)
      .maybeSingle();

    if (itemLookupError) {
      console.error("Item lookup failed:", itemLookupError.message);
      return NextResponse.json({ error: "Could not verify item" }, { status: 500 });
    }

    if (!item) {
      return NextResponse.json({ error: "Unknown item" }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("sales_logs")
      .insert({
        item_id: itemId,
        quantity,
        ...(loggedAt ? { logged_at: loggedAt } : {}),
      })
      .select("id, item_id, quantity, logged_at")
      .single();

    if (insertError) {
      console.error("Failed to insert sales log:", insertError.message);
      return NextResponse.json({ error: "Could not save sales log" }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: inserted.id,
        itemId: inserted.item_id,
        quantity: inserted.quantity,
        loggedAt: inserted.logged_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/sales-log:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
