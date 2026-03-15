"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { SummaryCards } from "@/components/summary-cards";
import { getAvailableYearMonths, getComparisons, getDashboardTotals, getSpendingByYearMonth } from "@/lib/db/repositories/transactions";
import { formatCurrencyIDR } from "@/lib/analytics/format";
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

export default function DashboardPage() {
  const [totals, setTotals] = useState<DashboardTotals>(emptyTotals);
  const [weekComparison, setWeekComparison] = useState<ComparisonResult>(emptyComparison);
  const [monthComparison, setMonthComparison] = useState<ComparisonResult>(emptyComparison);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthEntries, setMonthEntries] = useState<Transaction[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [expandedWeekKey, setExpandedWeekKey] = useState<string | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<"needs" | "wants" | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [newTotals, compare] = await Promise.all([getDashboardTotals(), getComparisons()]);

    setTotals(newTotals);
    setWeekComparison(compare.week);
    setMonthComparison(compare.month);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  useEffect(() => {
    refreshMonths();
  }, [refreshMonths]);

  const refreshSelectedMonth = useCallback(async () => {
    if (!selectedMonth) {
      setMonthEntries([]);
      setMonthTotal(0);
      setExpandedWeekKey(null);
      setCategoryDialog(null);
      setSelectedDay("");
      setIsDayDialogOpen(false);
      return;
    }

    const monthData = await getSpendingByYearMonth(selectedMonth);
    setMonthEntries(monthData.entries);
    setMonthTotal(monthData.total);
    setExpandedWeekKey(null);
    setCategoryDialog(null);
    setSelectedDay("");
    setIsDayDialogOpen(false);
  }, [selectedMonth]);

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

  const selectedDayData = useMemo(() => {
    if (!selectedDay) {
      return null;
    }

    for (const week of monthlyBreakdown) {
      const day = week.days.find((item) => item.date === selectedDay);
      if (day) {
        return {
          date: day.date,
          total: day.total,
          entries: [...day.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        };
      }
    }

    return null;
  }, [monthlyBreakdown, selectedDay]);

  const monthDays = useMemo(() => {
    const days = monthlyBreakdown.flatMap((week) => week.days.map((day) => day.date));
    return [...new Set(days)].sort((a, b) => a.localeCompare(b));
  }, [monthlyBreakdown]);

  const selectedDayIndex = useMemo(() => monthDays.findIndex((day) => day === selectedDay), [monthDays, selectedDay]);

  const goToPreviousDay = () => {
    if (selectedDayIndex <= 0) {
      return;
    }
    setSelectedDay(monthDays[selectedDayIndex - 1] ?? selectedDay);
  };

  const goToNextDay = () => {
    if (selectedDayIndex < 0 || selectedDayIndex >= monthDays.length - 1) {
      return;
    }
    setSelectedDay(monthDays[selectedDayIndex + 1] ?? selectedDay);
  };

  return (
    <div className="space-y-4">
      <header className="card">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <IconifyIcon icon="fluent-color:bar-chart-24" className="h-5 w-5" />
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">Offline-first spending overview</p>
      </header>

      <SummaryCards totals={totals} week={weekComparison} month={monthComparison} formatCurrency={formatCurrencyIDR} />

      <section className="card space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Spending by Month</h2>
            <p className="text-xs text-slate-500">Choose month to view monthly spending detail.</p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Month</span>
            <select
              className="input"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={availableMonths.length === 0}>
              {availableMonths.length === 0 ? <option value="">No month data</option> : null}
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total Spending ({selectedMonth || "-"})</p>
          <p className="text-xl font-bold">{formatCurrencyIDR(monthTotal)}</p>
        </div>

        {monthEntries.length === 0 ? (
          <p className="text-sm text-slate-500">No entries found for this month.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="rounded-xl border border-mint/70 bg-mint/20 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setCategoryDialog("needs")}>
                  <div>
                    <p className="text-sm font-semibold">Monthly Needs</p>
                    <p className="text-lg font-bold">{formatCurrencyIDR(monthlyNeedsTotal)}</p>
                    <p className="text-xs text-slate-600">{monthlyNeedsEntries.length} entries</p>
                  </div>
                  <IconifyIcon icon="mdi:open-in-new" className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="rounded-xl border border-lavender/70 bg-lavender/25 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setCategoryDialog("wants")}>
                  <div>
                    <p className="text-sm font-semibold">Monthly Wants</p>
                    <p className="text-lg font-bold">{formatCurrencyIDR(monthlyWantsTotal)}</p>
                    <p className="text-xs text-slate-600">{monthlyWantsEntries.length} entries</p>
                  </div>
                  <IconifyIcon icon="mdi:open-in-new" className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
              {monthlyBreakdown.map((week) => {
                const isExpanded = expandedWeekKey === week.weekKey;

                return (
                  <div key={week.weekKey} className="rounded-xl border border-lavender/70 bg-slate-50 p-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => setExpandedWeekKey((current) => (current === week.weekKey ? null : week.weekKey))}>
                      <div>
                        <p className="text-sm font-semibold">Week {week.monthWeek}</p>
                        <p className="text-xs text-slate-500">{week.weekKey}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold">{formatCurrencyIDR(week.total)}</p>
                        <IconifyIcon icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} className="h-5 w-5 text-slate-500" />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="mt-3 space-y-2">
                        {week.days.map((day) => (
                          <button
                            key={day.date}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                              selectedDay === day.date ? "bg-accent/20" : "bg-white"
                            }`}
                            onClick={() => {
                              setSelectedDay(day.date);
                              setIsDayDialogOpen(true);
                            }}>
                            <span className="font-medium">{day.date}</span>
                            <span className="font-semibold">{formatCurrencyIDR(day.total)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {selectedDayData ? (
              <p className="text-sm text-slate-500">Click a day to open detail dialog.</p>
            ) : (
              <p className="text-sm text-slate-500">Select a day to see detail.</p>
            )}
          </div>
        )}
      </section>

      {isDayDialogOpen && selectedDayData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">Daily Detail ({selectedDayData.date})</p>
                <p className="text-xs text-slate-500">Total: {formatCurrencyIDR(selectedDayData.total)}</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                onClick={() => setIsDayDialogOpen(false)}>
                Close
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-3 py-1 text-xs"
                onClick={goToPreviousDay}
                disabled={selectedDayIndex <= 0}>
                <IconifyIcon icon="mdi:chevron-left" className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-3 py-1 text-xs"
                onClick={goToNextDay}
                disabled={selectedDayIndex < 0 || selectedDayIndex >= monthDays.length - 1}>
                Next
                <IconifyIcon icon="mdi:chevron-right" className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-[60vh] space-y-2 overflow-auto">
              {selectedDayData.entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-xs text-slate-500">{entry.category}</p>
                  </div>
                  <p className="font-semibold">{formatCurrencyIDR(entry.amount)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {categoryDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{categoryDialog === "needs" ? "Monthly Needs Detail" : "Monthly Wants Detail"}</p>
                <p className="text-xs text-slate-500">{categoryDialog === "needs" ? selectedMonth : selectedMonth}</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                onClick={() => setCategoryDialog(null)}>
                Close
              </button>
            </div>

            {categoryDialog === "needs" && sortedNeedsEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No monthly needs entries.</p>
            ) : null}
            {categoryDialog === "wants" && sortedWantsEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No monthly wants entries.</p>
            ) : null}

            <ul className="max-h-[60vh] space-y-2 overflow-auto">
              {(categoryDialog === "needs" ? sortedNeedsEntries : sortedWantsEntries).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-xs text-slate-500">{entry.localDate}</p>
                  </div>
                  <p className="font-semibold">{formatCurrencyIDR(entry.amount)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
