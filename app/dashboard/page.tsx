"use client";

import { useMemo, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { SummaryCards } from "@/components/summary-cards";
import { DailyDetailDialog } from "@/components/daily-detail-dialog";
import { CategoryDetailDialog } from "@/components/category-detail-dialog";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { formatCurrencyIDR } from "@/lib/analytics/format";

export default function DashboardPage() {
  const {
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
  } = useDashboard();

  const [categoryDialog, setCategoryDialog] = useState<"needs" | "wants" | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
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
    if (selectedDayIndex > 0) setSelectedDay(monthDays[selectedDayIndex - 1] ?? selectedDay);
  };

  const goToNextDay = () => {
    if (selectedDayIndex >= 0 && selectedDayIndex < monthDays.length - 1) setSelectedDay(monthDays[selectedDayIndex + 1] ?? selectedDay);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="card p-5 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 ring-1 ring-slate-100 shadow-sm">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconifyIcon icon="fluent:data-bar-vertical-24-filled" className="h-6 w-6" />
          </div>
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">Offline-first spending overview</p>
      </header>

      <SummaryCards totals={totals} week={weekComparison} month={monthComparison} formatCurrency={formatCurrencyIDR} />

      <section className="card space-y-5 p-5 md:p-6 shadow-sm border-0 ring-1 ring-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Spending by Month</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a month to view detailed breakdown.</p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Month</span>
            <select
              className="input pr-8 w-44 font-medium text-slate-700 bg-white"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={availableMonths.length === 0}>
              {availableMonths.length === 0 ? <option value="">No month data</option> : null}
              {availableMonths.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 mt-2 ring-1 ring-indigo-100">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Total Spending ({selectedMonth || "-"})</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{formatCurrencyIDR(monthTotal)}</p>
        </div>

        {monthEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <IconifyIcon icon="fluent:calendar-empty-24-regular" className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-center">No entries found for this month.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <button
                type="button"
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => setCategoryDialog("needs")}>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center transition-transform group-hover:scale-110">
                  <IconifyIcon icon="fluent:home-24-filled" className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Monthly Needs</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrencyIDR(monthlyNeedsTotal)}</p>
                <p className="mt-1 text-sm font-medium text-emerald-600/80">{monthlyNeedsEntries.length} entries</p>
                <div className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  View Detail <IconifyIcon icon="fluent:arrow-right-16-regular" className="ml-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
              </button>

              <button
                type="button"
                className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => setCategoryDialog("wants")}>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center transition-transform group-hover:scale-110">
                  <IconifyIcon icon="fluent:sparkle-24-filled" className="h-4 w-4 text-rose-600" />
                </div>
                <p className="text-sm font-bold text-rose-700 uppercase tracking-wider">Monthly Wants</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrencyIDR(monthlyWantsTotal)}</p>
                <p className="mt-1 text-sm font-medium text-rose-600/80">{monthlyWantsEntries.length} entries</p>
                <div className="mt-3 inline-flex items-center text-xs font-semibold text-rose-600 group-hover:text-rose-700">
                  View Detail <IconifyIcon icon="fluent:arrow-right-16-regular" className="ml-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 pt-2 border-slate-100">Weekly Breakdown</h3>
            
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {monthlyBreakdown.map((week) => {
                const isExpanded = expandedWeekKey === week.weekKey;

                return (
                  <div key={week.weekKey} className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all duration-300">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between p-4 focus:outline-none transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
                      onClick={() => setExpandedWeekKey((current) => (current === week.weekKey ? null : week.weekKey))}>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">Week {week.monthWeek}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 font-mono">{week.weekKey}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-accent">{formatCurrencyIDR(week.total)}</p>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 ${isExpanded ? "rotate-180 bg-accent text-white" : "text-slate-500"}`}>
                          <IconifyIcon icon="fluent:chevron-down-20-regular" />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        {week.days.map((day) => (
                          <button
                            key={day.date}
                            type="button"
                            className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                              selectedDay === day.date 
                                ? "bg-white shadow-sm ring-1 ring-accent/20 border-transparent" 
                                : "bg-transparent hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60"
                            }`}
                            onClick={() => {
                              setSelectedDay(day.date);
                              setIsDayDialogOpen(true);
                            }}>
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{day.date}</span>
                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{formatCurrencyIDR(day.total)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!selectedDayData && (
              <p className="text-xs font-medium text-slate-400 text-center py-2">Select a weekly day to see detailed breakdown.</p>
            )}
          </div>
        )}
      </section>

      <DailyDetailDialog
        isOpen={isDayDialogOpen}
        onClose={() => setIsDayDialogOpen(false)}
        selectedDayData={selectedDayData}
        onPrevDay={goToPreviousDay}
        onNextDay={goToNextDay}
        canGoPrev={selectedDayIndex > 0}
        canGoNext={selectedDayIndex < monthDays.length - 1}
        totalDays={monthDays.length}
      />

      <CategoryDetailDialog
        type={categoryDialog}
        onClose={() => setCategoryDialog(null)}
        selectedMonth={selectedMonth}
        entries={categoryDialog === "needs" ? sortedNeedsEntries : sortedWantsEntries}
      />
    </div>
  );
}
