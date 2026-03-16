import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { SWRegister } from "@/components/sw-register";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "Spend Tracker",
  description: "Offline-first spend tracking PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendTrack",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
