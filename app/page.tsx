"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon as IconifyIcon } from "@iconify/react";
import { toast } from "sonner";
import { QuickEntryForm } from "@/components/quick-entry-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  deleteTransactionById,
  getDailySpendingByDate,
  getTransactionsByCategory,
  searchTransactionsByCategory,
  updateTransactionById,
} from "@/lib/db/repositories/transactions";
import { formatCurrencyIDR } from "@/lib/analytics/format";
import { toLocalDateString } from "@/lib/time/timezone";
import type { ExpenseCategory, Transaction } from "@/lib/types";

const options: Array<{ category: ExpenseCategory; label: string; icon: string; subtitle: string }> = [
  {
    category: "daily_spending",
    label: "Daily Spending",
    icon: "fluent-color:wallet-credit-card-24",
    subtitle: "Food, transport, small daily costs",
  },
  {
    category: "monthly_wants",
    label: "Monthly Wants",
    icon: "fluent-color:sparkle-24",
    subtitle: "Lifestyle and non-essential spending",
  },
  {
    category: "monthly_needs",
    label: "Monthly Needs",
    icon: "fluent-color:home-24",
    subtitle: "Bills, obligations, and essentials",
  },
];

export default function LandingInputPage() {
  const pageSize = 8;
  const today = toLocalDateString(new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [listMessage, setListMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [manageCategory, setManageCategory] = useState<ExpenseCategory>("daily_spending");
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyEntries, setDailyEntries] = useState<Transaction[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);

  const formatAmountInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      return "";
    }
    return Number(digitsOnly).toLocaleString("en-US");
  };

  const active = options[activeIndex] ?? options[0];
  const totalCards = options.length;

  const goPrev = () => {
    setDirection(-1);
    setActiveIndex((current) => (current - 1 + totalCards) % totalCards);
  };

  const goNext = () => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % totalCards);
  };

  const refreshRows = useCallback(async () => {
    setLoadingRows(true);
    const keyword = searchQuery.trim();
    const result = keyword
      ? await searchTransactionsByCategory(manageCategory, keyword, 200)
      : await getTransactionsByCategory(manageCategory, 200);
    setRows(result);
    setLoadingRows(false);
  }, [manageCategory, searchQuery]);

  useEffect(() => {
    setManageCategory(active.category);
  }, [active.category]);

  useEffect(() => {
    setEditingId(null);
    setListMessage("");
    setPage(1);
  }, [manageCategory, searchQuery]);

  useEffect(() => {
    refreshRows();
  }, [refreshRows]);

  const refreshDaily = useCallback(async () => {
    const daily = await getDailySpendingByDate(selectedDate);
    setDailyEntries(daily.entries);
    setDailyTotal(daily.total);
  }, [selectedDate]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshRows(), refreshDaily()]);
  }, [refreshRows, refreshDaily]);

  useEffect(() => {
    refreshDaily();
  }, [refreshDaily]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;

    if (Math.abs(delta) < 40) {
      setTouchStartX(null);
      return;
    }

    if (delta > 0) {
      goPrev();
    } else {
      goNext();
    }
    setTouchStartX(null);
  };

  const startEdit = (row: Transaction) => {
    setEditingId(row.id);
    setEditAmount(Number(row.amount).toLocaleString("en-US"));
    setEditDescription(row.description);
    setEditDate(row.localDate);
    setListMessage("");
  };

  const saveEdit = async (id: string) => {
    const amount = Number(editAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0 || !editDescription.trim()) {
      setListMessage("Please provide valid amount and description before updating.");
      return;
    }

    try {
      await updateTransactionById(id, {
        amount,
        description: editDescription,
        date: editDate,
        category: manageCategory,
      });

      setEditingId(null);
      setListMessage("Entry updated.");
      toast.success("Entry updated.");
      await refreshAll();
    } catch {
      setListMessage("Update failed. Please try again.");
      toast.error("Failed to update entry.");
    }
  };

  const removeRow = async (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }

    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const target = rows.find((row) => row.id === id);
    setDeletingId(id);
    setListMessage("Deleting entry...");

    setRows((current) => current.filter((row) => row.id !== id));
    if (target && target.category === "daily_spending" && target.localDate === selectedDate) {
      setDailyEntries((current) => current.filter((entry) => entry.id !== id));
      setDailyTotal((current) => current - target.amount);
    }

    try {
      await deleteTransactionById(id);
      setListMessage("Entry deleted.");
      toast.success("Entry deleted.");
      if (editingId === id) {
        setEditingId(null);
      }
      await refreshAll();
    } catch {
      setListMessage("Delete failed. Please try again.");
      toast.error("Failed to delete entry.");
      await refreshAll();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <header className="card p-4 md:p-5">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <IconifyIcon icon="fluent-color:wallet-credit-card-24" className="h-5 w-5" />
          Quick Input
        </h1>
        <p className="mt-1 text-sm text-slate-500">Choose a spending type by sliding cards, then add your entry.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/dashboard" className="btn-secondary inline-flex w-full items-center justify-center text-xs">
            <span className="inline-flex items-center gap-1">
              <IconifyIcon icon="fluent-color:bar-chart-24" className="h-4 w-4" />
              Open Dashboard
            </span>
          </Link>
          <Link href="/analytics" className="btn-secondary inline-flex w-full items-center justify-center text-xs">
            <span className="inline-flex items-center gap-1">
              <IconifyIcon icon="fluent-color:line-chart-24" className="h-4 w-4" />
              View Analytics
            </span>
          </Link>
        </div>
      </header>

      <section className="card p-4 md:p-5">
        <div className="flex items-center gap-2" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <button
            type="button"
            className="h-12 w-12 rounded-2xl border border-lavender/60 bg-white p-0 shadow-soft transition hover:-translate-y-0.5 hover:bg-lavender/20 active:translate-y-0"
            onClick={goPrev}
            aria-label="Previous category">
            <IconifyIcon icon="mdi:chevron-left-circle" className="mx-auto h-6 w-6 text-accent" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.category}
              className="flex-1 rounded-2xl border border-accent bg-accent/10 p-4"
              initial={{ opacity: 0, x: 26 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -26 * direction }}
              transition={{ duration: 0.2, ease: "easeOut" }}>
              <p className="flex items-center gap-2 text-lg font-semibold">
                <IconifyIcon icon={active.icon} className="h-5 w-5" />
                {active.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{active.subtitle}</p>
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            className="h-12 w-12 rounded-2xl border border-lavender/60 bg-white p-0 shadow-soft transition hover:-translate-y-0.5 hover:bg-lavender/20 active:translate-y-0"
            onClick={goNext}
            aria-label="Next category">
            <IconifyIcon icon="mdi:chevron-right-circle" className="mx-auto h-6 w-6 text-accent" />
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500 md:hidden">
          <IconifyIcon icon="fluent-color:hand-right-24" className="h-3.5 w-3.5" />
          Swipe left/right to change category
        </p>
        <div className="mt-3 flex justify-center gap-2">
          {options.map((item, index) => (
            <button
              key={item.category}
              type="button"
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1);
                setActiveIndex(index);
              }}
              aria-label={`Go to ${item.label}`}
              className={`h-2.5 w-2.5 rounded-full ${index === activeIndex ? "bg-accent" : "bg-lavender"}`}
            />
          ))}
        </div>
      </section>

      <QuickEntryForm key={active.category} category={active.category} title={`Add ${active.label}`} onCreated={refreshAll} />

      <section className="card space-y-3 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Daily Spending by Date</h2>
            <p className="text-xs text-slate-500">Select date to see daily spending details.</p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Date</span>
            <input className="input" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total Daily Spending</p>
          <p className="text-xl font-bold">{formatCurrencyIDR(dailyTotal)}</p>
        </div>

        {dailyEntries.length === 0 ? (
          <p className="text-sm text-slate-500">No daily spending entries for this date.</p>
        ) : (
          <ul className="space-y-2">
            {dailyEntries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{entry.description}</p>
                  <p className="text-xs text-slate-500">{entry.localDate}</p>
                </div>
                <p className="font-semibold">{formatCurrencyIDR(entry.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-base font-semibold">Manage Entries</h2>
        <div className="grid grid-cols-3 gap-2">
          {options.map((item) => (
            <button
              key={`manage-${item.category}`}
              type="button"
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                manageCategory === item.category ? "bg-accent text-white" : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => setManageCategory(item.category)}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Search by description or amount</span>
          <div className="relative">
            <IconifyIcon icon="fluent-color:search-24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              className="input pl-10"
              type="text"
              placeholder="e.g. coffee or 15000"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </label>
        {listMessage ? <p className="text-sm text-slate-600">{listMessage}</p> : null}
        {loadingRows ? (
          <p className="text-sm text-slate-500">Loading entries...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {searchQuery.trim() ? "No matching entries for this search." : "No entries yet in this category."}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {rows.slice((page - 1) * pageSize, page * pageSize).map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <motion.li
                    layout
                    key={row.id}
                    className="rounded-xl bg-slate-50 p-3 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          className="input"
                          type="text"
                          maxLength={80}
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                        />
                        <input
                          className="input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9,]*"
                          value={editAmount}
                          onChange={(event) => setEditAmount(formatAmountInput(event.target.value))}
                        />
                        <input className="input" type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
                        <div className="flex gap-2">
                          <button type="button" className="btn inline-flex items-center gap-1" onClick={() => saveEdit(row.id)}>
                            <IconifyIcon icon="fluent-color:save-24" className="h-4 w-4" />
                            Save
                          </button>
                          <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={() => setEditingId(null)}>
                            <IconifyIcon icon="fluent-color:dismiss-circle-24" className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{row.description}</p>
                          <p className="text-xs text-slate-500">{row.localDate}</p>
                          <p className="mt-1 font-semibold">{formatCurrencyIDR(row.amount)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            className="btn-secondary inline-flex items-center gap-1 px-3 py-1 text-xs"
                            onClick={() => startEdit(row)}>
                            <IconifyIcon icon="fluent-color:edit-24" className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === row.id}
                            className="inline-flex items-center gap-1 rounded-xl bg-peach px-3 py-1 text-xs font-semibold text-text"
                            onClick={() => removeRow(row.id)}>
                            <IconifyIcon icon="fluent-color:delete-24" className="h-3.5 w-3.5" />
                            {deletingId === row.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                className="btn-secondary px-3 py-1 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Prev
              </button>
              <p className="text-xs text-slate-500">
                Page {page} / {Math.max(1, Math.ceil(rows.length / pageSize))}
              </p>
              <button
                type="button"
                className="btn-secondary px-3 py-1 text-xs"
                disabled={page >= Math.ceil(rows.length / pageSize)}
                onClick={() => setPage((current) => Math.min(Math.ceil(rows.length / pageSize), current + 1))}>
                Next
              </button>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Entry"
        message="Are you sure you want to delete this entry?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
