"use client";

import type { ImportTransactionInput } from "@/lib/db/repositories/transactions";
import type { ExpenseCategory } from "@/lib/types";

interface LegacyDayItem {
  description?: string;
  amount?: number;
}

interface LegacyDay {
  date?: string;
  total?: number;
  items?: LegacyDayItem[];
}

interface LegacyWeekLog {
  week?: number;
  days?: LegacyDay[];
}

interface LegacyEntry {
  date?: string;
  description?: string;
  amount?: number;
}

interface LegacySampleShape {
  weekly_logs?: LegacyWeekLog[];
  needs_monthly?: LegacyEntry[];
  wants_monthly?: LegacyEntry[];
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const toValidDate = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return value;
};

const toAmount = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const amount = Math.floor(value);
  return amount;
};

const addRow = (
  rows: ImportTransactionInput[],
  category: ExpenseCategory,
  date: unknown,
  amount: unknown,
  description: unknown,
  entryType: ImportTransactionInput["entryType"],
) => {
  const parsedDate = toValidDate(date);
  const parsedAmount = toAmount(amount);
  if (!parsedDate || parsedAmount === null) {
    return;
  }

  rows.push({
    category,
    date: parsedDate,
    amount: parsedAmount,
    description: typeof description === "string" && description.trim() ? description.trim() : "Imported Entry",
    entryType,
  });
};

function parseLegacyMonthlyEntries(source: unknown, category: ExpenseCategory, rows: ImportTransactionInput[]) {
  if (!Array.isArray(source)) {
    return;
  }

  for (const entry of source) {
    if (!isObject(entry)) {
      continue;
    }
    addRow(rows, category, entry.date, entry.amount, entry.description, "manual");
  }
}

function parseLegacyWeeklyLogs(source: unknown, rows: ImportTransactionInput[]) {
  if (!Array.isArray(source)) {
    return;
  }

  for (const weekLog of source) {
    if (!isObject(weekLog) || !Array.isArray(weekLog.days)) {
      continue;
    }

    for (const day of weekLog.days) {
      if (!isObject(day)) {
        continue;
      }

      if (Array.isArray(day.items) && day.items.length > 0) {
        for (const item of day.items) {
          if (!isObject(item)) {
            continue;
          }
          addRow(rows, "daily_spending", day.date, item.amount, item.description, "itemized");
        }
        continue;
      }

      addRow(rows, "daily_spending", day.date, day.total, "Imported Daily Total", "daily_total");
    }
  }
}

function parseAppExportTransactions(source: unknown): ImportTransactionInput[] {
  if (!isObject(source)) {
    return [];
  }

  const data = isObject(source.data) ? source.data : null;
  const transactions = data && Array.isArray(data.transactions) ? data.transactions : null;

  if (!transactions) {
    return [];
  }

  const rows: ImportTransactionInput[] = [];
  for (const transaction of transactions) {
    if (!isObject(transaction)) {
      continue;
    }

    const category = transaction.category;
    if (category !== "daily_spending" && category !== "monthly_needs" && category !== "monthly_wants") {
      continue;
    }

    addRow(
      rows,
      category,
      transaction.localDate ?? transaction.date,
      transaction.amount,
      transaction.description,
      transaction.entryType === "itemized" || transaction.entryType === "daily_total" ? transaction.entryType : "manual",
    );
  }

  return rows;
}

function parseLegacySample(source: unknown): ImportTransactionInput[] {
  if (!isObject(source)) {
    return [];
  }

  const rows: ImportTransactionInput[] = [];
  const legacy = source as LegacySampleShape;

  parseLegacyWeeklyLogs(legacy.weekly_logs, rows);
  parseLegacyMonthlyEntries(legacy.needs_monthly, "monthly_needs", rows);
  parseLegacyMonthlyEntries(legacy.wants_monthly, "monthly_wants", rows);

  return rows;
}

function parseLegacySampleCollection(source: unknown): ImportTransactionInput[] {
  if (!Array.isArray(source)) {
    return parseLegacySample(source);
  }

  const rows: ImportTransactionInput[] = [];
  for (const item of source) {
    rows.push(...parseLegacySample(item));
  }

  return rows;
}

export function parseImportJson(content: string): ImportTransactionInput[] {
  const parsed = JSON.parse(content) as unknown;

  const appRows = parseAppExportTransactions(parsed);
  if (appRows.length > 0) {
    return appRows;
  }

  return parseLegacySampleCollection(parsed);
}
