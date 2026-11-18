import {
  Users, AlertTriangle, CalendarClock, CheckCircle2, Wallet, TrendingUp, Clock,
} from "lucide-react";
import { getReceivables } from "@/lib/db";
import CollectionsTable from "@/components/CollectionsTable";
import { MonthlyCollections, SplitDonut, OverdueAging } from "@/components/CollectionsCharts";

export const dynamic = "force-dynamic";

const CUTOFF = "2026-12-31";
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function money(n: number) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money0(n: number) {
  return n.toLocaleString("en-CA", { maximumFractionDigits: 0 });
}
function cutoffLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`;
}
function daysSince(today: string, due: string) {
  const [ay, am, ad] = today.split("-").map(Number);
  const [by, bm, bd] = due.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

export default async function CollectionsPage() {
  const { people, totals, today } = await getReceivables(CUTOFF);

  // Monthly expected collections (overdue vs scheduled), from every remaining payment.
  const mMap = new Map<string, { scheduled: number; overdue: number }>();
  for (const p of people) {
    for (const s of p.schedule) {
      if (!s.dueDate) continue;
      const key = s.dueDate.slice(0, 7);
      const e = mMap.get(key) ?? { scheduled: 0, overdue: 0 };
      if (s.overdue) e.overdue += s.amount;
      else e.scheduled += s.amount;
      mMap.set(key, e);
    }
  }
  const monthly = [...mMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => {
      const [y, m] = key.split("-");
      return { month: `${MONTHS_SHORT[+m - 1]} '${y.slice(2)}`, scheduled: Math.round(v.scheduled), overdue: Math.round(v.overdue) };
    });

  // Aging of overdue balances, bucketed by the oldest overdue payment per person.
  const BUCKETS = [
    { k: "1–30 days", min: 1, max: 30 },
    { k: "31–60 days", min: 31, max: 60 },
    { k: "61–90 days", min: 61, max: 90 },
    { k: "90+ days", min: 91, max: Infinity },
  ];
  const aging = BUCKETS.map((b) => ({ bucket: b.k, amount: 0, people: 0 }));
  for (const p of people) {
    let od = 0;
    let oldest = 0;
    for (const s of p.schedule) {
      if (s.overdue && s.dueDate) {
        od += s.amount;
        oldest = Math.max(oldest, daysSince(today, s.dueDate));
      }
    }
    if (od > 0) {
      const idx = BUCKETS.findIndex((b) => oldest >= b.min && oldest <= b.max);
      if (idx >= 0) {
        aging[idx].amount += od;
        aging[idx].people += 1;
      }
    }
  }
  aging.forEach((a) => (a.amount = Math.round(a.amount)));

  const base = totals.collected + totals.owed;
  const pctCollected = base > 0 ? Math.round((totals.collected / base) * 100) : 0;
  const overdueCount = people.filter((p) => p.overdueAmount > 0).length;

  const split = [
    { name: "Overdue", value: Math.round(totals.overdue), color: "#DC2626" },
    { name: "Upcoming", value: Math.round(totals.owed - totals.overdue), color: "#2E4A97" },
  ];

  const cards = [
    { label: "People who owe", value: String(totals.people), sub: `${totals.remainingCount} payments left`, color: "#2E4A97", icon: Users },
    { label: "Due by Dec 31", value: `$${money0(totals.dueByCutoff)}`, sub: "within target window", color: "#B45309", icon: CalendarClock },
    { label: "Already overdue", value: `$${money0(totals.overdue)}`, sub: `${overdueCount} people past due`, color: "#DC2626", icon: AlertTriangle },
    { label: "Total remaining", value: `$${money0(totals.owed)}`, sub: "all unpaid payments", color: "#0D9488", icon: Wallet },
    { label: "Collected so far", value: `$${money0(totals.collected)}`, sub: `${pctCollected}% of contracted`, color: "#16A34A", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl px-6 py-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1733 0%, #16295B 45%, #2E4A97 100%)" }}
      >
        <div
          className="absolute -top-24 -right-20 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #4C9BE8 0%, transparent 70%)" }}
        />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Wallet size={13} className="text-blue-200" />
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-widest">Collections</span>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Outstanding Balances</h1>
            <p className="text-blue-100/80 text-sm mt-1.5">
              Everyone with an unpaid installment due on or before {cutoffLong(CUTOFF)} — with each person&apos;s full
              plan: paid, collected, and what&apos;s left and when.
            </p>

            {/* Collection progress */}
            <div className="mt-5 max-w-md">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-blue-100/70">Collected vs. remaining</span>
                <span className="text-white font-semibold">{pctCollected}% collected</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.14)" }}>
                <div className="h-full rounded-full" style={{ width: `${pctCollected}%`, background: "linear-gradient(90deg, #34D399, #10B981)" }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-emerald-300 font-medium">${money0(totals.collected)} in</span>
                <span className="text-blue-100/70">${money0(totals.owed)} to go</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white text-3xl font-bold leading-none">{totals.people}</p>
              <p className="text-blue-200/80 text-xs mt-1">people owe</p>
              <p className="text-white text-xl font-bold leading-none mt-4">${money0(totals.owed)}</p>
              <p className="text-blue-200/80 text-xs mt-1">remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="group bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow" style={{ borderColor: "#E9EEF5" }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color }} />
            </div>
            <p className="text-xl font-bold text-slate-800 mt-3 leading-tight">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: "#E9EEF5" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} style={{ color: "#2E4A97" }} />
            <h2 className="text-sm font-semibold text-slate-700">Expected collections by month</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">Every remaining payment, by its due month — overdue shown in red.</p>
          <MonthlyCollections data={monthly} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: "#E9EEF5" }}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={15} style={{ color: "#0D9488" }} />
            <h2 className="text-sm font-semibold text-slate-700">Remaining split</h2>
          </div>
          <SplitDonut data={split} centerLabel="remaining" centerValue={`$${money0(totals.owed)}`} />
          <div className="flex items-center justify-center gap-4 mt-2">
            {split.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-500">{s.name}</span>
                <span className="font-semibold text-slate-700">${money0(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Aging ──────────────────────────────────────────────── */}
      {totals.overdue > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: "#E9EEF5" }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} style={{ color: "#DC2626" }} />
            <h2 className="text-sm font-semibold text-slate-700">Overdue aging</h2>
            <span className="ml-auto text-xs text-slate-400">${money(totals.overdue)} past due across {overdueCount} people</span>
          </div>
          <OverdueAging data={aging} />
        </div>
      )}

      {/* ── The list ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 px-1">Who owes — {totals.people} people</h2>
        <CollectionsTable people={people} />
      </div>

      <p className="text-xs text-slate-400">
        Unpaid = installments marked <b>pending</b> or <b>failed</b> (paid, cancelled, and refunded excluded). Token
        amounts under $1 and the owner&apos;s own test order are filtered out. Figures update live from the synced
        WooCommerce → Supabase data.
      </p>
    </div>
  );
}
