"use client";

import { db } from "@/lib/db/dexie";
import { detectUserTimezone } from "@/lib/time/timezone";

export async function exportDatabaseJson(): Promise<string> {
  const [transactions, dailyRollups, periodRollups, settings, meta] = await Promise.all([
    db.transactions.toArray(),
    db.dailyRollups.toArray(),
    db.periodRollups.toArray(),
    db.settings.toArray(),
    db.meta.toArray(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    timezone: detectUserTimezone(),
    schemaVersion: 1,
    data: {
      transactions,
      dailyRollups,
      periodRollups,
      settings,
      meta,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export async function exportMonthlyJson(yearMonth: string): Promise<string> {
  const [transactions, settings, meta] = await Promise.all([
    db.transactions.where("yearMonth").equals(yearMonth).toArray(),
    db.settings.toArray(),
    db.meta.toArray(),
  ]);

  const dailyRollups = (await db.dailyRollups.toArray()).filter((row) => row.localDate.startsWith(`${yearMonth}-`));
  const periodRollups = (await db.periodRollups.toArray()).filter((row) => row.periodType === "month" && row.periodKey === yearMonth);

  const payload = {
    exportedAt: new Date().toISOString(),
    timezone: detectUserTimezone(),
    schemaVersion: 1,
    scope: "monthly",
    yearMonth,
    data: {
      transactions,
      dailyRollups,
      periodRollups,
      settings,
      meta,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function triggerJsonDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
