import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("id, name, category")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch items:", error.message);
      return NextResponse.json({ error: "Could not load items" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in GET /api/items:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
