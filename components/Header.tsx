"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const titles: Record<string, string> = {
  "/":           "Dashboard Overview",
  "/students":   "Students",
  "/courses":    "Courses",
  "/orders":     "Orders",
  "/analytics":  "Analytics",
  "/exam-dates": "Exam Dates",
  "/accountant": "Accountant",
  "/accountant/report": "Monthly Report",
  "/settings":   "Settings",
};

export default function Header() {
  const path = usePathname();
  const title = titles[path] ?? "Dashboard";
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header
      className="print-hide flex items-center justify-between px-6 py-3.5 border-b shrink-0 bg-white"
      style={{ borderColor: "#E2E8F0" }}
    >
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: "#F1F5F9", color: "#94A3B8" }}
        >
          <Search size={14} />
          <span className="hidden sm:inline text-xs">Search…</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={17} className="text-slate-500" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#2E4A97" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "#1B2E5E" }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
