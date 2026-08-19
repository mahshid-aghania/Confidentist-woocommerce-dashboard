"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Printer, ArrowLeft, ShoppingCart, DollarSign,
  Receipt, Landmark, GraduationCap, FileText,
} from "lucide-react";
import { availableMonths, buildMonthlyReport } from "@/lib/report";
import { TaxBreakdownChart, OrdersTrendChart } from "@/components/ReportCharts";

const cad = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ReportBody() {
  const params = useSearchParams();
  const months = availableMonths();
  const month = params.get("month") || months[0]?.value || "";
  const report = useMemo(() => (month ? buildMonthlyReport(month) : null), [month]);

  const generatedOn = new Date().toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  if (!report) {
    return <p className="text-sm text-slate-500">No data available for this month.</p>;
  }

  const kpis = [
    { label: "Total Orders", value: report.totalOrders.toLocaleString(), icon: ShoppingCart, color: "#4C6EC4", sub: report.refundedOrders ? `${report.refundedOrders} refunded (excluded)` : "all paid orders" },
    { label: "Revenue Incl. Tax", value: `$${cad(report.grossIncl)}`, icon: DollarSign, color: "#1B2E5E", sub: "gross collected" },
    { label: "Revenue Excl. Tax", value: `$${cad(report.netExcl)}`, icon: Receipt, color: "#0D9488", sub: "net of HST" },
    { label: "Tax Collected", value: `$${cad(report.tax)}`, icon: Landmark, color: "#F59E0B", sub: "HST 13%" },
  ];

  return (
    <div className="mx-auto" style={{ maxWidth: 820 }}>
      {/* Toolbar — hidden when printing */}
      <div className="print-hide flex items-center justify-between mb-5 flex-wrap gap-3">
        <Link href="/accountant" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Accountant
        </Link>
        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2" action="/accountant/report" method="get">
            <label className="text-xs font-medium text-slate-500">Month</label>
            <select
              name="month"
              defaultValue={report.month}
              onChange={(e) => { window.location.href = `/accountant/report?month=${e.target.value}`; }}
              className="text-sm border rounded-lg px-3 py-2 bg-white"
              style={{ borderColor: "#CBD5E1" }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </form>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#1B2E5E" }}
          >
            <Printer size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── The printable report sheet ─────────────────────────────── */}
      <div id="report-sheet" className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        {/* Cute gradient header */}
        <div className="px-8 py-7 text-white relative" style={{ background: "linear-gradient(135deg, #0F1D3E 0%, #1B2E5E 55%, #2E4A97 100%)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.14)" }}>
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">ConfiDentist</p>
                <p className="text-xs" style={{ color: "#B3C4EC" }}>Dental Exam Prep · Financial Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest" style={{ color: "#B3C4EC" }}>Monthly Statement</p>
              <p className="text-2xl font-bold leading-tight">{report.label}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs" style={{ color: "#B3C4EC" }}>
            <FileText size={13} />
            <span>Generated on {generatedOn} · Currency: CAD · Amounts include 13% HST unless noted</span>
          </div>
        </div>

        <div className="p-8 space-y-7">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="rounded-xl p-4 border" style={{ borderColor: "#EDF1F7", background: `${color}0A` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}1A` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Headline chart */}
          <div className="rounded-xl border p-5" style={{ borderColor: "#EDF1F7" }}>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-700">Revenue Breakdown</h2>
              <span className="text-xs text-slate-400">Included vs. excluded tax</span>
            </div>
            <TaxBreakdownChart report={report} />
          </div>

          {/* Orders trend */}
          <div className="rounded-xl border p-5" style={{ borderColor: "#EDF1F7" }}>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-700">Orders by Day</h2>
              <span className="text-xs text-slate-400">{report.totalOrders} orders this month</span>
            </div>
            <OrdersTrendChart report={report} />
          </div>

          {/* Per-course table */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#EDF1F7" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#EDF1F7", background: "#F8FAFC" }}>
              <h2 className="text-sm font-semibold text-slate-700">Breakdown by Course</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400" style={{ background: "#FCFDFE" }}>
                  <th className="px-5 py-2.5 font-medium">Course</th>
                  <th className="px-5 py-2.5 font-medium text-right">Orders</th>
                  <th className="px-5 py-2.5 font-medium text-right">Excl. Tax</th>
                  <th className="px-5 py-2.5 font-medium text-right">Tax</th>
                  <th className="px-5 py-2.5 font-medium text-right">Incl. Tax</th>
                </tr>
              </thead>
              <tbody>
                {report.courses.map((c) => (
                  <tr key={c.course} className="border-t" style={{ borderColor: "#F1F5F9" }}>
                    <td className="px-5 py-2.5 font-medium text-slate-700">{c.course}</td>
                    <td className="px-5 py-2.5 text-right text-slate-600">{c.orders}</td>
                    <td className="px-5 py-2.5 text-right text-slate-600">${cad(c.net)}</td>
                    <td className="px-5 py-2.5 text-right text-slate-600">${cad(c.tax)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-slate-800">${cad(c.gross)}</td>
                  </tr>
                ))}
                {report.courses.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-sm">No orders in this month.</td></tr>
                )}
              </tbody>
              {report.courses.length > 0 && (
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}>
                    <td className="px-5 py-3 font-bold text-slate-800">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">{report.totalOrders}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">${cad(report.netExcl)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">${cad(report.tax)}</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: "#1B2E5E" }}>${cad(report.grossIncl)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>ConfiDentist · Confidential financial statement</span>
            <span>Tax basis: HST 13% (Ontario), amounts are tax-inclusive</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading report…</p>}>
      <ReportBody />
    </Suspense>
  );
}
