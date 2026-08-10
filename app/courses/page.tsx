import { courses } from "@/lib/data";
import { BookOpen, Users, DollarSign, TrendingUp } from "lucide-react";

export default function CoursesPage() {
  const totalRevenue = courses.reduce((s, c) => s + c.revenue, 0);
  const totalSold    = courses.reduce((s, c) => s + c.sold, 0);
  const totalActive  = courses.reduce((s, c) => s + c.active, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Courses Offered",  value: courses.length.toString(), icon: BookOpen,    color: "#1B2E5E" },
          { label: "Total Revenue",    value: `$${(totalRevenue/1000).toFixed(0)}k`, icon: DollarSign, color: "#0D9488" },
          { label: "Total Sold",       value: totalSold.toString(),       icon: TrendingUp,  color: "#2E4A97" },
          { label: "Active Students",  value: totalActive.toString(),     icon: Users,       color: "#F59E0B" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((c) => {
          const maxSold = Math.max(...courses.map(x => x.sold));
          const pct = Math.round((c.sold / maxSold) * 100);
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
              {/* Color top bar */}
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ background: c.color }}
                  >
                    {c.shortName.slice(0, 2)}
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    ${c.price.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">CAD</span>
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-700 leading-snug mb-4">{c.name}</h3>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Sold",    value: c.sold   },
                    { label: "Active",  value: c.active },
                    { label: "Revenue", value: `$${(c.revenue/1000).toFixed(0)}k` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 rounded-lg" style={{ background: "#F8FAFC" }}>
                      <p className="text-sm font-bold text-slate-700">{value}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Sales share</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
