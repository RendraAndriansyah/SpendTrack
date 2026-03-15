"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon as IconifyIcon } from "@iconify/react";

const links = [
  { href: "/", label: "Input", icon: "fluent:edit-24-filled" },
  { href: "/dashboard", label: "Dashboard", icon: "fluent:data-bar-vertical-24-filled" },
  { href: "/analytics", label: "Analytics", icon: "fluent:data-line-24-filled" },
  { href: "/settings/data", label: "Data", icon: "fluent:database-24-filled" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-lavender/60 bg-white/90 backdrop-blur">
      <ul className="mx-auto grid max-w-6xl grid-cols-4 gap-1 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[11px] font-semibold sm:text-xs md:text-sm ${
                  active ? "bg-accent text-white" : "bg-white text-text"
                }`}>
                <IconifyIcon icon={link.icon} className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
