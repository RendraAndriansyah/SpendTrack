import { useCallback, useEffect, useMemo, useState } from "react";
import { getAvailableYearMonths, getComparisons, getDashboardTotals, getSpendingByYearMonth } from "@/lib/db/repositories/transactions";
import type { ComparisonResult, DashboardTotals, Transaction } from "@/lib/types";

const emptyTotals: DashboardTotals = {
  grandTotal: 0,
  byCategory: {
    daily_spending: 0,
    monthly_needs: 0,
    monthly_wants: 0,
  },
};

const emptyComparison: ComparisonResult = { current: 0, previous: 0, delta: 0 };

export function useDashboard() {
  const [totals, setTotals] = useState<DashboardTotals>(emptyTotals);
  const [weekComparison, setWeekComparison] = useState<ComparisonResult>(emptyComparison);
  const [monthComparison, setMonthComparison] = useState<ComparisonResult>(emptyComparison);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthEntries, setMonthEntries] = useState<Transaction[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [expandedWeekKey, setExpandedWeekKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [newTotals, compare] = await Promise.all([getDashboardTotals(), getComparisons()]);
    setTotals(newTotals);
    setWeekComparison(compare.week);
    setMonthComparison(compare.month);
  }, []);

  const refreshMonths = useCallback(async () => {
    const months = await getAvailableYearMonths();
    setAvailableMonths(months);
    setSelectedMonth((current) => {
      if (current && months.includes(current)) {
        return current;
      }
      return months[0] ?? "";
    });
  }, []);

  const refreshSelectedMonth = useCallback(async () => {
    if (!selectedMonth) {
      setMonthEntries([]);
      setMonthTotal(0);
      setExpandedWeekKey(null);
      return;
    }

    const monthData = await getSpendingByYearMonth(selectedMonth);
    setMonthEntries(monthData.entries);
    setMonthTotal(monthData.total);
    setExpandedWeekKey(null);
  }, [selectedMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    refreshMonths();
  }, [refreshMonths]);

  useEffect(() => {
    refreshSelectedMonth();
  }, [refreshSelectedMonth]);

  const dailySpendingEntries = useMemo(() => monthEntries.filter((entry) => entry.category === "daily_spending"), [monthEntries]);
  const monthlyNeedsEntries = useMemo(() => monthEntries.filter((entry) => entry.category === "monthly_needs"), [monthEntries]);
  const monthlyWantsEntries = useMemo(() => monthEntries.filter((entry) => entry.category === "monthly_wants"), [monthEntries]);

  const monthlyNeedsTotal = useMemo(() => monthlyNeedsEntries.reduce((sum, entry) => sum + entry.amount, 0), [monthlyNeedsEntries]);
  const monthlyWantsTotal = useMemo(() => monthlyWantsEntries.reduce((sum, entry) => sum + entry.amount, 0), [monthlyWantsEntries]);

  const sortedNeedsEntries = useMemo(
    () => [...monthlyNeedsEntries].sort((a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt)),
    [monthlyNeedsEntries],
  );
  const sortedWantsEntries = useMemo(
    () => [...monthlyWantsEntries].sort((a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt)),
    [monthlyWantsEntries],
  );

  const monthlyBreakdown = useMemo(() => {
    const sorted = [...dailySpendingEntries].sort((a, b) => a.localDate.localeCompare(b.localDate));
    const weekMap = new Map<
      string,
      { weekKey: string; total: number; days: Map<string, { date: string; total: number; entries: Transaction[] }> }
    >();

    for (const entry of sorted) {
      const weekKey = `${entry.isoYear}-W${String(entry.isoWeek).padStart(2, "0")}`;
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekKey,
          total: 0,
          days: new Map(),
        });
      }

      const week = weekMap.get(weekKey)!;
      week.total += entry.amount;

      if (!week.days.has(entry.localDate)) {
        week.days.set(entry.localDate, { date: entry.localDate, total: 0, entries: [] });
      }

      const day = week.days.get(entry.localDate)!;
      day.total += entry.amount;
      day.entries.push(entry);
    }

    const weeks = [...weekMap.values()]
      .map((week) => ({
        weekKey: week.weekKey,
        total: week.total,
        days: [...week.days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    return weeks.map((week, index) => ({
      ...week,
      monthWeek: index + 1,
    }));
  }, [dailySpendingEntries]);

  return {
    totals,
    weekComparison,
    monthComparison,
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    monthTotal,
    monthEntries,
    monthlyNeedsEntries,
    monthlyWantsEntries,
    monthlyNeedsTotal,
    monthlyWantsTotal,
    sortedNeedsEntries,
    sortedWantsEntries,
    monthlyBreakdown,
    expandedWeekKey,
    setExpandedWeekKey,
  };
}
