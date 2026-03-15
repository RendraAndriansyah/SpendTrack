"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { ExpenseCategory } from "@/lib/types";

interface SpendingChartsProps {
  monthlySeries: Array<{ month: string } & Record<ExpenseCategory, number>>;
  categoryPie: Array<{ name: string; value: number }>;
  trend: Array<{ label: string; total: number }>;
  currencyFormatter: (value: number) => string;
}

const COLORS = ["#4f46e5", "#10b981", "#f43f5e"]; // Indigo-600, Emerald-500, Rose-500

export function SpendingCharts({ monthlySeries, categoryPie, trend, currencyFormatter }: SpendingChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card h-72">
        <h2 className="mb-3 text-sm font-semibold">Month by Category</h2>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={monthlySeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <YAxis tickFormatter={(value) => currencyFormatter(Number(value))} stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <Tooltip 
              formatter={(value) => currencyFormatter(Number(value))}
              contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="daily_spending" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Daily Spending" />
            <Bar dataKey="monthly_needs" fill="#10b981" radius={[4, 4, 0, 0]} name="Monthly Needs" />
            <Bar dataKey="monthly_wants" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Monthly Wants" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="card h-72">
        <h2 className="mb-3 text-sm font-semibold">Category Split</h2>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
              {categoryPie.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => currencyFormatter(Number(value))} 
              contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="card h-72 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold">Daily Spending Trend</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <YAxis tickFormatter={(value) => currencyFormatter(Number(value))} stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <Tooltip 
              formatter={(value) => currencyFormatter(Number(value))} 
              contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }} 
            />
            <Line dataKey="total" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
