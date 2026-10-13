import { fetchAllOrders, formatMoney, type OrdersQuery } from "@/lib/wc-orders";
import { monthToRange } from "@/lib/wc-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  // Quote if it contains comma, quote, or newline; escape embedded quotes.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// CSV export of the current filtered dataset (not just the visible page).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month") || "";
  const customer = url.searchParams.get("customer") || "";

  const q: OrdersQuery = { status: "any" };
  const range = month ? monthToRange(month) : null;
  if (range) { q.after = range.after; q.before = range.before; }
  if (customer) {
    if (/^\d+$/.test(customer)) q.customer = parseInt(customer, 10);
    else q.search = customer;
  }

  let rows;
  try {
    rows = await fetchAllOrders(q);
  } catch (e: any) {
    return new Response(`Failed to export: ${e?.message || "unknown error"}`, { status: 502 });
  }

  const header = [
    "Order", "Customer", "Customer ID", "Date", "Status", "Currency",
    "Total", "Refunded Net", "Export Status", "Origin",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        `#${r.number}`,
        r.customerName,
        r.customerId || "",
        r.dateLabel,
        r.statusLabel,
        r.currency,
        formatMoney(r.total).replace(/^\$/, ""),
        r.hasRefund ? formatMoney(r.net).replace(/^\$/, "") : "",
        r.exportStatus || "",
        r.origin,
      ].map(csvCell).join(","),
    );
  }
  const csv = "﻿" + lines.join("\r\n"); // BOM for Excel

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export-${rows.length}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
