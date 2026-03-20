"use client";

import { useMemo, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { motion } from "framer-motion";
import { SummaryCards } from "@/components/summary-cards";
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
    allMonthTotals,
  } = useDashboard();

  const [categoryDialog, setCategoryDialog] = useState<"needs" | "wants" | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

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
    
    while (currentDate <= endDate && sanityLimit < 10) {
      sanityLimit++;
      const weekDays = [];
      let weeklyTotal = 0;
      
      for (let i = 0; i < 7; i++) {
        const yearStr = currentDate.getFullYear();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
        const dayStr = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        
        const dayEntries = monthEntries.filter(
          (e) => e.category === "daily_spending" && e.localDate === dateStr
        );
        const totalSpend = dayEntries.reduce((sum, e) => sum + e.amount, 0);
        const entriesCount = dayEntries.length;
        
        weekDays.push({
          date: dateStr,
          dayOfMonth: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === (m ?? 1) - 1,
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
  const sortedMonthTotals = useMemo(
    () => [...allMonthTotals].sort((a, b) => b.month.localeCompare(a.month)),
    [allMonthTotals],
  );

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

            <h3 className="text-lg font-bold text-slate-800 pt-2 border-slate-100">Calendar Spend</h3>
            
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total"].map((day, idx) => (
                  <div key={day} className={`p-1.5 md:p-2 text-center text-[10px] md:text-xs font-semibold text-slate-500 ${idx === 7 ? 'bg-slate-100/50 border-l border-slate-200' : ''}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col bg-slate-200 gap-[1px]">
                {calendarWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-8 gap-[1px]">
                    {week.days.map((day) => {
                      const isSelected = selectedDay === day.date;
                      
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={!day.isCurrentMonth || day.entriesCount === 0}
                          onClick={() => {
                            setSelectedDay(day.date);
                            setIsDayDialogOpen(true);
                          }}
                          className={`
                            relative flex flex-col p-1 md:p-1.5 lg:p-2 bg-white aspect-[4/5] sm:aspect-square md:aspect-auto md:min-h-[5.5rem] focus:outline-none transition-colors group
                            ${!day.isCurrentMonth ? "text-slate-300 bg-slate-50/30" : "text-slate-700"}
                            ${isSelected ? "ring-2 ring-inset ring-accent bg-accent/5 z-10" : ""}
                            ${day.entriesCount > 0 && day.isCurrentMonth ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"}
                          `}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className={`text-[10px] md:text-xs lg:text-sm font-medium`}>
                              {day.dayOfMonth}
                            </span>
                            {day.entriesCount > 0 && day.isCurrentMonth && (
                              <span className="text-[9px] md:text-[10px] lg:text-xs font-semibold text-blue-500">
                                {day.entriesCount}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-auto pt-0.5 md:pt-1 w-full text-left">
                            {day.totalSpend > 0 && day.isCurrentMonth && (
                              <span className="text-[8px] md:text-[10px] lg:text-xs font-medium text-emerald-600 block line-clamp-2 md:truncate break-words leading-tight">
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
                         <span className="text-[9px] md:text-[10px] lg:text-xs font-bold text-slate-600 block line-clamp-2 md:truncate break-words leading-tight w-full text-right" title={formatCurrencyIDR(week.weeklyTotal)}>
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

      <SummaryCards totals={totals} week={weekComparison} month={monthComparison} formatCurrency={formatCurrencyIDR} />

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
                  onClick={() => setSelectedMonth(mt.month)}
                >
                  {/* Accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors ${isSelected ? "bg-accent" : "bg-slate-200 group-hover:bg-accent/40"}`} />

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

                  <p className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">
                    {formatCurrencyIDR(mt.grandTotal)}
                  </p>

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
        entries={categoryDialog === "needs" ? sortedNeedsEntries : sortedWantsEntries}
      />
    </div>
  );
}
