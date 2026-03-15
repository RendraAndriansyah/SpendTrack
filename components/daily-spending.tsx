import { formatCurrencyIDR } from "@/lib/analytics/format";
import type { Transaction } from "@/lib/types";

interface DailySpendingProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dailyTotal: number;
  dailyEntries: Transaction[];
}

export function DailySpending({ selectedDate, setSelectedDate, dailyTotal, dailyEntries }: DailySpendingProps) {
  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Daily Spending by Date</h2>
          <p className="text-xs text-slate-500 mt-0.5">Select date to see details.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Date</span>
          <input 
            className="input w-40" 
            type="date" 
            value={selectedDate} 
            onChange={(event) => setSelectedDate(event.target.value)} 
          />
        </label>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-mint/10 to-mint/20 border border-mint/20 p-4">
        <p className="text-xs font-semibold text-mint drop-shadow-sm uppercase tracking-wide">Total Daily Spending</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrencyIDR(dailyTotal)}</p>
      </div>

      {dailyEntries.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-2">No daily spending entries for this date.</p>
      ) : (
        <ul className="space-y-2">
          {dailyEntries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-800">{entry.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">{entry.localDate}</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{formatCurrencyIDR(entry.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
