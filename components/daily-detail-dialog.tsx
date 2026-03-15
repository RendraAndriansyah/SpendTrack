import { Icon as IconifyIcon } from "@iconify/react";
import { formatCurrencyIDR } from "@/lib/analytics/format";
import type { Transaction } from "@/lib/types";

interface DailyDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDayData: { date: string; total: number; entries: Transaction[] } | null;
  onPrevDay: () => void;
  onNextDay: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  totalDays: number;
}

export function DailyDetailDialog({
  isOpen,
  onClose,
  selectedDayData,
  onPrevDay,
  onNextDay,
  canGoPrev,
  canGoNext,
}: DailyDetailDialogProps) {
  if (!isOpen || !selectedDayData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-800">Daily Detail ({selectedDayData.date})</p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Total: <span className="text-accent font-bold">{formatCurrencyIDR(selectedDayData.total)}</span></p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            onClick={onClose}>
            <IconifyIcon icon="fluent:dismiss-24-regular" className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-600"
            onClick={onPrevDay}
            disabled={!canGoPrev}>
            <IconifyIcon icon="fluent:chevron-left-24-regular" className="h-4 w-4" />
            Previous Day
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-600"
            onClick={onNextDay}
            disabled={!canGoNext}>
            Next Day
            <IconifyIcon icon="fluent:chevron-right-24-regular" className="h-4 w-4" />
          </button>
        </div>

        <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {selectedDayData.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-800">{entry.description}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">{entry.category.replace('_', ' ')}</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{formatCurrencyIDR(entry.amount)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
