"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie,
} from "recharts";

function k(v: number) {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${v}`;
}
const money = (v: number) => `$${v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tooltipStyle = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12, boxShadow: "0 8px 24px rgba(15,29,62,0.08)" } as const;

export type MonthPoint = { month: string; scheduled: number; overdue: number };
export type AgingPoint = { bucket: string; amount: number; people: number };
export type SplitPoint = { name: string; value: number; color: string };

export function MonthlyCollections({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={248}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap={data.length > 8 ? "18%" : "32%"}>
        <defs>
          <linearGradient id="gScheduled" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B5BA9" />
            <stop offset="100%" stopColor="#2E4A97" />
          </linearGradient>
          <linearGradient id="gOverdue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F26A6A" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={0} />
        <YAxis tickFormatter={k} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          cursor={{ fill: "rgba(46,74,151,0.05)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number, n) => [money(v), n === "overdue" ? "Overdue" : "Scheduled"]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        <Bar name="Overdue" dataKey="overdue" stackId="a" fill="url(#gOverdue)" radius={[0, 0, 0, 0]} maxBarSize={46} />
        <Bar name="Scheduled" dataKey="scheduled" stackId="a" fill="url(#gScheduled)" radius={[5, 5, 0, 0]} maxBarSize={46} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SplitDonut({ data, centerLabel, centerValue }: { data: SplitPoint[]; centerLabel: string; centerValue: string }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [money(v), n as string]} />
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-bold text-slate-800 leading-none">{centerValue}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{centerLabel}</span>
      </div>
    </div>
  );
}

export function OverdueAging({ data }: { data: AgingPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  const tone = ["#F59E0B", "#F97316", "#EF4444", "#B91C1C"];
  return (
    <div className="space-y-3 pt-1">
      {data.map((d, i) => (
        <div key={d.bucket}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-600">{d.bucket}</span>
            <span className="text-slate-400">
              {d.people} {d.people === 1 ? "person" : "people"} · <span className="font-semibold text-slate-700">{money(d.amount)}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(d.amount > 0 ? 6 : 0, (d.amount / max) * 100)}%`, background: tone[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
