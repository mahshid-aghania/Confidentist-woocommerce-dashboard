"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { MonthlyReport } from "@/lib/report";

function money(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

/** The headline chart: Total gross (incl. tax), Net (excl. tax) and Tax collected. */
export function TaxBreakdownChart({ report }: { report: MonthlyReport }) {
  const data = [
    { name: "Incl. Tax", value: report.grossIncl, fill: "#1B2E5E" },
    { name: "Excl. Tax", value: report.netExcl, fill: "#0D9488" },
    { name: "Tax (HST)", value: report.tax, fill: "#F59E0B" },
  ];

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={money} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          cursor={{ fill: "#F8FAFC" }}
          formatter={(v: number) => [`$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`, ""]}
          contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={90} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
          <LabelList dataKey="value" position="top" formatter={money} style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Small bar chart showing orders per day across the month. */
export function OrdersTrendChart({ report }: { report: MonthlyReport }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={report.days} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#F8FAFC" }}
          formatter={(v: number) => [`${v} orders`, ""]}
          labelFormatter={(d: string) => `Day ${d}`}
          contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
        />
        <Bar dataKey="orders" fill="#4C6EC4" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
