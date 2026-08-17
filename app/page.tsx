import {
  DollarSign, Users, ShoppingCart, TrendingUp,
  Star, BookOpen, CheckCircle, Clock,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { RevenueAreaChart, EnrollmentsBarChart } from "@/components/RevenueChart";
import { stats, orders, courses, recentMonthlyRevenue } from "@/lib/data";

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  completed:  { bg: "#DCFCE7", color: "#15803D", label: "Completed"  },
  processing: { bg: "#DBEAFE", color: "#1D4ED8", label: "Processing" },
  refunded:   { bg: "#FEE2E2", color: "#DC2626", label: "Refunded"   },
  pending:    { bg: "#FEF3C7", color: "#B45309", label: "Pending"    },
};

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}k`;
}

export default function DashboardPage() {
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0F1D3E 0%, #1B2E5E 50%, #2E4A97 100%)" }}
      >
        <div>
          <p className="text-blue-300 text-xs font-medium uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h2 className="text-white text-xl font-bold">ConfiDentist Admin</h2>
          <p className="text-blue-200 text-sm mt-1">
            {stats.newThisMonth} new enrollments this month · {stats.activeStudents} active students
          </p>
        </div>
        <div className="hidden md:flex items-center gap-6 text-center">
          <div>
            <p className="text-white text-2xl font-bold">{stats.satisfactionRate}%</p>
            <p className="text-blue-300 text-xs">Satisfaction</p>
          </div>
          <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div>
            <p className="text-white text-2xl font-bold">{stats.completionRate}%</p>
            <p className="text-blue-300 text-xs">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={fmtRevenue(stats.totalRevenue)}
          sub="CAD — all time"
          icon={DollarSign}
          trend="up"
          trendValue="12.4%"
          accent="#1B2E5E"
        />
        <MetricCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          sub={`${stats.activeStudents} active`}
          icon={Users}
          trend="up"
          trendValue="8.1%"
          accent="#2E4A97"
        />
        <MetricCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          sub={`Avg. $${stats.avgOrderValue.toLocaleString()} per order`}
          icon={ShoppingCart}
          trend="up"
          trendValue="5.3%"
          accent="#0D9488"
        />
        <MetricCard
          title="New Enrollments"
          value={stats.newThisMonth.toString()}
          sub="This month"
          icon={TrendingUp}
          trend="up"
          trendValue="18.2%"
          accent="#F59E0B"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Monthly Revenue</h3>
              <p className="text-xs text-slate-400">Last 24 months</p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#E8EDF8", color: "#1B2E5E" }}
            >
              All time
            </span>
          </div>
          <RevenueAreaChart data={recentMonthlyRevenue} />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Students & Orders</h3>
              <p className="text-xs text-slate-400">Last 24 months</p>
            </div>
          </div>
          <EnrollmentsBarChart data={recentMonthlyRevenue} />
        </div>
      </div>

      {/* Course Performance + Recent Orders */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Course Performance */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Course Performance</h3>
          <div className="space-y-4">
            {courses.map((c) => {
              const maxSold = Math.max(...courses.map(x => x.sold));
              const pct = Math.round((c.sold / maxSold) * 100);
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: c.color }}
                      />
                      <span className="text-xs font-medium text-slate-700">{c.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{c.sold.toLocaleString()} sold</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {fmtRevenue(c.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
            <h3 className="text-sm font-semibold text-slate-700">Recent Orders</h3>
            <a href="/orders" className="text-xs font-medium" style={{ color: "#1B2E5E" }}>
              View all →
            </a>
          </div>
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {recentOrders.map((order) => {
              const s = statusStyles[order.status];
              return (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#1B2E5E" }}
                    >
                      {order.student.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{order.student}</p>
                      <p className="text-xs text-slate-400 truncate">{order.course}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:block"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ${order.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Courses Offered",  value: "6",                          icon: BookOpen,    color: "#2E4A97" },
          { label: "Avg. Satisfaction",       value: `${stats.satisfactionRate}%`, icon: Star,        color: "#F59E0B" },
          { label: "Order Completion Rate",   value: `${stats.completionRate}%`,   icon: CheckCircle, color: "#0D9488" },
          { label: "Avg. Order Value",        value: `$${stats.avgOrderValue.toLocaleString()}`, icon: Clock, color: "#6366F1" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4" style={{ borderColor: "#E2E8F0" }}>
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
    </div>
  );
}
