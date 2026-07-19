interface SuggestionItem {
  itemId: string;
  name: string;
  reason: string;
}

interface SuggestionCardProps {
  title: string;
  emptyLabel: string;
  items: SuggestionItem[];
  accentClass: string;
}

export default function SuggestionCard({
  title,
  emptyLabel,
  items,
  accentClass,
}: SuggestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className={`font-semibold mb-2 ${accentClass}`}>{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.itemId} className="text-sm">
              <span className="font-medium">{item.name}</span>
              <p className="text-gray-500">{item.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
