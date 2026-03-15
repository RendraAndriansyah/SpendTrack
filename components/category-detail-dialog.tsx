import { Icon as IconifyIcon } from "@iconify/react";
import { formatCurrencyIDR } from "@/lib/analytics/format";
import type { Transaction } from "@/lib/types";

interface CategoryDetailDialogProps {
  type: "needs" | "wants" | null;
  onClose: () => void;
  selectedMonth: string;
  entries: Transaction[];
}

export function CategoryDetailDialog({
  type,
  onClose,
  selectedMonth,
  entries,
}: CategoryDetailDialogProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-lg font-bold text-slate-800">
              {type === "needs" ? "Monthly Needs Detail" : "Monthly Wants Detail"}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Month: <span className="text-slate-700">{selectedMonth}</span></p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            onClick={onClose}>
            <IconifyIcon icon="fluent:dismiss-24-regular" className="h-5 w-5" />
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No {type} entries for this month.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{entry.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.localDate}</p>
                </div>
                <p className="text-sm font-bold text-slate-700">{formatCurrencyIDR(entry.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
