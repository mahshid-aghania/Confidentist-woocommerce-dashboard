"use client";

import { useState } from "react";
import { RefreshCw, Database } from "lucide-react";
import { runSyncOrder, runSyncAll } from "./actions";

export default function SyncPanel() {
  const [orderNo, setOrderNo] = useState("");
  const [busy, setBusy] = useState<"one" | "all" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function syncOne() {
    if (!orderNo.trim()) return;
    setBusy("one"); setMsg(null);
    const r = await runSyncOrder(orderNo);
    if (r.ok) {
      const x = r.result;
      setMsg({ ok: true, text: `Synced #${x.order_number} — ${x.customer}: ${x.installments} installments (${x.paid} paid, ${x.pending} pending), ${x.preserved_links} Stripe link(s) preserved.` });
    } else setMsg({ ok: false, text: r.error });
    setBusy(null);
  }

  async function syncEverything() {
    setBusy("all"); setMsg(null);
    const r = await runSyncAll();
    if (r.ok) {
      const errs = (r as any).errors?.length ? ` · ${(r as any).errors.length} error(s)` : "";
      setMsg({ ok: true, text: `Synced ${(r as any).synced.length} order(s)${errs}.` });
    } else setMsg({ ok: false, text: (r as any).error });
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
        <Database size={16} style={{ color: "#1B2E5E" }} />
        <h3 className="text-sm font-semibold text-slate-700">WooCommerce → Supabase Sync</h3>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Pulls orders, customers, line items and the full installment schedule from WooCommerce into
          Supabase. Safe to re-run: existing Stripe payment links are preserved and paid installments
          are never downgraded.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Order number</label>
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="e.g. 58527"
              className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none"
              style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
            />
          </div>
          <button
            onClick={syncOne}
            disabled={busy !== null}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            style={{ background: "#1B2E5E" }}
          >
            {busy === "one" && <RefreshCw size={14} className="animate-spin" />} Sync order
          </button>
          <button
            onClick={syncEverything}
            disabled={busy !== null}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 border"
            style={{ borderColor: "#1B2E5E", color: "#1B2E5E" }}
          >
            {busy === "all" && <RefreshCw size={14} className="animate-spin" />} Sync all
          </button>
        </div>

        {msg && (
          <div
            className="text-xs rounded-lg px-3 py-2 border"
            style={
              msg.ok
                ? { background: "#EEFCF3", borderColor: "#C7ECD5", color: "#0B8A3B" }
                : { background: "#FFF4F4", borderColor: "#F5D2D2", color: "#8A2B2B" }
            }
          >
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
