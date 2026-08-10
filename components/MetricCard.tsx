import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: string;
}

export default function MetricCard({
  title, value, sub, icon: Icon, trend, trendValue, accent = "#1B2E5E"
}: Props) {
  const trendColor = trend === "up" ? "#10B981" : trend === "down" ? "#EF4444" : "#94A3B8";
  const trendBg   = trend === "up" ? "#DCFCE7"  : trend === "down" ? "#FEE2E2"  : "#F1F5F9";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border" style={{ borderColor: "#E2E8F0" }}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trendValue && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: trendBg, color: trendColor }}
          >
            {trendArrow} {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
