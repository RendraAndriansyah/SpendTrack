"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon as IconifyIcon } from "@iconify/react";
import { QuickEntryForm } from "@/components/quick-entry-form";
import { ManageEntries } from "@/components/manage-entries";
import { DailySpending } from "@/components/daily-spending";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { toLocalDateString } from "@/lib/time/timezone";
import type { ExpenseCategory } from "@/lib/types";

const options: Array<{ category: ExpenseCategory; label: string; icon: string; subtitle: string }> = [
  {
    category: "daily_spending",
    label: "Daily Spending",
    icon: "fluent:wallet-credit-card-24-filled",
    subtitle: "Food, transport, small daily costs",
  },
  {
    category: "monthly_wants",
    label: "Monthly Wants",
    icon: "fluent:sparkle-24-filled",
    subtitle: "Lifestyle and non-essential spending",
  },
  {
    category: "monthly_needs",
    label: "Monthly Needs",
    icon: "fluent:home-24-filled",
    subtitle: "Bills, obligations, and essentials",
  },
];

export default function LandingInputPage() {
  const today = toLocalDateString(new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const active = options[activeIndex] ?? options[0];
  const totalCards = options.length;

  const {
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
  } = useTransactions(active.category, today);

  const goPrev = () => {
    setDirection(-1);
    setActiveIndex((current) => (current - 1 + totalCards) % totalCards);
  };

  const goNext = () => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % totalCards);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;

    if (Math.abs(delta) < 40) {
      setTouchStartX(null);
      return;
    }

    if (delta > 0) goPrev();
    else goNext();
    
    setTouchStartX(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="card p-5 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-sm ring-1 ring-slate-100">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconifyIcon icon="fluent:wallet-credit-card-24-filled" className="h-6 w-6" />
          </div>
          Quick Input
        </h1>
        <p className="mt-2 text-sm text-slate-500">Choose a spending type by sliding cards, then add your entry.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/dashboard" className="btn-secondary group inline-flex w-full items-center justify-center text-sm py-2.5">
            <span className="inline-flex items-center gap-2">
              <IconifyIcon icon="fluent:data-bar-vertical-24-filled" className="h-4 w-4 transition-transform group-hover:scale-110" />
              Open Dashboard
            </span>
          </Link>
          <Link href="/analytics" className="btn-secondary group inline-flex w-full items-center justify-center text-sm py-2.5">
            <span className="inline-flex items-center gap-2">
              <IconifyIcon icon="fluent:data-line-24-filled" className="h-4 w-4 transition-transform group-hover:scale-110" />
              View Analytics
            </span>
          </Link>
        </div>
      </header>

      <section className="card p-5 md:p-6 shadow-sm border-0 ring-1 ring-slate-100">
        <div className="flex items-center gap-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-slate-300 active:scale-95"
            onClick={goPrev}
            aria-label="Previous category">
            <IconifyIcon icon="fluent:chevron-left-24-regular" className="h-6 w-6 text-slate-700" />
          </button>
          <div className="relative flex-1 overflow-hidden h-24 rounded-2xl">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active.category}
                className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-accent/20 bg-accent/5 p-4 md:p-5"
                initial={{ opacity: 0, x: 50 * direction, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50 * direction, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}>
                <p className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <IconifyIcon icon={active.icon} className="h-5 w-5 drop-shadow-sm" />
                  {active.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">{active.subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-slate-300 active:scale-95"
            onClick={goNext}
            aria-label="Next category">
            <IconifyIcon icon="fluent:chevron-right-24-regular" className="h-6 w-6 text-slate-700" />
          </button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 md:hidden">
          <IconifyIcon icon="fluent:hand-draw-24-regular" className="h-4 w-4" />
          Swipe left/right to change category
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {options.map((item, index) => (
            <button
              key={item.category}
              type="button"
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1);
                setActiveIndex(index);
              }}
              aria-label={`Go to ${item.label}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-6 bg-accent" : "w-2.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>
      </section>

      <div className="py-2">
        <QuickEntryForm key={active.category} category={active.category} title={`Add ${active.label}`} onCreated={refreshAll} />
      </div>

      <DailySpending
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        dailyTotal={dailyTotal}
        dailyEntries={dailyEntries}
      />

      <ManageEntries
        options={options}
        manageCategory={manageCategory}
        setManageCategory={setManageCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        rows={rows}
        loadingRows={loadingRows}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
