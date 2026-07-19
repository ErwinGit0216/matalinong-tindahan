import { getServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getServerSupabaseClient();
  const { data: items, error } = await supabase
    .from("items")
    .select("id, name, category")
    .order("name");

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Maligayang pagdating! Here&apos;s your current item catalog. Log today&apos;s
        sales, then check Suggestions for what to restock this week.
      </p>

      {error && (
        <p className="text-sm text-red-600">
          Could not load items. Check your Supabase configuration.
        </p>
      )}

      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
        {items?.map((item) => (
          <li key={item.id} className="px-4 py-2 flex justify-between">
            <span>{item.name}</span>
            <span className="text-xs text-gray-400">{item.category}</span>
          </li>
        ))}
      </ul>

      {items && items.length === 0 && (
        <p className="text-sm text-gray-500">
          No items yet — run <code>supabase/seed.sql</code> against your project to
          load the demo catalog.
        </p>
      )}
    </div>
  );
}
