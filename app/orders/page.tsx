import { orders } from "@/lib/data";
import { ShoppingCart, DollarSign, RefreshCw, Clock } from "lucide-react";

const statusStyle: Record<string, { bg: string; color: string }> = {
  completed:  { bg: "#DCFCE7", color: "#15803D" },
  processing: { bg: "#DBEAFE", color: "#1D4ED8" },
  refunded:   { bg: "#FEE2E2", color: "#DC2626" },
  pending:    { bg: "#FEF3C7", color: "#B45309" },
};

export default function OrdersPage() {
  const total     = orders.reduce((s, o) => s + (o.status !== "refunded" ? o.amount : 0), 0);
  const completed = orders.filter(o => o.status === "completed").length;
  const refunded  = orders.filter(o => o.status === "refunded").length;
  const processing= orders.filter(o => o.status === "processing" || o.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",   value: `$${total.toLocaleString()}`, icon: DollarSign,  color: "#1B2E5E" },
          { label: "Completed",        value: completed.toString(),         icon: ShoppingCart, color: "#0D9488" },
          { label: "Processing",       value: processing.toString(),        icon: Clock,        color: "#F59E0B" },
          { label: "Refunded",         value: refunded.toString(),          icon: RefreshCw,   color: "#EF4444" },
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

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">All Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Order", "Student", "Course", "Amount", "Date", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {orders.map((o) => {
                const st = statusStyle[o.status];
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "#1B2E5E" }}>
                      {o.orderId}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-slate-700">{o.student}</p>
                      <p className="text-xs text-slate-400">{o.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#E8EDF8", color: "#1B2E5E" }}>
                        {o.course}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                      ${o.amount.toLocaleString()} CAD
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{o.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                        style={{ background: st.bg, color: st.color }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
