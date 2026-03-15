"use client";

import { useCallback, useEffect, useState } from "react";
import { SpendingCharts } from "@/components/spending-charts";
import { getDailyTotalsByCategory, getMonthlyCategorySeries, getTrendByCategory } from "@/lib/db/repositories/transactions";
import type { ExpenseCategory } from "@/lib/types";

export default function AnalyticsPage() {
  const [monthlySeries, setMonthlySeries] = useState<Array<{ month: string } & Record<ExpenseCategory, number>>>([]);
  const [categoryPie, setCategoryPie] = useState<Array<{ name: string; value: number }>>([]);
  const [trend, setTrend] = useState<Array<{ label: string; total: number }>>([]);

  const refresh = useCallback(async () => {
    const [monthData, pieData, trendData] = await Promise.all([
      getMonthlyCategorySeries(6),
      getDailyTotalsByCategory(),
      getTrendByCategory("daily_spending", 14),
    ]);

    setMonthlySeries(monthData);
    setCategoryPie(pieData);
    setTrend(trendData);
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

      <SpendingCharts monthlySeries={monthlySeries} categoryPie={categoryPie} trend={trend} />
    </div>
  );
}
