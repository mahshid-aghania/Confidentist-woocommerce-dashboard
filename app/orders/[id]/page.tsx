import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle,
  CreditCard, MapPin, Receipt, User, Phone, Mail,
} from "lucide-react";
import { orders, type Transaction } from "@/lib/data";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  const abs = Math.abs(amount);
  return (amount < 0 ? "−" : "") + "$" + abs.toLocaleString();
}

function TxnStatusIcon({ status }: { status: Transaction["status"] }) {
  if (status === "success") return <CheckCircle2 size={14} style={{ color: "#16A34A" }} />;
  if (status === "failed")  return <XCircle      size={14} style={{ color: "#DC2626" }} />;
  return                          <Clock         size={14} style={{ color: "#D97706" }} />;
}

function TxnStatusBadge({ status }: { status: Transaction["status"] }) {
  const styles = {
    success: { bg: "#DCFCE7", color: "#15803D", label: "Success" },
    failed:  { bg: "#FEE2E2", color: "#DC2626", label: "Failed"  },
    pending: { bg: "#FEF3C7", color: "#B45309", label: "Pending" },
  }[status];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: styles.bg, color: styles.color }}>
      {styles.label}
    </span>
  );
}

function AddressCard({ title, address }: { title: string; address: NonNullable<(typeof orders)[number]["billingAddress"]> }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        <MapPin size={12} /> {title}
      </p>
      <p className="text-sm font-medium text-slate-800">{address.name}</p>
      <p className="text-xs text-slate-500 leading-relaxed">
        {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
        {address.city}, {address.province} {address.postal}<br />
        {address.country}
      </p>
      <p className="text-xs text-slate-500">{address.phone}</p>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orders.find(o => o.id === id);
  if (!order) notFound();

  const plan = order.installmentPlan;
  const hasPending  = order.transactions.some(t => t.status === "pending");
  const hasFailed   = order.transactions.some(t => t.status === "failed");
  const isOverdue   = (plan?.overdueDays ?? 0) > 0;

  const remainingAmount = order.amount - order.paidAmount;
  const progressPct = order.amount > 0 ? Math.round((order.paidAmount / order.amount) * 100) : 0;

  const orderStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
    completed:  { bg: "#DCFCE7", color: "#15803D", label: "Completed"  },
    processing: { bg: "#DBEAFE", color: "#1D4ED8", label: "Processing" },
    refunded:   { bg: "#FEE2E2", color: "#DC2626", label: "Refunded"   },
    pending:    { bg: "#FEF3C7", color: "#B45309", label: "Pending"    },
  };
  const st = orderStatusStyle[order.status];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-3 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Orders
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            Order {order.orderId}
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Placed on {order.date}</p>
        </div>

        {/* Alert badges */}
        <div className="flex flex-wrap gap-2">
          {isOverdue && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
              <AlertTriangle size={13} /> {plan!.overdueDays} day{plan!.overdueDays !== 1 ? "s" : ""} overdue
            </div>
          )}
          {hasPending && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}>
              <Clock size={13} /> Pending transaction
            </div>
          )}
          {hasFailed && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
              <XCircle size={13} /> Failed transaction
            </div>
          )}
        </div>
      </div>

      {/* Top row: Payment summary + Customer */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Payment Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border space-y-4" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Receipt size={15} style={{ color: "#1B2E5E" }} /> Payment Summary
          </h2>

          {/* Type + method row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Payment Type</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {order.paymentType === "partial" ? "Partial Payment" : "Full Payment"}
              </p>
            </div>
            {plan && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Payment Method</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {plan.method === "installment" ? "Equal Installments" : "Deposit + Balance"}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-1">Course(s)</p>
              <p className="text-sm font-semibold text-slate-800">{order.productName || order.course}</p>
              {order.variation && order.variation !== "Standard" && (
                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8EDF8", color: "#1B2E5E" }}>
                  {order.variation}
                </span>
              )}
            </div>
          </div>

          {/* Amount progress */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Amount Paid</span>
              <span className="text-xs font-semibold text-slate-700">
                {fmt(order.paidAmount)} <span className="font-normal text-slate-400">/ {fmt(order.amount)} CAD</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100 ? "#16A34A" : isOverdue ? "#DC2626" : "#2E4A97",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">{progressPct}% paid</span>
              {remainingAmount > 0 && (
                <span className="text-xs font-medium" style={{ color: isOverdue ? "#DC2626" : "#64748B" }}>
                  {fmt(remainingAmount)} remaining
                </span>
              )}
            </div>
          </div>

          {/* Installment plan detail */}
          {plan && (
            <div className="rounded-lg p-4 space-y-3" style={{ background: isOverdue ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${isOverdue ? "#FECACA" : "#E2E8F0"}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: isOverdue ? "#991B1B" : "#475569" }}>
                Installment Plan
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Total Installments</p>
                  <p className="text-sm font-bold text-slate-800">{plan.totalInstallments}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Paid</p>
                  <p className="text-sm font-bold" style={{ color: "#16A34A" }}>{plan.paidInstallments}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-sm font-bold" style={{ color: isOverdue ? "#DC2626" : "#1B2E5E" }}>
                    {plan.totalInstallments - plan.paidInstallments}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Per Installment</p>
                  <p className="text-sm font-bold text-slate-800">{fmt(plan.installmentAmount)}</p>
                </div>
              </div>

              {/* Installment timeline dots */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {Array.from({ length: plan.totalInstallments }).map((_, i) => {
                  const paid    = i < plan.paidInstallments;
                  const overdue = !paid && plan.overdueDays > 0 && i === plan.paidInstallments;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          background: paid ? "#16A34A" : overdue ? "#DC2626" : "#CBD5E1",
                        }}
                        title={paid ? `Paid` : overdue ? `Overdue ${plan.overdueDays}d` : "Upcoming"}
                      >
                        {i + 1}
                      </div>
                      {i < plan.totalInstallments - 1 && (
                        <div className="w-6 h-0.5" style={{ background: paid ? "#16A34A" : "#E2E8F0" }} />
                      )}
                    </div>
                  );
                })}
                <span className="text-xs text-slate-500 ml-2">
                  {plan.nextDueDate && !isOverdue ? `Next due: ${plan.nextDueDate}` : ""}
                  {isOverdue ? `⚠ Overdue by ${plan.overdueDays} day${plan.overdueDays !== 1 ? "s" : ""}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <User size={15} style={{ color: "#1B2E5E" }} /> Customer
          </h2>
          <div>
            <p className="text-sm font-semibold text-slate-800">{order.student}</p>
            <div className="mt-2 space-y-1.5">
              <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700">
                <Mail size={12} /> {order.email}
              </a>
              <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700">
                <Phone size={12} /> {order.phone}
              </a>
            </div>
          </div>
          <hr style={{ borderColor: "#F1F5F9" }} />
          <AddressCard title="Billing Address" address={order.billingAddress} />
          {order.shippingAddress && (
            <>
              <hr style={{ borderColor: "#F1F5F9" }} />
              <AddressCard title="Shipping Address" address={order.shippingAddress} />
            </>
          )}
          {!order.shippingAddress && (
            <p className="text-xs text-slate-400 italic">Shipping = Billing address</p>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}>
          <CreditCard size={15} style={{ color: "#1B2E5E" }} />
          <h2 className="text-sm font-semibold text-slate-700">Transaction History</h2>
          <span className="text-xs text-slate-400 ml-auto">{order.transactions.length} transaction{order.transactions.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
          {order.transactions.map((txn) => (
            <div key={txn.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <TxnStatusIcon status={txn.status} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">{txn.method}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{txn.gateway} · {txn.date}</p>
                  {txn.note && (
                    <p className="text-xs mt-1" style={{ color: txn.status === "failed" ? "#DC2626" : txn.status === "pending" ? "#B45309" : "#64748B" }}>
                      {txn.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold" style={{ color: txn.amount < 0 ? "#DC2626" : "#1E293B" }}>
                  {fmt(txn.amount)} CAD
                </p>
                <div className="mt-1">
                  <TxnStatusBadge status={txn.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
