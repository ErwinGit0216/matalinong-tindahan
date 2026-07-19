"use client";

import { useState } from "react";

interface ItemTapButtonProps {
  itemId: string;
  itemName: string;
}

export default function ItemTapButton({ itemId, itemName }: ItemTapButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleTap() {
    setStatus("saving");
    try {
      const res = await fetch("/api/sales-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: 1 }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={handleTap}
      disabled={status === "saving"}
      className={`w-full text-left px-4 py-3 rounded-lg shadow-sm border transition-colors ${
        status === "saved"
          ? "bg-green-100 border-green-300"
          : status === "error"
          ? "bg-red-100 border-red-300"
          : "bg-white border-gray-200 active:bg-brand-50"
      }`}
    >
      <span className="font-medium">{itemName}</span>
      <span className="block text-xs text-gray-500">
        {status === "saving" && "Saving..."}
        {status === "saved" && "Sold +1 ✓"}
        {status === "error" && "Failed — tap to retry"}
        {status === "idle" && "Tap to log 1 sold"}
      </span>
    </button>
  );
}
