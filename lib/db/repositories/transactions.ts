"use client";

import Dexie from "dexie";
import { db } from "@/lib/db/dexie";
import type { ComparisonResult, DashboardTotals, ExpenseCategory, PeriodRollup, Transaction, TrendPoint } from "@/lib/types";
import { getIsoWeekKey, getIsoWeekParts, getYearMonth, nowISO, toLocalDateString } from "@/lib/time/timezone";

const CATEGORIES: ExpenseCategory[] = ["daily_spending", "monthly_needs", "monthly_wants"];

export interface CreateTransactionInput {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date?: string;
}

export interface ImportTransactionInput {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  entryType?: Transaction["entryType"];
}

export interface UpdateTransactionInput {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
  date?: string;
}

const newId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const buildPeriodKey = (periodType: "week" | "month", transaction: Transaction): string => {
  if (periodType === "month") {
    return transaction.yearMonth;
  }
  return getIsoWeekKey(transaction.isoYear, transaction.isoWeek);
};

async function upsertRollups(transaction: Transaction): Promise<void> {
  await applyRollupDelta(transaction, transaction.amount, 1);
}

async function applyRollupDelta(transaction: Transaction, amountDelta: number, countDelta: number): Promise<void> {
  const dailyKey = `${transaction.localDate}|${transaction.category}`;
  const currentDaily = await db.dailyRollups.get(dailyKey);
  const nextDailyTotal = (currentDaily?.total ?? 0) + amountDelta;
  const nextDailyCount = (currentDaily?.transactionCount ?? 0) + countDelta;

  if (nextDailyCount <= 0) {
    await db.dailyRollups.delete(dailyKey);
  } else {
    await db.dailyRollups.put({
      key: dailyKey,
      localDate: transaction.localDate,
      category: transaction.category,
      total: nextDailyTotal,
      transactionCount: nextDailyCount,
      updatedAt: nowISO(),
    });
  }

  for (const periodType of ["week", "month"] as const) {
    const periodKey = buildPeriodKey(periodType, transaction);
    const rollupId = `${periodType}|${periodKey}|${transaction.category}`;
    const currentPeriod = await db.periodRollups.get(rollupId);
    const nextPeriodTotal = (currentPeriod?.total ?? 0) + amountDelta;
    const nextPeriodCount = (currentPeriod?.transactionCount ?? 0) + countDelta;

    if (nextPeriodCount <= 0) {
      await db.periodRollups.delete(rollupId);
    } else {
      await db.periodRollups.put({
        key: rollupId,
        periodType,
        periodKey,
        category: transaction.category,
        total: nextPeriodTotal,
        transactionCount: nextPeriodCount,
        updatedAt: nowISO(),
      });
    }
  }
}

async function rebuildRollups(): Promise<void> {
  await db.dailyRollups.clear();
  await db.periodRollups.clear();

  const rows = await db.transactions.toArray();
  for (const row of rows) {
    await upsertRollups(row);
  }
}

function normalizeTransaction(input: {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date?: string;
  entryType: Transaction["entryType"];
}): Transaction {
  const baseDate = input.date ? new Date(`${input.date}T12:00:00`) : new Date();
  const dateUTC = baseDate.toISOString();
  const localDate = toLocalDateString(baseDate);
  const { isoYear, isoWeek } = getIsoWeekParts(localDate);
  const now = nowISO();

  return {
    id: newId(),
    category: input.category,
    amount: Math.floor(input.amount),
    description: input.description.trim() || "Untitled",
    dateUTC,
    localDate,
    yearMonth: getYearMonth(localDate),
    isoYear,
    isoWeek,
    entryType: input.entryType,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const transaction = normalizeTransaction({ ...input, entryType: "manual" });

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    await db.transactions.add(transaction);
    await upsertRollups(transaction);
  });

  return transaction;
}

export async function importTransactions(rows: ImportTransactionInput[]): Promise<{ imported: number }> {
  if (rows.length === 0) {
    return { imported: 0 };
  }

  const normalizedRows = rows.map((row) =>
    normalizeTransaction({
      ...row,
      entryType: row.entryType ?? "manual",
    }),
  );

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    for (const row of normalizedRows) {
      await db.transactions.add(row);
      await upsertRollups(row);
    }
  });

  return { imported: normalizedRows.length };
}

export async function replaceTransactions(rows: ImportTransactionInput[]): Promise<{ imported: number }> {
  if (rows.length === 0) {
    return { imported: 0 };
  }

  const normalizedRows = rows.map((row) =>
    normalizeTransaction({
      ...row,
      entryType: row.entryType ?? "manual",
    }),
  );

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    await db.transactions.clear();
    await db.dailyRollups.clear();
    await db.periodRollups.clear();

    for (const row of normalizedRows) {
      await db.transactions.add(row);
      await upsertRollups(row);
    }
  });

  return { imported: normalizedRows.length };
}

export async function replaceTransactionsForMonth(yearMonth: string, rows: ImportTransactionInput[]): Promise<{ imported: number }> {
  const scopedRows = rows.filter((row) => row.date.slice(0, 7) === yearMonth);

  if (scopedRows.length === 0) {
    await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
      const existing = await db.transactions.where("yearMonth").equals(yearMonth).toArray();
      for (const row of existing) {
        await db.transactions.delete(row.id);
      }
      await rebuildRollups();
    });

    return { imported: 0 };
  }

  const normalizedRows = scopedRows.map((row) =>
    normalizeTransaction({
      ...row,
      entryType: row.entryType ?? "manual",
    }),
  );

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    const existing = await db.transactions.where("yearMonth").equals(yearMonth).toArray();
    for (const row of existing) {
      await db.transactions.delete(row.id);
    }

    for (const row of normalizedRows) {
      await db.transactions.add(row);
    }

    await rebuildRollups();
  });

  return { imported: normalizedRows.length };
}

export async function getTransactionsByCategory(category: ExpenseCategory, limit = 20): Promise<Transaction[]> {
  const rows = await db.transactions.where("category").equals(category).toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function searchTransactionsByCategory(category: ExpenseCategory, query: string, limit = 50): Promise<Transaction[]> {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return getTransactionsByCategory(category, limit);
  }

  const queryDigits = keyword.replace(/\D/g, "");
  const rows = await db.transactions.where("category").equals(category).toArray();

  const filtered = rows.filter((row) => {
    const descriptionMatch = row.description.toLowerCase().includes(keyword);
    if (descriptionMatch) {
      return true;
    }

    const amountText = String(row.amount);
    const amountDigits = amountText.replace(/\D/g, "");
    if (amountText.includes(keyword)) {
      return true;
    }

    if (!queryDigits) {
      return false;
    }

    return amountDigits.includes(queryDigits);
  });

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function updateTransactionById(id: string, input: UpdateTransactionInput): Promise<Transaction> {
  const existing = await db.transactions.get(id);
  if (!existing) {
    throw new Error("Transaction not found");
  }

  const amount = input.amount === undefined ? existing.amount : Math.max(0, Math.floor(input.amount));
  const description = input.description === undefined ? existing.description : input.description.trim() || "Untitled";
  const category = input.category ?? existing.category;
  const localDate = input.date ?? existing.localDate;
  const baseDate = new Date(`${localDate}T12:00:00`);
  const { isoYear, isoWeek } = getIsoWeekParts(localDate);

  const updated: Transaction = {
    ...existing,
    category,
    amount,
    description,
    localDate,
    yearMonth: getYearMonth(localDate),
    isoYear,
    isoWeek,
    dateUTC: baseDate.toISOString(),
    updatedAt: nowISO(),
  };

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    await db.transactions.put(updated);
    await rebuildRollups();
  });

  return updated;
}

export async function deleteTransactionById(id: string): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) {
    return;
  }

  await db.transaction("rw", db.transactions, db.dailyRollups, db.periodRollups, async () => {
    await db.transactions.delete(id);
    await applyRollupDelta(existing, -existing.amount, -1);
  });
}

export async function getDashboardTotals(): Promise<DashboardTotals> {
  const totals: DashboardTotals = {
    grandTotal: 0,
    byCategory: {
      daily_spending: 0,
      monthly_needs: 0,
      monthly_wants: 0,
    },
  };

  const all = await db.transactions.toArray();
  for (const item of all) {
    totals.grandTotal += item.amount;
    totals.byCategory[item.category] += item.amount;
  }

  return totals;
}

const calculateComparison = async (periodType: "week" | "month", currentKey: string, previousKey: string): Promise<ComparisonResult> => {
  const records = await db.periodRollups
    .where("[periodType+periodKey+category]")
    .between([periodType, currentKey, Dexie.minKey as never], [periodType, currentKey, Dexie.maxKey as never])
    .toArray();

  const prevRecords = await db.periodRollups
    .where("[periodType+periodKey+category]")
    .between([periodType, previousKey, Dexie.minKey as never], [periodType, previousKey, Dexie.maxKey as never])
    .toArray();

  const current = records.reduce((sum, row) => sum + row.total, 0);
  const previous = prevRecords.reduce((sum, row) => sum + row.total, 0);

  return {
    current,
    previous,
    delta: current - previous,
  };
};

const getPreviousWeekKey = (isoYear: number, isoWeek: number): string => {
  if (isoWeek > 1) {
    return getIsoWeekKey(isoYear, isoWeek - 1);
  }
  return getIsoWeekKey(isoYear - 1, 52);
};

const getPreviousMonthKey = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-").map(Number);
  const previous = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  return previous;
};

export async function getComparisons(referenceDate = new Date()): Promise<{ week: ComparisonResult; month: ComparisonResult }> {
  const localDate = toLocalDateString(referenceDate);
  const { isoYear, isoWeek } = getIsoWeekParts(localDate);
  const currentWeek = getIsoWeekKey(isoYear, isoWeek);
  const previousWeek = getPreviousWeekKey(isoYear, isoWeek);
  const yearMonth = getYearMonth(localDate);
  const previousMonth = getPreviousMonthKey(yearMonth);

  return {
    week: await calculateComparison("week", currentWeek, previousWeek),
    month: await calculateComparison("month", yearMonth, previousMonth),
  };
}

export async function getMonthlyCategorySeries(limit = 6): Promise<Array<{ month: string } & Record<ExpenseCategory, number>>> {
  const rows = await db.periodRollups.where("periodType").equals("month").toArray();
  const map = new Map<string, { month: string } & Record<ExpenseCategory, number>>();

  for (const row of rows) {
    if (!map.has(row.periodKey)) {
      map.set(row.periodKey, {
        month: row.periodKey,
        daily_spending: 0,
        monthly_needs: 0,
        monthly_wants: 0,
      });
    }
    map.get(row.periodKey)![row.category] = row.total;
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-limit);
}

export async function getTrendByCategory(category: ExpenseCategory, limit = 14): Promise<TrendPoint[]> {
  const rows = await db.dailyRollups.where("category").equals(category).toArray();

  return rows
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .slice(-limit)
    .map((row) => ({ label: row.localDate.slice(5), total: row.total }));
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  const rows = await db.transactions.orderBy("createdAt").reverse().limit(limit).toArray();
  return rows;
}

export async function getDailySpendingByDate(localDate: string): Promise<{ date: string; total: number; entries: Transaction[] }> {
  const rows = await db.transactions.where("[category+localDate]").equals(["daily_spending", localDate]).toArray();

  const entries = rows.filter((row) => row.amount !== 0).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = entries.reduce((sum, item) => sum + item.amount, 0);

  return {
    date: localDate,
    total,
    entries,
  };
}

export async function getAvailableYearMonths(): Promise<string[]> {
  const rows = await db.transactions.toArray();
  const unique = new Set(rows.map((row) => row.yearMonth));
  return [...unique].sort((a, b) => b.localeCompare(a));
}

export async function getSpendingByYearMonth(yearMonth: string): Promise<{ yearMonth: string; total: number; entries: Transaction[] }> {
  const rows = await db.transactions.toArray();
  const entries = rows
    .filter((row) => row.yearMonth === yearMonth && row.amount !== 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = entries.reduce((sum, item) => sum + item.amount, 0);

  return {
    yearMonth,
    total,
    entries,
  };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.toArray();
}

export async function getPeriodRollups(): Promise<PeriodRollup[]> {
  return db.periodRollups.toArray();
}

export async function getDailyTotalsByCategory(): Promise<Array<{ name: string; value: number }>> {
  const totals = await getDashboardTotals();
  return CATEGORIES.map((category) => ({
    name: category,
    value: totals.byCategory[category],
  }));
}

export async function getTransactionDateBounds(): Promise<{ from: string; to: string } | null> {
  const rows = await db.transactions.toArray();
  const validDates = rows.map((row) => row.localDate).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));

  if (validDates.length === 0) {
    return null;
  }

  const sorted = validDates.sort((a, b) => a.localeCompare(b));
  return {
    from: sorted[0] ?? "",
    to: sorted[sorted.length - 1] ?? "",
  };
}

export async function getAnalyticsByDateRange(
  fromDate: string,
  toDate: string,
): Promise<{
  monthlySeries: Array<{ month: string } & Record<ExpenseCategory, number>>;
  categoryPie: Array<{ name: string; value: number }>;
  trend: Array<{ label: string; total: number }>;
  trendNeeds: Array<{ label: string; total: number }>;
  trendWants: Array<{ label: string; total: number }>;
}> {
  const rows = await db.transactions.toArray();
  const filtered = rows.filter((row) => row.amount !== 0 && row.localDate >= fromDate && row.localDate <= toDate);

  const monthMap = new Map<string, { month: string } & Record<ExpenseCategory, number>>();
  for (const row of filtered) {
    if (!monthMap.has(row.yearMonth)) {
      monthMap.set(row.yearMonth, {
        month: row.yearMonth,
        daily_spending: 0,
        monthly_needs: 0,
        monthly_wants: 0,
      });
    }
    monthMap.get(row.yearMonth)![row.category] += row.amount;
  }

  const totalsByCategory: Record<ExpenseCategory, number> = {
    daily_spending: 0,
    monthly_needs: 0,
    monthly_wants: 0,
  };

  for (const row of filtered) {
    totalsByCategory[row.category] += row.amount;
  }

  const trendMapDaily = new Map<string, number>();
  const trendMapNeeds = new Map<string, number>();
  const trendMapWants = new Map<string, number>();
  
  for (const row of filtered) {
    if (row.category === "daily_spending") {
      trendMapDaily.set(row.localDate, (trendMapDaily.get(row.localDate) ?? 0) + row.amount);
    } else if (row.category === "monthly_needs") {
      trendMapNeeds.set(row.localDate, (trendMapNeeds.get(row.localDate) ?? 0) + row.amount);
    } else if (row.category === "monthly_wants") {
      trendMapWants.set(row.localDate, (trendMapWants.get(row.localDate) ?? 0) + row.amount);
    }
  }

  return {
    monthlySeries: [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    categoryPie: CATEGORIES.map((category) => ({ name: category, value: totalsByCategory[category] })),
    trend: [...trendMapDaily.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ label: date.slice(5), total })),
    trendNeeds: [...trendMapNeeds.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ label: date.slice(5), total })),
    trendWants: [...trendMapWants.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ label: date.slice(5), total })),
  };
}
