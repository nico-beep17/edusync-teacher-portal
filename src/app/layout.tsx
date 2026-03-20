import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DepAid | Teacher Portal",
  description: "DepEd-Compliant Offline-First Teacher Management System for Philippine Public Schools",
  applicationName: "DepAid",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DepAid",
  },
};

export const viewport: Viewport = {
  themeColor: "#1ca560",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
