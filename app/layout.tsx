import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ConditionalChrome from "@/components/ConditionalChrome";
import { getOverdueCount } from "@/lib/db";

export const metadata: Metadata = {
  title: "ConfiDentist Admin Dashboard",
  description: "Admin dashboard for ConfiDentist dental exam preparation platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let overdueCount = 0;
  try { overdueCount = await getOverdueCount(); } catch { overdueCount = 0; }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen overflow-hidden bg-slate-100">
        <ConditionalChrome
          sidebar={<Sidebar overdueCount={overdueCount} />}
          header={<Header />}
        >
          {children}
        </ConditionalChrome>
      </body>
    </html>
  );
}
