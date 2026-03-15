"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportDatabaseJson, exportMonthlyJson, triggerJsonDownload } from "@/lib/export/export-json";
import { parseImportJson } from "@/lib/import/import-json";
import {
  getAvailableYearMonths,
  importTransactions,
  replaceTransactions,
  replaceTransactionsForMonth,
} from "@/lib/db/repositories/transactions";

export default function DataSettingsPage() {
  const [scope, setScope] = useState<"bulk" | "monthly">("bulk");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [replaceExisting, setReplaceExisting] = useState(true);

  const ensureMonthsLoaded = async () => {
    if (months.length > 0) {
      return months;
    }
    const loaded = await getAvailableYearMonths();
    setMonths(loaded);
    if (!selectedMonth && loaded[0]) {
      setSelectedMonth(loaded[0]);
    }
    return loaded;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let content = "";
      const stamp = new Date().toISOString().slice(0, 10);
      if (scope === "monthly") {
        const loaded = await ensureMonthsLoaded();
        const month = selectedMonth || loaded[0];
        if (!month) {
          toast.error("No month data available for monthly export.");
          return;
        }
        content = await exportMonthlyJson(month);
        triggerJsonDownload(`spendtrack-export-${month}-${stamp}.json`, content);
      } else {
        content = await exportDatabaseJson();
        triggerJsonDownload(`spendtrack-export-${stamp}.json`, content);
      }
      toast.success("Data exported.");
    } catch {
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage("Please select a JSON file first.");
      toast.error("Please select a JSON file first.");
      return;
    }

    setImporting(true);
    setMessage("");
    try {
      const content = await file.text();
      const rows = parseImportJson(content);

      if (rows.length === 0) {
        setMessage("No valid spending rows were found in this file.");
        toast.error("No valid spending rows found.");
        return;
      }

      let result: { imported: number };
      if (scope === "monthly") {
        const monthInRows = [...new Set(rows.map((row) => row.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
        const month = selectedMonth || monthInRows[0];
        if (!month) {
          setMessage("No month detected in file.");
          toast.error("No month detected in file.");
          return;
        }

        const scopedRows = rows.filter((row) => row.date.slice(0, 7) === month);
        result = replaceExisting ? await replaceTransactionsForMonth(month, scopedRows) : await importTransactions(scopedRows);
      } else {
        result = replaceExisting ? await replaceTransactions(rows) : await importTransactions(rows);
      }

      setMessage(
        replaceExisting
          ? `Replaced existing data and imported ${result.imported} transactions successfully.`
          : `Imported ${result.imported} transactions successfully.`,
      );
      toast.success(replaceExisting ? `Data replaced: ${result.imported} imported.` : `Imported ${result.imported} transactions.`);
      setFile(null);
    } catch {
      setMessage("Import failed. Please use a valid JSON export or legacy monthly format.");
      toast.error("Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="card">
        <h1 className="text-xl font-bold">Data Portability</h1>
        <p className="text-sm text-slate-500">Export all IndexedDB data as JSON.</p>
      </header>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Export</h2>
        <p className="text-sm text-slate-500">Choose bulk export (all data) or monthly export.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${scope === "bulk" ? "bg-accent text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={() => setScope("bulk")}>
            Bulk
          </button>
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${scope === "monthly" ? "bg-accent text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={async () => {
              setScope("monthly");
              await ensureMonthsLoaded();
            }}>
            Monthly
          </button>
        </div>
        {scope === "monthly" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">Month</span>
            <select className="input" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button className="btn" disabled={exporting} onClick={handleExport}>
          {exporting ? "Preparing..." : "Export .json"}
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Import</h2>
        <p className="text-sm text-slate-500">Import as bulk (all months) or monthly (single month only).</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${scope === "bulk" ? "bg-accent text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={() => setScope("bulk")}>
            Bulk
          </button>
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${scope === "monthly" ? "bg-accent text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={async () => {
              setScope("monthly");
              await ensureMonthsLoaded();
            }}>
            Monthly
          </button>
        </div>
        {scope === "monthly" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">Month</span>
            <select className="input" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <input
          className="input"
          type="file"
          accept="application/json,.json"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={replaceExisting} onChange={(event) => setReplaceExisting(event.target.checked)} />
          Replace existing data before import
        </label>
        <button className="btn-secondary" disabled={importing || !file} onClick={handleImport}>
          {importing ? "Importing..." : "Import .json"}
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </section>
    </div>
  );
}
