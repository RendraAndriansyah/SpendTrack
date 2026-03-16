import { useCallback, useEffect, useState } from "react";
import {
  deleteTransactionById,
  getDailySpendingByDate,
  getTransactionsByCategory,
  searchTransactionsByCategory,
  updateTransactionById,
  type UpdateTransactionInput
} from "@/lib/db/repositories/transactions";
import type { ExpenseCategory, Transaction } from "@/lib/types";
import { toast } from "sonner";

export function useTransactions(initialCategory: ExpenseCategory, initialDate: string) {
  const [manageCategory, setManageCategory] = useState<ExpenseCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dailyEntries, setDailyEntries] = useState<Transaction[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);

  const refreshRows = useCallback(async () => {
    setLoadingRows(true);
    const keyword = searchQuery.trim();
    const result = keyword
      ? await searchTransactionsByCategory(manageCategory, keyword, 200)
      : await getTransactionsByCategory(manageCategory, 200);
    setRows(result);
    setLoadingRows(false);
  }, [manageCategory, searchQuery]);

  const refreshDaily = useCallback(async () => {
    const daily = await getDailySpendingByDate(selectedDate);
    setDailyEntries(daily.entries);
    setDailyTotal(daily.total);
  }, [selectedDate]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshRows(), refreshDaily()]);
  }, [refreshRows, refreshDaily]);

  useEffect(() => {
    refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    refreshDaily();
  }, [refreshDaily]);

  const handleUpdate = async (id: string, updateData: UpdateTransactionInput) => {
    // Optimistic update for instant UI feedback
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              amount: updateData.amount ?? row.amount,
              description: updateData.description ?? row.description,
              localDate: updateData.date ?? row.localDate,
              category: updateData.category ?? row.category,
            }
          : row,
      ),
    );

    try {
      await updateTransactionById(id, updateData);
      toast.success("Entry updated.");
      // Background refresh to sync true state (non-blocking)
      refreshAll();
      return true;
    } catch {
      toast.error("Failed to update entry.");
      // Revert optimistic update on failure
      await refreshAll();
      return false;
    }
  };

  const handleDelete = async (id: string, transaction: Transaction | undefined) => {
    // Optimistic update for UI feel
    setRows((current) => current.filter((row) => row.id !== id));
    if (transaction && transaction.category === "daily_spending" && transaction.localDate === selectedDate) {
      setDailyEntries((current) => current.filter((entry) => entry.id !== id));
      setDailyTotal((current) => current - transaction.amount);
    }

    try {
      await deleteTransactionById(id);
      toast.success("Entry deleted.");
      await refreshAll();
      return true;
    } catch {
      toast.error("Failed to delete entry.");
      await refreshAll();
      return false;
    }
  };

  return {
    manageCategory,
    setManageCategory,
    searchQuery,
    setSearchQuery,
    rows,
    loadingRows,
    selectedDate,
    setSelectedDate,
    dailyEntries,
    dailyTotal,
    refreshAll,
    handleUpdate,
    handleDelete
  };
}
