"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { SpendingCharts } from "@/components/spending-charts";
import { getAnalyticsByDateRange } from "@/lib/db/repositories/transactions";
import { formatCurrencyIDRComma } from "@/lib/analytics/format";
import type { ExpenseCategory } from "@/lib/types";

// Returns first and last day of a "YYYY-MM" month string
function monthBounds(yearMonth: string): { from: string; to: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(y!, m!, 0).getDate();
  return {
    from: `${yearMonth}-01`,
    to: `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

// Returns the previous month as a "YYYY-MM" string
function prevMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y!, m! - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Current month in YYYY-MM
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsByDateRange>>;

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [compareMonth, setCompareMonth] = useState(() => prevMonth(currentMonth()));
  const [loading, setLoading] = useState(true);
  const [mainData, setMainData] = useState<AnalyticsData | null>(null);
  const [cmpData, setCmpData] = useState<AnalyticsData | null>(null);

  const selectedBounds = useMemo(() => monthBounds(selectedMonth), [selectedMonth]);
  const compareBounds = useMemo(() => monthBounds(compareMonth), [compareMonth]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [main, cmp] = await Promise.all([
      getAnalyticsByDateRange(selectedBounds.from, selectedBounds.to),
      getAnalyticsByDateRange(compareBounds.from, compareBounds.to),
    ]);
    setMainData(main);
    setCmpData(cmp);
    setLoading(false);
  }, [selectedBounds, compareBounds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="card p-5 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 ring-1 ring-slate-100 shadow-sm">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconifyIcon icon="fluent:data-line-24-filled" className="h-6 w-6" />
          </div>
          Analytics
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">Trend and category insights across your spending history.</p>
      </header>

      <motion.section
        className="card space-y-4 p-5 md:p-6 shadow-sm border-0 ring-1 ring-slate-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <IconifyIcon icon="fluent:calendar-month-24-regular" className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-slate-800">Month Selection</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-accent"></span>
              Selected Month
            </span>
            <input
              className="input font-medium text-slate-700 bg-white"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
              Compare With
            </span>
            <input
              className="input font-medium text-slate-700 bg-white"
              type="month"
              value={compareMonth}
              onChange={(e) => setCompareMonth(e.target.value)}
            />
          </label>
        </div>
        <AnimatePresence>
          {selectedMonth === compareMonth ? (
            <motion.p
              key="same-month-warning"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm font-medium text-amber-500 flex items-center gap-1.5"
            >
              <IconifyIcon icon="fluent:warning-24-regular" />
              Selected and comparison months are the same.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.section>

      {loading ? (
        <div className="card p-8 flex flex-col items-center justify-center border-0 ring-1 ring-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-accent mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading analytics...</p>
        </div>
      ) : mainData && cmpData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <SpendingCharts
            monthlySeries={mainData.monthlySeries}
            categoryPie={mainData.categoryPie}
            trend={mainData.trend}
            trendNeeds={mainData.trendNeeds}
            trendWants={mainData.trendWants}
            categoryPieCmp={cmpData.categoryPie}
            trendCmp={cmpData.trend}
            trendNeedsCmp={cmpData.trendNeeds}
            trendWantsCmp={cmpData.trendWants}
            selectedLabel={selectedMonth}
            compareLabel={compareMonth}
            currencyFormatter={formatCurrencyIDRComma}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
