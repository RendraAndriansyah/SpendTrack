import { useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrencyIDR } from "@/lib/analytics/format";
import type { ExpenseCategory, Transaction } from "@/lib/types";
import type { UpdateTransactionInput } from "@/lib/db/repositories/transactions";

interface ManageEntriesProps {
  options: Array<{ category: ExpenseCategory; label: string }>;
  manageCategory: ExpenseCategory;
  setManageCategory: (cat: ExpenseCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  rows: Transaction[];
  loadingRows: boolean;
  onUpdate: (id: string, updateData: UpdateTransactionInput) => Promise<boolean>;
  onDelete: (id: string, transaction?: Transaction) => Promise<boolean>;
}

export function ManageEntries({
  options,
  manageCategory,
  setManageCategory,
  searchQuery,
  setSearchQuery,
  rows,
  loadingRows,
  onUpdate,
  onDelete,
}: ManageEntriesProps) {
  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatAmountInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return Number(digitsOnly).toLocaleString("en-US");
  };

  const startEdit = (row: Transaction) => {
    setEditingId(row.id);
    setEditAmount(Number(row.amount).toLocaleString("en-US"));
    setEditDescription(row.description);
    setEditDate(row.localDate);
  };

  const saveEdit = async (id: string) => {
    const amount = Number(editAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0 || !editDescription.trim()) {
      return;
    }

    const success = await onUpdate(id, {
      amount,
      description: editDescription,
      date: editDate,
      category: manageCategory,
    });

    if (success) {
      setEditingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    
    const target = rows.find((r) => r.id === id);
    await onDelete(id, target);
    
    if (editingId === id) setEditingId(null);
    setDeletingId(null);
  };

  return (
    <section className="card space-y-4">
      <h2 className="text-base font-semibold text-slate-800">Manage Entries</h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map((item) => (
          <button
            key={`manage-${item.category}`}
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              manageCategory === item.category 
                ? "bg-accent text-white shadow" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => {
              setManageCategory(item.category);
              setPage(1);
              setEditingId(null);
            }}>
            {item.label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Search description or amount</span>
        <div className="relative">
          <IconifyIcon icon="fluent:search-24-regular" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            type="text"
            placeholder="e.g. coffee or 15000"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </label>

      {loadingRows ? (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-4">
          {searchQuery.trim() ? "No matching entries found." : "No entries yet in this category."}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.slice((page - 1) * pageSize, page * pageSize).map((row) => {
              const isEditing = editingId === row.id;

              return (
                <motion.li
                  layout
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        className="input"
                        type="text"
                        maxLength={80}
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        placeholder="Description"
                      />
                      <input
                        className="input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9,]*"
                        value={editAmount}
                        onChange={(event) => setEditAmount(formatAmountInput(event.target.value))}
                        placeholder="Amount"
                      />
                      <input className="input" type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
                      <div className="flex gap-2 pt-1">
                        <button type="button" className="btn flex-1 inline-flex justify-center items-center gap-1.5" onClick={() => saveEdit(row.id)}>
                          <IconifyIcon icon="fluent:save-24-regular" className="h-4 w-4" />
                          Save
                        </button>
                        <button type="button" className="btn-secondary flex-1 inline-flex justify-center items-center gap-1.5" onClick={() => setEditingId(null)}>
                          <IconifyIcon icon="fluent:dismiss-circle-24-regular" className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{row.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{row.localDate}</p>
                        <p className="mt-1.5 text-sm font-bold text-accent">{formatCurrencyIDR(row.amount)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          className="btn-secondary inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs"
                          onClick={() => startEdit(row)}>
                          <IconifyIcon icon="fluent:edit-24-regular" className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-peach/10 text-peach px-3 py-1.5 text-xs font-semibold transition hover:bg-peach hover:text-white disabled:opacity-50"
                          onClick={() => setPendingDeleteId(row.id)}>
                          <IconifyIcon icon="fluent:delete-24-regular" className="h-3.5 w-3.5" />
                          {deletingId === row.id ? "..." : "Del"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="btn-secondary px-3 py-1 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Prev
            </button>
            <p className="text-xs font-medium text-slate-500">
              Page {page} of {Math.max(1, Math.ceil(rows.length / pageSize))}
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
    </section>
  );
}
