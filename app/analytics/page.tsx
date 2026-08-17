import { RevenueAreaChart, EnrollmentsBarChart } from "@/components/RevenueChart";
import { courses, monthlyRevenue, recentMonthlyRevenue } from "@/lib/data";

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M CAD`;
  return `$${(n / 1000).toFixed(0)}k CAD`;
}

export default function AnalyticsPage() {
  // YTD = 2026 months only
  const ytdMonths   = monthlyRevenue.filter(m => m.month.includes("'26"));
  const totalRevenue = ytdMonths.reduce((s, m) => s + m.revenue, 0);
  const totalOrders  = ytdMonths.reduce((s, m) => s + m.orders, 0);
  const totalNew     = ytdMonths.reduce((s, m) => s + m.students, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "YTD Revenue",       value: fmtRevenue(totalRevenue), color: "#1B2E5E" },
          { label: "YTD Orders",        value: totalOrders.toLocaleString(), color: "#0D9488" },
          { label: "New Students YTD",  value: totalNew.toLocaleString(), color: "#F59E0B" },
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
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Last 24 months · CAD</p>
          <RevenueAreaChart data={recentMonthlyRevenue} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Enrollments & Orders</h3>
          <p className="text-xs text-slate-400 mb-4">Students vs orders · last 24 months</p>
          <EnrollmentsBarChart data={recentMonthlyRevenue} />
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">Monthly Breakdown — All Time</h3>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: "#F8FAFC" }}>
              <tr>
                {["Month", "Revenue", "Orders", "New Students", "Avg. Order"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {[...monthlyRevenue].reverse().map((m) => (
                <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{m.month}</td>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#1B2E5E" }}>
                    ${m.revenue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{m.orders}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{m.students}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    ${Math.round(m.revenue / (m.orders || 1)).toLocaleString()}
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
                <span className="text-xs font-semibold text-slate-700 w-24 text-right shrink-0">
                  {fmtRevenue(c.revenue).replace(' CAD','')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
