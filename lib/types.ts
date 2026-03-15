export type ExpenseCategory = "daily_spending" | "monthly_needs" | "monthly_wants";

export type PeriodType = "week" | "month";

export type EntryType = "itemized" | "daily_total" | "manual";

export interface Transaction {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  dateUTC: string;
  localDate: string;
  yearMonth: string;
  isoYear: number;
  isoWeek: number;
  entryType: EntryType;
  createdAt: string;
  updatedAt: string;
}

export interface DailyRollup {
  key: string;
  localDate: string;
  category: ExpenseCategory;
  total: number;
  transactionCount: number;
  updatedAt: string;
}

export interface PeriodRollup {
  key: string;
  periodType: PeriodType;
  periodKey: string;
  category: ExpenseCategory;
  total: number;
  transactionCount: number;
  updatedAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface DashboardTotals {
  grandTotal: number;
  byCategory: Record<ExpenseCategory, number>;
}

export interface ComparisonResult {
  current: number;
  previous: number;
  delta: number;
}

export interface TrendPoint {
  label: string;
  total: number;
}
