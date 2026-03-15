"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SpendingChartsProps {
  categoryPie: Array<{ name: string; value: number }>;
  trend: Array<{ label: string; total: number }>;
  trendNeeds: Array<{ label: string; total: number }>;
  trendWants: Array<{ label: string; total: number }>;
  // Comparison data
  categoryPieCmp: Array<{ name: string; value: number }>;
  trendCmp: Array<{ label: string; total: number }>;
  trendNeedsCmp: Array<{ label: string; total: number }>;
  trendWantsCmp: Array<{ label: string; total: number }>;
  selectedLabel: string;
  compareLabel: string;
  currencyFormatter: (value: number) => string;
}



const CHART_STYLE = { borderRadius: "0.75rem", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" };

// Merge two trend arrays by day-of-month ("DD") so that different months align properly
function mergeTrends(
  current: Array<{ label: string; total: number }>,
  compare: Array<{ label: string; total: number }>,
) {
  // label is "MM-DD" — extract the day part for alignment
  const dayOf = (label: string) => {
    const parts = label.split("-");
    return parts.length >= 2 ? parts[parts.length - 1]! : label;
  };

  const map = new Map<string, { label: string; current: number; compare: number }>();
  for (const d of current) {
    const day = dayOf(d.label);
    map.set(day, { label: day, current: d.total, compare: 0 });
  }
  for (const d of compare) {
    const day = dayOf(d.label);
    const existing = map.get(day);
    if (existing) {
      existing.compare = d.total;
    } else {
      map.set(day, { label: day, current: 0, compare: d.total });
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}



interface DeltaBadgeProps { a: number; b: number; fmt: (n: number) => string }
function DeltaBadge({ a, b, fmt }: DeltaBadgeProps) {
  const delta = a - b;
  if (delta === 0) return <span className="text-xs font-medium text-slate-400">—</span>;
  const positive = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-rose-500" : "text-emerald-500"}`}>
      {positive ? "▲" : "▼"} {fmt(Math.abs(delta))}
    </span>
  );
}

export function SpendingCharts({
  categoryPie,
  trend,
  trendNeeds,
  trendWants,
  categoryPieCmp,
  trendCmp,
  trendNeedsCmp,
  trendWantsCmp,
  selectedLabel,
  compareLabel,
  currencyFormatter,
}: SpendingChartsProps) {
  const trendMerged = mergeTrends(trend, trendCmp);
  const trendNeedsMerged = mergeTrends(trendNeeds, trendNeedsCmp);
  const trendWantsMerged = mergeTrends(trendWants, trendWantsCmp);

  const mainTotal = categoryPie.reduce((s, d) => s + d.value, 0);
  const cmpTotal = categoryPieCmp.reduce((s, d) => s + d.value, 0);

  const CATEGORY_LABELS: Record<string, string> = {
    daily_spending: "Daily Spending",
    monthly_needs: "Needs",
    monthly_wants: "Wants",
  };

  const mainByCategory: Record<string, number> = {};
  for (const c of categoryPie) mainByCategory[c.name] = c.value;
  const cmpByCategory: Record<string, number> = {};
  for (const c of categoryPieCmp) cmpByCategory[c.name] = c.value;

  return (
    <div className="space-y-4">
      {/* ── Summary Comparison Card ─────────────────────────────── */}
      <section className="card p-5 md:p-6 border-0 ring-1 ring-slate-100 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Monthly Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="pb-2 text-right text-xs font-semibold text-accent uppercase tracking-wider">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent mr-1 align-middle" />
                  {selectedLabel}
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 mr-1 align-middle" />
                  {compareLabel}
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Δ Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {["daily_spending", "monthly_needs", "monthly_wants"].map((key) => (
                <tr key={key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 font-medium text-slate-700">{CATEGORY_LABELS[key]}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">
                    {currencyFormatter(mainByCategory[key] ?? 0)}
                  </td>
                  <td className="py-2.5 text-right text-slate-500">
                    {currencyFormatter(cmpByCategory[key] ?? 0)}
                  </td>
                  <td className="py-2.5 text-right">
                    <DeltaBadge a={mainByCategory[key] ?? 0} b={cmpByCategory[key] ?? 0} fmt={currencyFormatter} />
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-200">
                <td className="pt-3 pb-1 font-bold text-slate-800">Total</td>
                <td className="pt-3 pb-1 text-right font-bold text-slate-900">{currencyFormatter(mainTotal)}</td>
                <td className="pt-3 pb-1 text-right font-bold text-slate-500">{currencyFormatter(cmpTotal)}</td>
                <td className="pt-3 pb-1 text-right">
                  <DeltaBadge a={mainTotal} b={cmpTotal} fmt={currencyFormatter} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Charts Grid ─────────────────────────────────────────── */}
      <div className="grid gap-4">

        {/* Daily Spending Trend — overlaid */}
        <section className="card h-72 border-0 ring-1 ring-slate-100 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Daily Spending Trend</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={trendMerged}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <YAxis tickFormatter={(v) => currencyFormatter(Number(v))} stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <Tooltip formatter={(v) => currencyFormatter(Number(v))} contentStyle={CHART_STYLE} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line dataKey="current" name={selectedLabel} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              <Line dataKey="compare" name={compareLabel} stroke="#a5b4fc" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Monthly Needs Trend — overlaid */}
        <section className="card h-72 border-0 ring-1 ring-slate-100 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Monthly Needs Trend</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={trendNeedsMerged}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <YAxis tickFormatter={(v) => currencyFormatter(Number(v))} stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <Tooltip formatter={(v) => currencyFormatter(Number(v))} contentStyle={CHART_STYLE} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line dataKey="current" name={selectedLabel} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              <Line dataKey="compare" name={compareLabel} stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Monthly Wants Trend — overlaid */}
        <section className="card h-72 border-0 ring-1 ring-slate-100 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Monthly Wants Trend</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={trendWantsMerged}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <YAxis tickFormatter={(v) => currencyFormatter(Number(v))} stroke="#94a3b8" fontSize={12} tickMargin={8} />
              <Tooltip formatter={(v) => currencyFormatter(Number(v))} contentStyle={CHART_STYLE} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line dataKey="current" name={selectedLabel} stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              <Line dataKey="compare" name={compareLabel} stroke="#fda4af" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
