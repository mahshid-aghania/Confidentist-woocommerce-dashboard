import { RevenueAreaChart, EnrollmentsBarChart } from "@/components/RevenueChart";
import { courses, monthlyRevenue } from "@/lib/data";

export default function AnalyticsPage() {
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const totalOrders  = monthlyRevenue.reduce((s, m) => s + m.orders, 0);
  const totalNew     = monthlyRevenue.reduce((s, m) => s + m.students, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "YTD Revenue",       value: `$${(totalRevenue/1000).toFixed(0)}k CAD`, color: "#1B2E5E" },
          { label: "YTD Orders",        value: totalOrders.toString(),                    color: "#0D9488" },
          { label: "New Students YTD",  value: totalNew.toString(),                       color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
            <div className="mt-3 h-1 rounded-full" style={{ background: `${color}30` }}>
              <div className="h-full rounded-full w-3/4" style={{ background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Revenue Trend (2026)</h3>
          <p className="text-xs text-slate-400 mb-4">Monthly revenue in CAD</p>
          <RevenueAreaChart />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Enrollments & Orders</h3>
          <p className="text-xs text-slate-400 mb-4">Students vs orders per month</p>
          <EnrollmentsBarChart />
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Month", "Revenue", "Orders", "New Students", "Avg. Order"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {monthlyRevenue.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{m.month} 2026</td>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#1B2E5E" }}>
                    ${m.revenue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{m.orders}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{m.students}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    ${Math.round(m.revenue / m.orders).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Revenue Share */}
      <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue by Course</h3>
        <div className="space-y-3">
          {[...courses].sort((a, b) => b.revenue - a.revenue).map((c) => {
            const totalCourseRev = courses.reduce((s, x) => s + x.revenue, 0);
            const pct = Math.round((c.revenue / totalCourseRev) * 100);
            return (
              <div key={c.id} className="flex items-center gap-4">
                <span className="text-xs font-semibold w-16 shrink-0" style={{ color: c.color }}>{c.shortName}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right shrink-0">{pct}%</span>
                <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">
                  ${(c.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
