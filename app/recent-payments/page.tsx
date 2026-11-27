import Link from "next/link";
import { Zap, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle, Wallet } from "lucide-react";
import { getLivePayments, type LivePayment, type LiveState } from "@/lib/live-payments";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const STATE: Record<LiveState, { label: string; bg: string; color: string; hint: string }> = {
  realtime:      { label: "Real-time ✓",          bg: "#DCFCE7", color: "#166534", hint: "Recorded as paid automatically by the Stripe webhook / sync." },
  caught:        { label: "Caught by live check", bg: "#FEF3C7", color: "#92400E", hint: "The webhook missed it; the dashboard's live Stripe check marked it paid." },
  fixed:         { label: "Fixed just now",       bg: "#FFEDD5", color: "#9A3412", hint: "The webhook missed it; marked paid when this page loaded." },
  unmatched:     { label: "Not linked to an order", bg: "#FEE2E2", color: "#991B1B", hint: "Paid in Stripe, but no matching order/installment in the dashboard." },
  "not-tracked": { label: "WooCommerce order",    bg: "#E0E7FF", color: "#3730A3", hint: "A regular WooCommerce order (not an installment plan) — check it in WC Orders." },
};

function money(n: number) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function when(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default async function RecentPaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const daysRaw = parseInt(one(sp.days) || "7", 10);
  const days = [1, 3, 7, 14, 30].includes(daysRaw) ? daysRaw : 7;

  let payments: LivePayment[] = [];
  let checkedAt = new Date().toISOString();
  let error: string | null = null;
  try {
    const r = await getLivePayments(days, { fix: true });
    payments = r.payments;
    checkedAt = r.checkedAt;
  } catch (e: any) {
    error = e?.message || "Could not load payments from Stripe.";
  }

  const count = (s: LiveState) => payments.filter((p) => p.state === s).length;
  const total = payments.reduce((a, p) => a + (p.refunded ? 0 : p.amount), 0);
  const missed = count("caught") + count("fixed");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AutoRefresh seconds={60} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#0F1D3E" }}>
            <Zap size={22} style={{ color: "#2E4A97" }} /> Recent Payments
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            Every successful Stripe payment in the last {days} day{days === 1 ? "" : "s"}, read live from Stripe, and
            whether the dashboard has it as paid. Checked {when(checkedAt)} · refreshes every minute.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[1, 3, 7, 14, 30].map((d) => (
            <Link
              key={d}
              href={`/recent-payments?days=${d}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={d === days
                ? { background: "#0F1D3E", color: "#fff", borderColor: "#0F1D3E" }
                : { background: "#fff", color: "#334155", borderColor: "#E2E8F0" }}
            >
              {d === 1 ? "24 h" : `${d} days`}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border p-4 text-sm" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" }}>
          <strong>Couldn’t load Stripe payments.</strong> {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: "Payments", value: `${payments.length}`, sub: `$${money(total)} collected`, color: "#2E4A97" },
              { icon: CheckCircle2, label: "Real-time", value: `${count("realtime")}`, sub: "recorded automatically", color: "#16A34A" },
              { icon: RefreshCw, label: "Missed by webhook", value: `${missed}`, sub: "fixed by the live check", color: "#EA580C" },
              { icon: AlertTriangle, label: "Not linked", value: `${count("unmatched")}`, sub: "need a look", color: "#DC2626" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="rounded-xl border bg-white p-4" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                  <Icon size={15} style={{ color }} /> {label}
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "#0F1D3E" }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto" style={{ borderColor: "#E2E8F0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ color: "#64748B", background: "#F8FAFC" }}>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Via</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">In dashboard</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ color: "#64748B" }}>
                    No Stripe payments in this period.
                  </td></tr>
                )}
                {payments.map((p) => {
                  const st = STATE[p.state];
                  return (
                    <tr key={p.chargeId} className="border-t align-top" style={{ borderColor: "#F1F5F9" }}>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#334155" }}>{when(p.createdISO)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium" style={{ color: "#0F1D3E" }}>{p.name || "—"}</div>
                        <div className="text-xs" style={{ color: "#64748B" }}>{p.email || "no email"}</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium" style={{ color: "#0F1D3E" }}>
                        {p.refunded ? <s>${money(p.amount)}</s> : `$${money(p.amount)}`}
                        <div className="text-xs font-normal" style={{ color: "#64748B" }}>{p.currency}{p.refunded ? " · refunded" : ""}</div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#334155" }}>
                        {p.via}
                        <div className="text-xs" style={{ color: "#64748B" }}>{p.card}</div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#334155" }}>
                        {p.orderNumber ? (
                          <Link href={`/wc-orders?customer=${encodeURIComponent(p.orderNumber)}`} className="font-medium underline" style={{ color: "#2E4A97" }}>
                            #{p.orderNumber}
                          </Link>
                        ) : "—"}
                        {p.installmentLabel && <div className="text-xs" style={{ color: "#64748B" }}>{p.installmentLabel}</div>}
                        {p.matchedBy && <div className="text-xs" style={{ color: "#94A3B8" }}>matched by {p.matchedBy.toLowerCase()}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span title={st.hint} className="inline-block text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {p.receiptUrl && (
                          <div className="mt-1"><a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "#64748B" }}>Stripe receipt</a></div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-xs flex flex-wrap gap-x-5 gap-y-1" style={{ color: "#64748B" }}>
            <span className="flex items-center gap-1"><HelpCircle size={13} /> What the status means:</span>
            {(Object.keys(STATE) as LiveState[]).map((k) => (
              <span key={k}><strong style={{ color: STATE[k].color }}>{STATE[k].label}</strong> — {STATE[k].hint}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
