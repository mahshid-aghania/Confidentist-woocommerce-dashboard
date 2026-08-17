import Link from "next/link";
import { orders } from "@/lib/data";
import { ShoppingCart, DollarSign, RefreshCw, Clock, AlertTriangle, CreditCard } from "lucide-react";

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  completed:  { bg: "#DCFCE7", color: "#15803D", label: "Completed"  },
  processing: { bg: "#DBEAFE", color: "#1D4ED8", label: "Processing" },
  refunded:   { bg: "#FEE2E2", color: "#DC2626", label: "Refunded"   },
  pending:    { bg: "#FEF3C7", color: "#B45309", label: "Pending"    },
};

const PER_PAGE = 50;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const total      = orders.reduce((s, o) => s + (o.status !== "refunded" ? o.amount : 0), 0);
  const completed  = orders.filter(o => o.status === "completed").length;
  const refunded   = orders.filter(o => o.status === "refunded").length;
  const processing = orders.filter(o => o.status === "processing" || o.status === "pending").length;
  const lateCount  = orders.filter(o => (o.installmentPlan?.overdueDays ?? 0) > 0).length;

  const totalPages  = Math.ceil(orders.length / PER_PAGE);
  const pageOrders  = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue",    value: `$${total.toLocaleString()}`, icon: DollarSign,   color: "#1B2E5E" },
          { label: "Completed",        value: completed.toLocaleString(),   icon: ShoppingCart,  color: "#0D9488" },
          { label: "Processing",       value: processing.toLocaleString(),  icon: Clock,         color: "#F59E0B" },
          { label: "Refunded",         value: refunded.toLocaleString(),    icon: RefreshCw,     color: "#EF4444" },
          { label: "Overdue Payments", value: lateCount.toLocaleString(),   icon: AlertTriangle, color: "#DC2626" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue Warning */}
      {lateCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <AlertTriangle size={16} style={{ color: "#DC2626" }} className="shrink-0" />
          <p className="text-sm" style={{ color: "#991B1B" }}>
            <span className="font-semibold">{lateCount} order{lateCount > 1 ? "s" : ""}</span> have overdue installment payments.{" "}
            <Link href="/accountant" className="underline font-semibold">View accountant panel →</Link>
          </p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">
            All Orders <span className="font-normal text-slate-400">({orders.length.toLocaleString()} total)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages} · Click order # to view details
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Order", "Student", "Date", "Course", "Payment", "Paid / Total", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {pageOrders.map((o) => {
                const st      = statusStyle[o.status];
                const overdue = o.installmentPlan?.overdueDays ?? 0;
                const isPartial = o.paymentType === "partial";
                const methodLabel = isPartial
                  ? (o.installmentPlan?.method === "installment" ? "Installment" : "Deposit")
                  : "Full";
                const methodColor = isPartial ? "#9A3412" : "#166534";
                const methodBg    = isPartial ? "#FFF7ED"  : "#F0FDF4";

                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "#1B2E5E" }}
                      >
                        {o.orderId}
                      </Link>
                      {overdue > 0 && (
                        <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          {overdue}d late
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-slate-700">{o.student}</p>
                      <p className="text-xs text-slate-400">{o.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{o.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#E8EDF8", color: "#1B2E5E" }}>
                        {o.course}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={11} style={{ color: methodColor }} />
                        <span className="text-xs font-semibold" style={{ color: methodColor, background: methodBg, padding: "1px 6px", borderRadius: "9999px" }}>
                          {methodLabel}
                        </span>
                        {o.installmentPlan && (
                          <span className="text-xs text-slate-400">
                            {o.installmentPlan.paidInstallments}/{o.installmentPlan.totalInstallments}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                      ${o.paidAmount.toLocaleString()}{" "}
                      <span className="font-normal text-slate-400">/ ${o.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <p className="text-xs text-slate-400">
            Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, orders.length)} of {orders.length.toLocaleString()} orders
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/orders?page=${page - 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-slate-50"
                style={{ borderColor: "#E2E8F0", color: "#1B2E5E" }}
              >
                ← Prev
              </Link>
            )}
            <span className="text-xs text-slate-500 px-2">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/orders?page=${page + 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-slate-50"
                style={{ borderColor: "#E2E8F0", color: "#1B2E5E" }}
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
