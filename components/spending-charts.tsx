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
}

const COLORS = ["#7c8cff", "#8de4d5", "#ffc6aa"];

export function SpendingCharts({ monthlySeries, categoryPie, trend }: SpendingChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card h-72">
        <h2 className="mb-3 text-sm font-semibold">Month by Category</h2>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={monthlySeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="daily_spending" fill="#7c8cff" />
            <Bar dataKey="monthly_needs" fill="#8de4d5" />
            <Bar dataKey="monthly_wants" fill="#ffc6aa" />
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
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="card h-72 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold">Daily Spending Trend</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line dataKey="total" stroke="#7c8cff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
