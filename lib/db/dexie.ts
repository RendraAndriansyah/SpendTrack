"use client";

import Dexie, { type Table } from "dexie";
import type { AppSetting, DailyRollup, PeriodRollup, Transaction } from "@/lib/types";

class SpendTrackDB extends Dexie {
  transactions!: Table<Transaction, string>;
  dailyRollups!: Table<DailyRollup, string>;
  periodRollups!: Table<PeriodRollup, string>;
  settings!: Table<AppSetting, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("spendtrack-db");

    this.version(1).stores({
      transactions:
        "id, dateUTC, localDate, category, [category+localDate], [yearMonth+category], [isoYear+isoWeek+category], createdAt, updatedAt",
      dailyRollups: "key, localDate, category, [localDate+category], updatedAt",
      periodRollups: "key, periodType, periodKey, category, [periodType+periodKey+category], updatedAt",
      settings: "key",
      meta: "key",
    });
  }
}

export const db = new SpendTrackDB();
