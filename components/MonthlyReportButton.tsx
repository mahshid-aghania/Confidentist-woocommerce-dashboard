"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, ChevronDown, ArrowRight } from "lucide-react";
import { availableMonths } from "@/lib/report";

export default function MonthlyReportButton() {
  const router = useRouter();
  const months = availableMonths();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(months[0]?.value ?? "");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function generate() {
    if (month) router.push(`/accountant/report?month=${month}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        style={{ background: "#fff", color: "#1B2E5E" }}
      >
        <FileBarChart size={16} />
        Generate Report
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border p-4 z-20"
          style={{ borderColor: "#E2E8F0" }}
        >
          <p className="text-sm font-semibold text-slate-700">Monthly Financial Report</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            Pick a month to generate a tax summary you can save as PDF.
          </p>

          <label className="text-xs font-medium text-slate-500">Report month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 mt-1 bg-white"
            style={{ borderColor: "#CBD5E1" }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={generate}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors"
            style={{ background: "#1B2E5E" }}
          >
            Open Report <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
