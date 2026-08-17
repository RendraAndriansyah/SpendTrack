"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { DailyDetailDialog } from "@/components/daily-detail-dialog";
import { CategoryDetailDialog } from "@/components/category-detail-dialog";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { formatCurrencyIDR } from "@/lib/analytics/format";

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const {
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    monthTotal,
    monthEntries,
    dailySpendingEntries,
    monthlyNeedsEntries,
    monthlyWantsEntries,
    dailySpendingTotal,
    monthlyNeedsTotal,
    monthlyWantsTotal,
    sortedDailyEntries,
    sortedNeedsEntries,
    sortedWantsEntries,
    allMonthTotals,
  } = useDashboard();

  const [categoryDialog, setCategoryDialog] = useState<"daily_spending" | "needs" | "wants" | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  // Range selection states
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRangeDetailOpen, setIsRangeDetailOpen] = useState(false);

  const calendarWeeks = useMemo(() => {
    if (!selectedMonth) return [];
    const [y, m] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(y!, (m ?? 1) - 1, 1);
    const lastDay = new Date(y!, m ?? 1, 0);

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const startDate = new Date(y!, (m ?? 1) - 1, 1 - startOffset);

    const endOffset = lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay();
    const endDate = new Date(y!, m ?? 1, endOffset);
    endDate.setHours(23, 59, 59, 999);

    const weeks = [];
    let currentDate = new Date(startDate);
    let sanityLimit = 0;

    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

    while (currentDate <= endDate && sanityLimit < 10) {
      sanityLimit++;
      const weekDays = [];
      let weeklyTotal = 0;

      for (let i = 0; i < 7; i++) {
        const yearStr = currentDate.getFullYear();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dayStr = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

        const dayEntries = monthEntries.filter((e) => e.category === "daily_spending" && e.localDate === dateStr);
        const totalSpend = dayEntries.reduce((sum, e) => sum + e.amount, 0);
        const entriesCount = dayEntries.length;

        weekDays.push({
          date: dateStr,
          dayOfMonth: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === (m ?? 1) - 1,
          isPastDay: dateStr <= todayStr,
          entriesCount,
          totalSpend,
          dayEntries,
        });

        if (currentDate.getMonth() === (m ?? 1) - 1) {
          weeklyTotal += totalSpend;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push({ days: weekDays, weeklyTotal });
    }
    return weeks;
  }, [selectedMonth, monthEntries]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    for (const week of calendarWeeks) {
      const day = week.days.find((item) => item.date === selectedDay);
      if (day && day.dayEntries.length > 0) {
        return {
          date: day.date,
          total: day.totalSpend,
          entries: [...day.dayEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        };
      }
    }
    return null;
  }, [calendarWeeks, selectedDay]);

  const monthDays = useMemo(() => {
    const days: string[] = [];
    for (const week of calendarWeeks) {
      for (const day of week.days) {
        if (day.totalSpend > 0 && day.isCurrentMonth) {
          days.push(day.date);
        }
      }
    }
    return [...new Set(days)].sort((a, b) => a.localeCompare(b));
  }, [calendarWeeks]);

  const selectedDayIndex = useMemo(() => monthDays.findIndex((day) => day === selectedDay), [monthDays, selectedDay]);

  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) setSelectedDay(monthDays[selectedDayIndex - 1] ?? selectedDay);
  };

  const goToNextDay = () => {
    if (selectedDayIndex >= 0 && selectedDayIndex < monthDays.length - 1) setSelectedDay(monthDays[selectedDayIndex + 1] ?? selectedDay);
  };

  // Sort month totals newest-first for the bottom cards
  const sortedMonthTotals = useMemo(() => [...allMonthTotals].sort((a, b) => b.month.localeCompare(a.month)), [allMonthTotals]);

  // Selection ranges and calculations
  const selectedRange = useMemo(() => {
    if (!selectionStart || !selectionEnd) return null;
    const start = selectionStart <= selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart <= selectionEnd ? selectionEnd : selectionStart;
    return { start, end };
  }, [selectionStart, selectionEnd]);

  const rangeTotals = useMemo(() => {
    if (!selectedRange || selectedRange.start === selectedRange.end) return null;

    const rangeEntries = monthEntries.filter((e) => e.localDate >= selectedRange.start && e.localDate <= selectedRange.end);
    const totalSpend = rangeEntries.reduce((sum, e) => sum + e.amount, 0);
    const dailySpendingEntries = rangeEntries.filter((e) => e.category === "daily_spending");
    const needsEntries = rangeEntries.filter((e) => e.category === "monthly_needs");
    const wantsEntries = rangeEntries.filter((e) => e.category === "monthly_wants");

    return {
      total: totalSpend,
      entriesCount: rangeEntries.length,
      dailyTotal: dailySpendingEntries.reduce((sum, e) => sum + e.amount, 0),
      needsTotal: needsEntries.reduce((sum, e) => sum + e.amount, 0),
      wantsTotal: wantsEntries.reduce((sum, e) => sum + e.amount, 0),
      entries: rangeEntries.sort((a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt)),
    };
  }, [selectedRange, monthEntries]);

  // Global mouseup event to cancel dragging if user releases outside calendar
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const formatDateLabel = (dateStr: string): string => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y!, m! - 1, d!);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

      {/* ── Spending by Month ─── Top Section ─────────────────── */}
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
                <option key={month} value={month}>
                  {month}
                </option>
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
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
              <button
                type="button"
                className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => setCategoryDialog("daily_spending")}>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center transition-transform group-hover:scale-110">
                  <IconifyIcon icon="fluent:calendar-ltr-24-filled" className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Monthly Daily</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrencyIDR(dailySpendingTotal)}</p>
                <p className="mt-1 text-sm font-medium text-indigo-600/80">{dailySpendingEntries.length} entries</p>
                <div className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  View Detail{" "}
                  <IconifyIcon
                    icon="fluent:arrow-right-16-regular"
                    className="ml-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                  />
                </div>
              </button>

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
                  View Detail{" "}
                  <IconifyIcon
                    icon="fluent:arrow-right-16-regular"
                    className="ml-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                  />
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
                  View Detail{" "}
                  <IconifyIcon
                    icon="fluent:arrow-right-16-regular"
                    className="ml-1 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                  />
                </div>
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 pt-2 border-slate-100">Calendar Spend</h3>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total Weekly"].map((day, idx) => (
                  <div
                    key={day}
                    className={`p-1.5 md:p-2 text-center text-[10px] md:text-xs font-semibold text-slate-500 ${idx === 7 ? "bg-slate-100/50 border-l border-slate-200" : ""}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex flex-col bg-slate-200 gap-[1px] select-none">
                {calendarWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-8 gap-[1px]">
                    {week.days.map((day) => {
                      const isSelected = selectedDay === day.date;
                      const isInRange =
                        selectedRange && day.isCurrentMonth ? day.date >= selectedRange.start && day.date <= selectedRange.end : false;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={!day.isCurrentMonth}
                          onMouseDown={(e) => {
                            if (!day.isCurrentMonth) return;
                            if (e.shiftKey && selectionStart) {
                              setSelectionEnd(day.date);
                            } else {
                              setIsDragging(true);
                              setSelectionStart(day.date);
                              setSelectionEnd(day.date);
                            }
                          }}
                          onMouseEnter={() => {
                            if (isDragging && day.isCurrentMonth) {
                              setSelectionEnd(day.date);
                            }
                          }}
                          onMouseUp={() => {
                            if (isDragging) {
                              setIsDragging(false);
                            }
                          }}
                          onClick={(e) => {
                            // If a drag range selection was completed, prevent opening the single day dialog
                            if (selectionStart && selectionEnd && selectionStart !== selectionEnd) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            if (day.entriesCount > 0) {
                              // Reset range selection when viewing single day details
                              setSelectionStart(null);
                              setSelectionEnd(null);
                              setSelectedDay(day.date);
                              setIsDayDialogOpen(true);
                            }
                          }}
                          className={`
                            relative flex flex-col p-1 md:p-1.5 lg:p-2 aspect-[4/5] sm:aspect-square md:aspect-auto md:min-h-[5.5rem] focus:outline-none transition-all duration-150 group select-none
                            ${
                              !day.isCurrentMonth
                                ? "text-slate-300 bg-slate-50/30 cursor-default"
                                : isInRange
                                  ? "bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-inset ring-indigo-200/60 z-10"
                                  : "bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                            }
                            ${isSelected ? "ring-2 ring-inset ring-indigo-600 bg-indigo-50/40 z-10" : ""}
                          `}>
                          <div className="flex justify-between items-start w-full">
                            <span className={`text-[10px] md:text-xs lg:text-sm font-medium`}>{day.dayOfMonth}</span>
                            {/* {day.entriesCount > 0 && day.isCurrentMonth && (
                              <span className="text-[9px] md:text-[10px] lg:text-xs font-semibold text-blue-500">
                                {day.entriesCount}
                              </span>
                            )} */}
                          </div>

                          <div className="mt-auto pt-0.5 md:pt-1 w-full text-left">
                            {day.isCurrentMonth && (day.totalSpend > 0 || day.isPastDay) && (
                              <span
                                className={`text-[8px] md:text-[10px] lg:text-xs font-medium block line-clamp-2 md:truncate break-words leading-tight ${day.totalSpend > 0 ? "text-red-600" : "text-slate-400"}`}>
                                {formatCurrencyIDR(day.totalSpend)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {/* Weekly Total Column */}
                    <div className="p-1 md:p-1.5 lg:p-2 flex flex-col justify-center items-end bg-slate-50 overflow-hidden">
                      {week.weeklyTotal > 0 && (
                        <span
                          className="text-[9px] md:text-[10px] lg:text-xs font-bold text-red-600 block line-clamp-2 md:truncate break-words leading-tight w-full text-right"
                          title={formatCurrencyIDR(week.weeklyTotal)}>
                          {formatCurrencyIDR(week.weeklyTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!selectedDayData && (
              <p className="text-xs font-medium text-slate-400 text-center py-2">Select a calendar day to see detailed breakdown.</p>
            )}
          </div>
        )}
      </section>

      {/* ── Monthly Totals ─── Bottom Cards ───────────────────── */}
      {sortedMonthTotals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconifyIcon icon="fluent:calendar-month-24-filled" className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Monthly Totals</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMonthTotals.map((mt, i) => {
              const isSelected = mt.month === selectedMonth;
              return (
                <motion.button
                  key={mt.month}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`group relative text-left rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-br from-accent/5 to-accent/10 ring-2 ring-accent/30"
                      : "bg-white ring-1 ring-slate-100 hover:ring-slate-200"
                  }`}
                  onClick={() => setSelectedMonth(mt.month)}>
                  {/* Accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors ${isSelected ? "bg-accent" : "bg-slate-200 group-hover:bg-accent/40"}`}
                  />

                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-bold tracking-wide ${isSelected ? "text-accent" : "text-slate-600"}`}>
                      {formatMonthLabel(mt.month)}
                    </p>
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">{formatCurrencyIDR(mt.grandTotal)}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                        Daily
                      </span>
                      <span className="font-semibold text-slate-700">{formatCurrencyIDR(mt.daily_spending)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Needs
                      </span>
                      <span className="font-semibold text-slate-700">{formatCurrencyIDR(mt.monthly_needs)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                        Wants
                      </span>
                      <span className="font-semibold text-slate-700">{formatCurrencyIDR(mt.monthly_wants)}</span>
                    </div>
                  </div>

                  {/* Stacked bar indicator */}
                  {mt.grandTotal > 0 && (
                    <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-indigo-500 transition-all" style={{ width: `${(mt.daily_spending / mt.grandTotal) * 100}%` }} />
                      <div className="bg-emerald-500 transition-all" style={{ width: `${(mt.monthly_needs / mt.grandTotal) * 100}%` }} />
                      <div className="bg-rose-500 transition-all" style={{ width: `${(mt.monthly_wants / mt.grandTotal) * 100}%` }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

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
        entries={
          categoryDialog === "daily_spending" ? sortedDailyEntries : categoryDialog === "needs" ? sortedNeedsEntries : sortedWantsEntries
        }
      />

      {/* ── Floating Range Summation Card ─────────────────────── */}
      <AnimatePresence>
        {rangeTotals && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-xl backdrop-blur-md md:bottom-24">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  <IconifyIcon icon="fluent:calendar-range-24-filled" className="h-3 w-3" />
                  Selected Range
                </span>
                <p className="text-[10px] font-semibold text-slate-500">
                  {formatDateLabel(selectedRange!.start)} – {formatDateLabel(selectedRange!.end)}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-extrabold text-slate-900">{formatCurrencyIDR(rangeTotals.total)}</p>
                  <span className="text-[10px] font-semibold text-slate-500">({rangeTotals.entriesCount} entries)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRangeDetailOpen(true)}
                  className="flex h-9 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 text-xs font-bold text-white transition-colors">
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionStart(null);
                    setSelectionEnd(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  aria-label="Clear selection">
                  <IconifyIcon icon="fluent:dismiss-24-regular" className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Small category breakdown bar if range total > 0 */}
            {rangeTotals.total > 0 && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="bg-indigo-500 transition-all  "
                    style={{ width: `${(rangeTotals.dailyTotal / rangeTotals.total) * 100}%` }}
                    title={`Daily: ${formatCurrencyIDR(rangeTotals.dailyTotal)}`}
                  />
                  <div
                    className="bg-emerald-500 transition-all "
                    style={{ width: `${(rangeTotals.needsTotal / rangeTotals.total) * 100}%` }}
                    title={`Needs: ${formatCurrencyIDR(rangeTotals.needsTotal)}`}
                  />
                  <div
                    className="bg-rose-500 transition-all "
                    style={{ width: `${(rangeTotals.wantsTotal / rangeTotals.total) * 100}%` }}
                    title={`Wants: ${formatCurrencyIDR(rangeTotals.wantsTotal)}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 " /> Daily: {formatCurrencyIDR(rangeTotals.dailyTotal)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 " /> Needs: {formatCurrencyIDR(rangeTotals.needsTotal)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 " /> Wants: {formatCurrencyIDR(rangeTotals.wantsTotal)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Range Detail Dialog ────────────────────────────────── */}
      {isRangeDetailOpen && rangeTotals && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-800">Range Spending Detail</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {formatDateLabel(selectedRange!.start)} – {formatDateLabel(selectedRange!.end)}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Total Range Spend: <span className="text-indigo-600 font-bold">{formatCurrencyIDR(rangeTotals.total)}</span>
                </p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                onClick={() => setIsRangeDetailOpen(false)}>
                <IconifyIcon icon="fluent:dismiss-24-regular" className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 border-b border-slate-100 pb-4 text-center">
              <div className="rounded-xl bg-indigo-50/50 p-2 border border-indigo-100/30">
                <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Daily</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrencyIDR(rangeTotals.dailyTotal)}</span>
              </div>
              <div className="rounded-xl bg-emerald-50/50 p-2 border border-emerald-100/30">
                <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">Needs</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrencyIDR(rangeTotals.needsTotal)}</span>
              </div>
              <div className="rounded-xl bg-rose-50/50 p-2 border border-rose-100/30">
                <span className="text-[10px] font-bold text-rose-600 block uppercase tracking-wider">Wants</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrencyIDR(rangeTotals.wantsTotal)}</span>
              </div>
            </div>

            <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {rangeTotals.entries.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No spending entries in this range.</p>
              ) : (
                rangeTotals.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{entry.localDate}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                          {entry.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{formatCurrencyIDR(entry.amount)}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
