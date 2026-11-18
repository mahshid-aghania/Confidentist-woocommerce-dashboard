"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Phone, Mail, Search, CreditCard, Link2, ArrowUpDown, ChevronDown, Check, Clock,
} from "lucide-react";
import type { Receivable } from "@/lib/db";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtMoney(n: number) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Parse a "YYYY-MM-DD" string with no timezone math so the day never shifts.
function fmtDue(iso: string | null, withYear = true) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${MONTHS[m - 1]} ${d}${withYear ? ", " + y : ""}`;
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

type Filter = "all" | "overdue" | "upcoming";
type Sort = "owed" | "due";

export default function CollectionsTable({ people }: { people: Receivable[]; today?: string }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("owed");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = people.filter((p) => {
      if (filter === "overdue" && p.overdueAmount <= 0) return false;
      if (filter === "upcoming" && p.overdueAmount > 0) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle) ||
        p.orders.some((o) => o.includes(needle))
      );
    });
    list = [...list].sort((a, b) =>
      sort === "owed" ? b.owed - a.owed : String(a.nextDue).localeCompare(String(b.nextDue)),
    );
    return list;
  }, [people, q, filter, sort]);

  const shownOwed = rows.reduce((s, r) => s + r.owed, 0);

  const chip = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: filter === f ? "#1B2E5E" : "#EEF2F7", color: filter === f ? "#fff" : "#475569" }}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
      {/* Controls */}
      <div className="px-5 py-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: "#F1F5F9" }}>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, or order #…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:border-slate-400"
            style={{ borderColor: "#E2E8F0" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {chip("all", "All")}
          {chip("overdue", "Overdue")}
          {chip("upcoming", "Upcoming")}
        </div>
        <button
          onClick={() => setSort((s) => (s === "owed" ? "due" : "owed"))}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ background: "#EEF2F7", color: "#475569" }}
        >
          <ArrowUpDown size={13} /> Sort: {sort === "owed" ? "Amount" : "Due date"}
        </button>
      </div>

      {/* Count line */}
      <div className="px-5 py-2.5 text-xs text-slate-500 border-b flex items-center justify-between" style={{ borderColor: "#F8FAFC", background: "#FBFCFE" }}>
        <span>{rows.length} {rows.length === 1 ? "person" : "people"} shown</span>
        <span className="font-semibold text-slate-700">${fmtMoney(shownOwed)} CAD remaining</span>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-400">No matching records.</div>
      ) : (
        <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
          {rows.map((p, idx) => {
            const overdue = p.overdueAmount > 0;
            const isOpen = open.has(p.customerId);
            return (
              <div key={p.customerId}>
                <button
                  onClick={() => toggle(p.customerId)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 flex-wrap hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-semibold text-slate-300 w-5 text-right pt-2.5 shrink-0">{idx + 1}</span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: overdue ? "#B91C1C" : "#1B2E5E" }}
                    >
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                        {overdue && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#991B1B" }}>Overdue</span>
                        )}
                        {p.hasFailed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
                            <CreditCard size={10} /> Failed charge
                          </span>
                        )}
                        {p.hasLink && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#047857" }}>
                            <Link2 size={10} /> Link ready
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {p.course} · Order{p.orders.length > 1 ? "s" : ""} {p.orders.map((o) => `#${o}`).join(", ")}
                      </p>

                      {/* Plan progress */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: p.planCount }).map((_, i) => {
                            const paid = i < p.paidCount;
                            return (
                              <span
                                key={i}
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: paid ? "#16A34A" : "#E2E8F0" }}
                                title={paid ? "Paid" : "Remaining"}
                              >
                                {paid && <Check size={10} className="text-white" />}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-xs text-slate-500">
                          Paid <b className="text-slate-700">{p.paidCount} of {p.planCount}</b>
                          <span className="text-slate-400"> (${fmtMoney(p.paidAmount)})</span> · {p.remainingCount} left
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {p.phone && (
                          <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800">
                            <Phone size={12} /> {p.phone}
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800">
                            <Mail size={12} /> {p.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color: overdue ? "#DC2626" : "#1B2E5E" }}>
                      ${fmtMoney(p.owed)} <span className="text-xs font-medium text-slate-400">CAD left</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      next due {fmtDue(p.nextDue)}{p.finalDue && p.finalDue !== p.nextDue ? ` · ends ${fmtDue(p.finalDue)}` : ""}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium" style={{ color: "#1B2E5E" }}>
                      {p.remainingCount} payment{p.remainingCount === 1 ? "" : "s"} left
                      <ChevronDown size={13} className="transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                    </span>
                  </div>
                </button>

                {/* Expanded remaining schedule */}
                {isOpen && (
                  <div className="px-5 pb-4 pl-[4.5rem]">
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#EEF2F7" }}>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5" style={{ background: "#F8FAFC" }}>
                        <Clock size={12} /> Remaining schedule — what&apos;s left and when
                      </div>
                      <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
                        {p.schedule.map((s, i) => (
                          <div key={i} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-slate-700 truncate">{s.label}</span>
                              {p.orders.length > 1 && <span className="text-slate-400">#{s.orderNumber}</span>}
                              {s.overdue && <span className="font-semibold px-1.5 py-0.5 rounded" style={{ background: "#FEE2E2", color: "#991B1B" }}>overdue</span>}
                              {s.status === "failed" && <span className="font-semibold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#B45309" }}>failed</span>}
                              {s.hasLink && <Link2 size={11} style={{ color: "#047857" }} />}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className={s.overdue ? "font-medium" : "text-slate-500"} style={s.overdue ? { color: "#DC2626" } : undefined}>
                                {fmtDue(s.dueDate)}
                              </span>
                              <span className="font-semibold text-slate-800 w-20 text-right">${fmtMoney(s.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {p.primaryOrderId && (
                      <Link href={`/orders/${p.primaryOrderId}`} className="inline-block mt-2 text-xs font-medium underline" style={{ color: "#1B2E5E" }}>
                        Open full order →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
