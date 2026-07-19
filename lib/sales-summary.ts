export interface SalesLogRow {
  item_id: string;
  quantity: number;
  logged_at: string; // ISO date string, e.g. "2026-07-19"
}

export interface ItemRow {
  id: string;
  name: string;
}

export interface SalesSummaryItem {
  itemId: string;
  item: string;
  avgPerDay7d: number;
  soldLast2Days: number;
}

/**
 * Aggregates raw sales_logs rows into a compact per-item summary suitable for
 * feeding to the AI (per spec.md §4): average daily sales over the last 7 days,
 * and units sold in the last 2 days. This keeps the AI prompt small and avoids
 * sending raw row-level data.
 *
 * `referenceDate` defaults to "today" but is an explicit parameter so this
 * function is deterministic and testable without depending on the system clock.
 */
export function aggregateSalesLogs(
  items: ItemRow[],
  logs: SalesLogRow[],
  referenceDate: Date = new Date()
): SalesSummaryItem[] {
  const startOfToday = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6); // inclusive 7-day window

  const twoDaysAgo = new Date(startOfToday);
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 1); // inclusive 2-day window

  return items.map((item) => {
    const itemLogs = logs.filter((log) => log.item_id === item.id);

    const last7DaysLogs = itemLogs.filter((log) => {
      const loggedDate = new Date(log.logged_at);
      return loggedDate >= sevenDaysAgo && loggedDate <= startOfToday;
    });
    const totalLast7Days = last7DaysLogs.reduce((sum, log) => sum + log.quantity, 0);
    const avgPerDay7d = Math.round((totalLast7Days / 7) * 10) / 10; // 1 decimal place

    const last2DaysLogs = itemLogs.filter((log) => {
      const loggedDate = new Date(log.logged_at);
      return loggedDate >= twoDaysAgo && loggedDate <= startOfToday;
    });
    const soldLast2Days = last2DaysLogs.reduce((sum, log) => sum + log.quantity, 0);

    return {
      itemId: item.id,
      item: item.name,
      avgPerDay7d,
      soldLast2Days,
    };
  });
}
