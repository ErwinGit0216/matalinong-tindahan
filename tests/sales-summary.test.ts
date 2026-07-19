import { describe, it, expect } from "vitest";
import { aggregateSalesLogs, type ItemRow, type SalesLogRow } from "@/lib/sales-summary";

// Fixed reference date so tests are deterministic regardless of when they run.
const REFERENCE_DATE = new Date("2026-07-19T00:00:00Z");

const items: ItemRow[] = [
  { id: "item-coke", name: "Coke 1.5L" },
  { id: "item-sprite", name: "Sprite 1.5L" },
];

describe("aggregateSalesLogs", () => {
  it("computes correct 7-day average and last-2-days total for steady sales", () => {
    const logs: SalesLogRow[] = [
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-13" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-14" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-15" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-16" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-17" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-18" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-19" },
    ];

    const result = aggregateSalesLogs(items, logs, REFERENCE_DATE);
    const coke = result.find((r) => r.itemId === "item-coke");

    expect(coke).toBeDefined();
    expect(coke!.avgPerDay7d).toBe(3);
    expect(coke!.soldLast2Days).toBe(6); // 3 on the 18th + 3 on the 19th
  });

  it("flags a likely stockout pattern: steady sales, then nothing in the last 2 days", () => {
    const logs: SalesLogRow[] = [
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-13" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-14" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-15" },
      { item_id: "item-coke", quantity: 3, logged_at: "2026-07-16" },
      // nothing logged on 07-17, 07-18, or 07-19 — simulates a stockout
    ];

    const result = aggregateSalesLogs(items, logs, REFERENCE_DATE);
    const coke = result.find((r) => r.itemId === "item-coke");

    expect(coke!.avgPerDay7d).toBeGreaterThan(0);
    expect(coke!.soldLast2Days).toBe(0);
  });

  it("returns zero averages for an item with no sales logs at all (dead stock)", () => {
    const logs: SalesLogRow[] = [];

    const result = aggregateSalesLogs(items, logs, REFERENCE_DATE);
    const sprite = result.find((r) => r.itemId === "item-sprite");

    expect(sprite!.avgPerDay7d).toBe(0);
    expect(sprite!.soldLast2Days).toBe(0);
  });

  it("excludes sales logs outside the 7-day window from the average", () => {
    const logs: SalesLogRow[] = [
      { item_id: "item-coke", quantity: 100, logged_at: "2026-06-01" }, // way outside window
      { item_id: "item-coke", quantity: 2, logged_at: "2026-07-19" }, // inside window
    ];

    const result = aggregateSalesLogs(items, logs, REFERENCE_DATE);
    const coke = result.find((r) => r.itemId === "item-coke");

    // Only the 2 units from 07-19 should count toward the 7-day average.
    expect(coke!.avgPerDay7d).toBeCloseTo(2 / 7, 1);
  });
});
