import { getServerSupabaseClient } from "@/lib/supabase";
import ItemTapButton from "@/components/ItemTapButton";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = getServerSupabaseClient();
  const { data: items, error } = await supabase
    .from("items")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Tap an item each time you sell one. Each tap logs a quantity of 1 — no
        typing needed.
      </p>

      {error && (
        <p className="text-sm text-red-600">
          Could not load items. Check your Supabase configuration.
        </p>
      )}

      <div className="space-y-2">
        {items?.map((item) => (
          <ItemTapButton key={item.id} itemId={item.id} itemName={item.name} />
        ))}
      </div>
    </div>
  );
}
