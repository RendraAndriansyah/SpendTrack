import type { ComparisonResult, DashboardTotals, ExpenseCategory } from "@/lib/types";

interface SummaryCardsProps {
  totals: DashboardTotals;
  week: ComparisonResult;
  month: ComparisonResult;
  formatCurrency: (value: number) => string;
}

const labels: Record<ExpenseCategory, string> = {
  daily_spending: "Daily Spending",
  monthly_needs: "Monthly Needs",
  monthly_wants: "Monthly Wants",
};

const Delta = ({ result, formatCurrency }: { result: ComparisonResult; formatCurrency: (value: number) => string }) => {
  const positive = result.delta >= 0;
  return (
    <p className={`text-sm ${positive ? "text-rose-500" : "text-emerald-600"}`}>
      {positive ? "+" : "-"}
      {formatCurrency(Math.abs(result.delta))}
    </p>
  );
};

export function SummaryCards({ totals, week, month, formatCurrency }: SummaryCardsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <article className="card space-y-2 md:col-span-2">
        <p className="text-sm text-slate-500">Total Spending</p>
        <p className="text-2xl font-bold">{formatCurrency(totals.grandTotal)}</p>
      </article>

      <article className="card space-y-1">
        <p className="text-sm text-slate-500">Current Week vs Previous Week</p>
        <p className="text-lg font-semibold">{formatCurrency(week.current)}</p>
        <Delta result={week} formatCurrency={formatCurrency} />
      </article>

      <article className="card space-y-1">
        <p className="text-sm text-slate-500">Current Month vs Previous Month</p>
        <p className="text-lg font-semibold">{formatCurrency(month.current)}</p>
        <Delta result={month} formatCurrency={formatCurrency} />
      </article>

      {(Object.keys(totals.byCategory) as ExpenseCategory[]).map((category) => (
        <article key={category} className="card space-y-1">
          <p className="text-sm text-slate-500">{labels[category]}</p>
          <p className="text-xl font-semibold">{formatCurrency(totals.byCategory[category])}</p>
        </article>
      ))}
    </section>
  );
}
