import { Users, DollarSign, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { getReceivables } from "@/lib/db";
import CollectionsTable from "@/components/CollectionsTable";

export const dynamic = "force-dynamic";

const CUTOFF = "2026-12-31";

function money(n: number) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function cutoffLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export default async function CollectionsPage() {
  const { people, totals } = await getReceivables(CUTOFF);

  const cards = [
    { label: "People who owe", value: String(totals.people), sub: `${totals.remainingCount} payments left`, color: "#1B2E5E", icon: Users },
    { label: "Total remaining", value: `$${money(totals.owed)}`, sub: "across all unpaid payments", color: "#2E4A97", icon: DollarSign },
    { label: `Due by ${cutoffLabel(CUTOFF).replace(", 2026", "")}`, value: `$${money(totals.dueByCutoff)}`, sub: "within the target window", color: "#B45309", icon: CalendarClock },
    { label: "Already overdue", value: `$${money(totals.overdue)}`, sub: "past due as of today", color: "#DC2626", icon: AlertTriangle },
    { label: "Collected so far", value: `$${money(totals.collected)}`, sub: "paid on these plans", color: "#16A34A", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="rounded-xl px-6 py-5" style={{ background: "linear-gradient(135deg, #0F1D3E 0%, #2E4A97 100%)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Collections</p>
            <h1 className="text-white text-xl font-bold">Outstanding Balances</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Everyone with an unpaid installment due on or before {cutoffLabel(CUTOFF)}. Each person shows their
              full plan — payments made, amount collected, and exactly what&apos;s left and when.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <p className="text-white text-2xl font-bold">{totals.people}</p>
              <p className="text-blue-200 text-xs">People</p>
            </div>
            <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div>
              <p className="text-white text-2xl font-bold">${money(totals.owed)}</p>
              <p className="text-blue-200 text-xs">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* The list */}
      <CollectionsTable people={people} />

      <p className="text-xs text-slate-400">
        Unpaid = installments marked <b>pending</b> or <b>failed</b> (paid, cancelled, and refunded excluded).
        Token test amounts under $1 and the owner&apos;s own test order are filtered out. Figures update live from the
        synced WooCommerce → Supabase data.
      </p>
    </div>
  );
}
