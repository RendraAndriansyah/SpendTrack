"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportDatabaseJson, triggerJsonDownload } from "@/lib/export/export-json";
import { parseImportJson } from "@/lib/import/import-json";
import { importTransactions, replaceTransactions } from "@/lib/db/repositories/transactions";

export default function DataSettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [replaceExisting, setReplaceExisting] = useState(true);

  const handleExport = async () => {
    setExporting(true);
    try {
      const content = await exportDatabaseJson();
      const stamp = new Date().toISOString().slice(0, 10);
      triggerJsonDownload(`spendtrack-export-${stamp}.json`, content);
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

      const result = replaceExisting ? await replaceTransactions(rows) : await importTransactions(rows);
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
        <p className="text-sm text-slate-500">Includes transactions, rollups, app settings, and metadata.</p>
        <button className="btn" disabled={exporting} onClick={handleExport}>
          {exporting ? "Preparing..." : "Export .json"}
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Import</h2>
        <p className="text-sm text-slate-500">Import historical monthly spending from JSON into IndexedDB.</p>
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
