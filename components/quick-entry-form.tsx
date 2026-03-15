"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon as IconifyIcon } from "@iconify/react";
import { toast } from "sonner";
import type { ExpenseCategory } from "@/lib/types";
import { createTransaction } from "@/lib/db/repositories/transactions";
import { toLocalDateString } from "@/lib/time/timezone";

interface QuickEntryFormProps {
  category: ExpenseCategory;
  title: string;
  onCreated?: () => Promise<void> | void;
}

export function QuickEntryForm({ category, title, onCreated }: QuickEntryFormProps) {
  const today = toLocalDateString(new Date());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const formatAmountInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      return "";
    }

    return Number(digitsOnly).toLocaleString("en-US");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than 0.");
      setMessage("");
      return;
    }

    if (!description.trim()) {
      setError("Please add a short description.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createTransaction({
        category,
        amount: parsed,
        description,
        date: date || undefined,
      });
      setAmount("");
      setDescription("");
      setDate(today);
      await onCreated?.();
      setMessage("Saved successfully.");
      toast.success("Entry saved.");
    } catch {
      setError("Failed to save. Please try again.");
      toast.error("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      className="card space-y-3"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}>
      <h2 className="text-base font-semibold">{title}</h2>
      <motion.label className="block text-sm">
        Description
        <input
          className="input mt-1"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What did you spend on?"
          maxLength={80}
          required
        />
      </motion.label>
      <motion.label className="block text-sm">
        Amount
        <input
          className="input mt-1"
          type="text"
          inputMode="numeric"
          pattern="[0-9,]*"
          value={amount}
          onChange={(event) => setAmount(formatAmountInput(event.target.value))}
          placeholder="e.g. 25,000"
          required
        />
      </motion.label>
      <motion.label className="block text-sm">
        Date
        <input className="input mt-1" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </motion.label>
      <motion.button disabled={saving} className="btn w-full" type="submit" whileTap={{ scale: 0.98 }}>
        <span className="inline-flex items-center justify-center gap-2">
          {saving ? <IconifyIcon icon="fluent-color:arrow-sync-circle-24" className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save entry"}
        </span>
      </motion.button>
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            className="inline-flex items-center gap-1 text-sm text-rose-500"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}>
            <IconifyIcon icon="fluent-color:error-circle-24" className="h-4 w-4" />
            {error}
          </motion.p>
        ) : null}
        {message ? (
          <motion.p
            key="success"
            className="inline-flex items-center gap-1 text-sm text-emerald-600"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}>
            <IconifyIcon icon="fluent-color:checkmark-circle-24" className="h-4 w-4" />
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.form>
  );
}
