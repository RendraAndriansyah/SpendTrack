import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { SWRegister } from "@/components/sw-register";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Spend Tracker",
  description: "Offline-first spend tracking PWA",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
        <SWRegister />
        <Toaster richColors position="top-center" />
        <main>{children}</main>
        <AppNav />
      </body>
    </html>
  );
}
