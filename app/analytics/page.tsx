"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { SpendingCharts } from "@/components/spending-charts";
import { getAnalyticsByDateRange } from "@/lib/db/repositories/transactions";
import { formatCurrencyIDRComma } from "@/lib/analytics/format";
import { toLocalDateString } from "@/lib/time/timezone";
import type { ExpenseCategory } from "@/lib/types";

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  });
  
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return toLocalDateString(lastDay);
  });
  
  const [loading, setLoading] = useState(true);
  const [monthlySeries, setMonthlySeries] = useState<Array<{ month: string } & Record<ExpenseCategory, number>>>([]);
  const [categoryPie, setCategoryPie] = useState<Array<{ name: string; value: number }>>([]);
  const [trend, setTrend] = useState<Array<{ label: string; total: number }>>([]);

  const refresh = useCallback(async () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      return;
    }

    setLoading(true);
    const data = await getAnalyticsByDateRange(fromDate, toDate);

    setMonthlySeries(data.monthlySeries);
    setCategoryPie(data.categoryPie);
    setTrend(data.trend);
    setLoading(false);
  }, [fromDate, toDate]);



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
        <h2 className="text-base font-semibold text-slate-800">Date Range</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block sm:max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">From</span>
            <input className="input font-medium text-slate-700 bg-white" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label className="block sm:max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">To</span>
            <input className="input font-medium text-slate-700 bg-white" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>
        <AnimatePresence>
          {fromDate && toDate && fromDate > toDate ? (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm font-medium text-rose-500 flex items-center gap-1.5"
            >
              <IconifyIcon icon="fluent:error-circle-20-regular" />
              `From` date cannot be after `To` date.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.section>

      {loading ? (
        <div className="card p-8 flex flex-col items-center justify-center border-0 ring-1 ring-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-accent mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading analytics...</p>
        </div>
      ) : (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.1 }}
        >
          <SpendingCharts monthlySeries={monthlySeries} categoryPie={categoryPie} trend={trend} currencyFormatter={formatCurrencyIDRComma} />
        </motion.div>
      )}
    </div>
  );
}
