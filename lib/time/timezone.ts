const ISO_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const detectUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

export const toLocalDateString = (input: Date | string): string => {
  const date = typeof input === "string" ? new Date(input) : input;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYearMonth = (localDate: string): string => localDate.slice(0, 7);

export const getIsoWeekParts = (input: Date | string): { isoYear: number; isoWeek: number } => {
  const date = typeof input === "string" ? new Date(`${input}T00:00:00`) : new Date(input);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / ISO_WEEK_MS + 1) / 1);
  return { isoYear, isoWeek };
};

export const getIsoWeekKey = (isoYear: number, isoWeek: number): string => `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;

export const nowISO = (): string => new Date().toISOString();
