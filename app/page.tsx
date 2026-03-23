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

const options: Array<{ 
  category: ExpenseCategory; 
  label: string; 
  icon: string; 
  subtitle: string;
  theme: {
    text: string;
    bg: string;
    border: string;
    accent: string;
    ring: string;
    hoverBg: string;
    iconBg: string;
    iconColor: string;
  }
}> = [
  {
    category: "daily_spending",
    label: "Daily Spending",
    icon: "fluent:wallet-credit-card-24-filled",
    subtitle: "Food, transport, small daily costs",
    theme: {
      text: "text-indigo-700",
      bg: "bg-indigo-50/50",
      border: "border-indigo-100",
      accent: "!bg-indigo-600",
      ring: "ring-indigo-600/10",
      hoverBg: "!hover:bg-indigo-700",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    }
  },
  {
    category: "monthly_needs",
    label: "Monthly Needs",
    icon: "fluent:home-24-filled",
    subtitle: "Bills, obligations, and essentials",
    theme: {
      text: "text-emerald-700",
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      accent: "!bg-emerald-600",
      ring: "ring-emerald-600/10",
      hoverBg: "!hover:bg-emerald-700",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    }
  },
  {
    category: "monthly_wants",
    label: "Monthly Wants",
    icon: "fluent:sparkle-24-filled",
    subtitle: "Lifestyle and non-essential spending",
    theme: {
      text: "text-rose-700",
      bg: "bg-rose-50/50",
      border: "border-rose-100",
      accent: "!bg-rose-600",
      ring: "ring-rose-600/10",
      hoverBg: "!hover:bg-rose-700",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    }
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

      <section className="card p-5 md:p-6 shadow-sm border-0 ring-1 ring-slate-100/80">
        <div className="flex justify-center pb-4">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${active.theme.iconBg} ${active.theme.iconColor}`}>
              <IconifyIcon icon={active.icon} className="h-6 w-6" />
            </div>
            Quick Input
          </h1>
        </div>
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
                className={`absolute inset-0 flex flex-col justify-center rounded-2xl border transition-colors duration-300 p-4 md:p-5 ${active.theme.bg} ${active.theme.border}`}
                initial={{ opacity: 0, x: 50 * direction, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50 * direction, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}>
                <p className={`flex items-center gap-2 text-lg font-bold transition-colors duration-300 ${active.theme.text}`}>
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
          <IconifyIcon icon="fluent:hand-draw-24-regular" className={`h-4 w-4 ${active.theme.iconColor}`} />
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
                index === activeIndex ? `w-6 ${active.theme.accent}` : "w-2.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>
      </section>

      <div className="py-2">
        <QuickEntryForm key={active.category} category={active.category} title={`Add ${active.label}`} onCreated={refreshAll} theme={active.theme} />
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
