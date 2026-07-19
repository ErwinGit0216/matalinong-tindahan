"use client";

import { useEffect, useState } from "react";
import SuggestionCard from "@/components/SuggestionCard";

interface SuggestionResponse {
  lowStock: { itemId: string; name: string; reason: string }[];
  deadStock: { itemId: string; name: string; reason: string }[];
  summary: string;
}

export default function SuggestionsPage() {
  const [data, setData] = useState<SuggestionResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestion() {
      setStatus("loading");
      try {
        const res = await fetch("/api/suggestion", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setStatus("error");
          return;
        }
        const json: SuggestionResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    loadSuggestion();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <p className="text-sm text-gray-500">Sinusuri ang benta... (analyzing sales...)</p>;
  }

  if (status === "error" || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not generate a suggestion right now. Please try again in a moment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
        <p className="text-sm font-medium text-brand-700">{data.summary}</p>
      </div>

      <SuggestionCard
        title="Mag-restock ka na (Low Stock)"
        emptyLabel="Walang kulang na item ngayon."
        items={data.lowStock}
        accentClass="text-brand-700"
      />

      <SuggestionCard
        title="Bagal-bili (Dead Stock)"
        emptyLabel="Walang tumigil na item ngayon."
        items={data.deadStock}
        accentClass="text-gray-500"
      />
    </div>
  );
}
