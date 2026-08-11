import Link from "next/link";
import {
  AlertTriangle, Phone, Mail, CreditCard,
  CheckCircle2, Clock, TrendingDown, DollarSign,
} from "lucide-react";
import { orders } from "@/lib/data";

function urgencyLevel(days: number): "critical" | "high" | "medium" {
  if (days >= 10) return "critical";
  if (days >= 5)  return "high";
  return "medium";
}

const urgencyStyle = {
  critical: { bg: "#FEF2F2", border: "#FECACA", badge: "#FEE2E2", badgeText: "#991B1B", dot: "#DC2626", label: "Critical" },
  high:     { bg: "#FFF7ED", border: "#FED7AA", badge: "#FFEDD5", badgeText: "#9A3412", dot: "#F97316", label: "High"     },
  medium:   { bg: "#FFFBEB", border: "#FDE68A", badge: "#FEF3C7", badgeText: "#92400E", dot: "#F59E0B", label: "Medium"  },
};

export default function AccountantPage() {
  const overdueOrders = orders
    .filter(o => (o.installmentPlan?.overdueDays ?? 0) > 0)
    .sort((a, b) => (b.installmentPlan!.overdueDays) - (a.installmentPlan!.overdueDays));

  const failedOrPendingOrders = orders.filter(o =>
    o.transactions.some(t => t.status === "failed" || t.status === "pending") &&
    (o.installmentPlan?.overdueDays ?? 0) === 0
  );

  const totalOverdue = overdueOrders.reduce(
    (sum, o) => sum + (o.amount - o.paidAmount), 0
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div
        className="rounded-xl px-6 py-5"
        style={{ background: "linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-red-300 text-xs font-semibold uppercase tracking-widest mb-1">Accountant Panel</p>
            <h1 className="text-white text-xl font-bold">Late Payment Warnings</h1>
            <p className="text-red-200 text-sm mt-1">
              Review overdue installments and contact students. Call before escalating.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <p className="text-white text-2xl font-bold">{overdueOrders.length}</p>
              <p className="text-red-300 text-xs">Overdue Orders</p>
            </div>
            <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div>
              <p className="text-white text-2xl font-bold">${totalOverdue.toLocaleString()}</p>
              <p className="text-red-300 text-xs">Total Outstanding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical (10+ days)",  value: overdueOrders.filter(o => o.installmentPlan!.overdueDays >= 10).length.toString(), color: "#DC2626", icon: AlertTriangle },
          { label: "High (5–9 days)",      value: overdueOrders.filter(o => { const d = o.installmentPlan!.overdueDays; return d >= 5 && d < 10; }).length.toString(), color: "#F97316", icon: Clock },
          { label: "Medium (1–4 days)",    value: overdueOrders.filter(o => o.installmentPlan!.overdueDays < 5).length.toString(), color: "#F59E0B", icon: TrendingDown },
          { label: "Outstanding Amount",   value: `$${totalOverdue.toLocaleString()}`, color: "#1B2E5E", icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue orders — call list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}>
          <AlertTriangle size={15} style={{ color: "#DC2626" }} />
          <h2 className="text-sm font-semibold text-slate-700">Overdue Installments — Call List</h2>
        </div>

        {overdueOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: "#16A34A" }} />
            <p className="text-sm font-medium text-slate-600">All payments are on time</p>
            <p className="text-xs text-slate-400 mt-1">No overdue installments found.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {overdueOrders.map((order) => {
              const plan   = order.installmentPlan!;
              const level  = urgencyLevel(plan.overdueDays);
              const styles = urgencyStyle[level];
              const hasFailed  = order.transactions.some(t => t.status === "failed");
              const hasPending = order.transactions.some(t => t.status === "pending");
              const outstanding = order.amount - order.paidAmount;

              return (
                <div
                  key={order.id}
                  className="p-5 space-y-4"
                  style={{ borderLeft: `4px solid ${styles.dot}` }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "#1B2E5E" }}
                      >
                        {order.student.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800">{order.student}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: styles.badge, color: styles.badgeText }}>
                            {styles.label} — {plan.overdueDays}d overdue
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{order.course} · Order {order.orderId}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <a
                            href={`tel:${order.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: styles.dot, color: "#fff" }}
                          >
                            <Phone size={12} /> Call {order.phone}
                          </a>
                          <a
                            href={`mailto:${order.email}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                          >
                            <Mail size={12} /> {order.email}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold" style={{ color: "#DC2626" }}>${outstanding.toLocaleString()} CAD</p>
                      <p className="text-xs text-slate-400">outstanding balance</p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-block mt-2 text-xs font-medium underline"
                        style={{ color: "#1B2E5E" }}
                      >
                        View order →
                      </Link>
                    </div>
                  </div>

                  {/* Installment progress + transaction flags */}
                  <div className="rounded-lg p-3 space-y-2" style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-slate-500">Installment progress</p>
                        <p className="text-sm font-bold text-slate-800">
                          {plan.paidInstallments} of {plan.totalInstallments} paid
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            ({fmt(plan.installmentAmount)} each)
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Payment method</p>
                        <p className="text-sm font-semibold text-slate-700 capitalize">
                          {plan.method === "installment" ? "Equal Installments" : "Deposit + Balance"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Due date</p>
                        <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>{plan.nextDueDate ?? "—"}</p>
                      </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: plan.totalInstallments }).map((_, i) => {
                        const paid    = i < plan.paidInstallments;
                        const current = !paid && i === plan.paidInstallments;
                        return (
                          <div key={i} className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: paid ? "#16A34A" : current ? styles.dot : "#E2E8F0",
                                color: paid || current ? "#fff" : "#94A3B8",
                              }}
                            >
                              {i + 1}
                            </div>
                            {i < plan.totalInstallments - 1 && (
                              <div className="w-5 h-0.5" style={{ background: paid ? "#16A34A" : "#E2E8F0" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Transaction flags */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {hasFailed && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          <CreditCard size={10} /> Failed transaction on record
                        </span>
                      )}
                      {hasPending && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
                          <Clock size={10} /> Pending transaction
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Suggested action */}
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" style={{ color: styles.dot }} />
                    <span>
                      {level === "critical"
                        ? "URGENT: Contact immediately. Consider suspending access and notifying management if unresponsive."
                        : level === "high"
                        ? "Follow up today. Send a payment reminder email and attempt a phone call."
                        : "Send a gentle payment reminder email. Follow up with a call if no response within 24 hours."}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending / failed — watch list */}
      {failedOrPendingOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}>
            <Clock size={15} style={{ color: "#D97706" }} />
            <h2 className="text-sm font-semibold text-slate-700">Watch List — Pending / Failed Payments</h2>
            <span className="text-xs text-slate-400 ml-auto">Not yet overdue, but needs monitoring</span>
          </div>
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {failedOrPendingOrders.map(order => {
              const pendingTxns = order.transactions.filter(t => t.status === "pending");
              const failedTxns  = order.transactions.filter(t => t.status === "failed");
              return (
                <div key={order.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{order.student}</p>
                      <span className="text-xs font-semibold" style={{ color: "#1B2E5E" }}>{order.orderId}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{order.course} · {order.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {failedTxns.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          {failedTxns.length} failed
                        </span>
                      )}
                      {pendingTxns.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
                          {pendingTxns.length} pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={`tel:${order.phone}`} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      <Phone size={12} /> {order.phone}
                    </a>
                    <Link href={`/orders/${order.id}`} className="text-xs font-medium underline" style={{ color: "#1B2E5E" }}>
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return "$" + n.toLocaleString();
}
