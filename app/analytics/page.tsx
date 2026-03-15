"use client";

import { useCallback, useEffect, useState } from "react";
import { SpendingCharts } from "@/components/spending-charts";
import { getAnalyticsByDateRange, getTransactionDateBounds } from "@/lib/db/repositories/transactions";
import { formatCurrencyIDRComma } from "@/lib/analytics/format";
import type { ExpenseCategory } from "@/lib/types";

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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
    const initializeBounds = async () => {
      const bounds = await getTransactionDateBounds();
      if (!bounds) {
        setLoading(false);
        return;
      }

      setFromDate(bounds.from);
      setToDate(bounds.to);
    };

    initializeBounds();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-4">
      <header className="card">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-slate-500">Trend and category insights across your spending history.</p>
      </header>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Date Range</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">From</span>
            <input className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">To</span>
            <input className="input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>
        {fromDate && toDate && fromDate > toDate ? <p className="text-sm text-rose-500">`From` date cannot be after `To` date.</p> : null}
      </section>

      {loading ? <p className="text-sm text-slate-500">Loading analytics...</p> : null}

      <SpendingCharts monthlySeries={monthlySeries} categoryPie={categoryPie} trend={trend} currencyFormatter={formatCurrencyIDRComma} />
    </div>
  );
}
