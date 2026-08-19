import { orders } from "./data";
import type { Order } from "./data";

// ── Sales tax by Canadian province/territory ────────────────────────────────
// Order `amount` is treated as tax-inclusive (gross), so we back the tax out
// per order using the rate for its billing province to get the net (tax-excl.)
// revenue. Rates are the combined GST/HST/PST charged in each jurisdiction.
export const PROVINCE_TAX_RATES: Record<string, number> = {
  ON: 0.13,     // HST
  NB: 0.15,     // HST
  NL: 0.15,     // HST
  NS: 0.15,     // HST (note: reduced to 14% on 2025-04-01)
  PE: 0.15,     // HST
  BC: 0.12,     // 5% GST + 7% PST
  MB: 0.12,     // 5% GST + 7% RST
  SK: 0.11,     // 5% GST + 6% PST
  QC: 0.14975,  // 5% GST + 9.975% QST
  AB: 0.05,     // GST only
  NT: 0.05,     // GST only
  NU: 0.05,     // GST only
  YT: 0.05,     // GST only
};

// Canadian order with an unrecognised province still owes federal GST.
export const DEFAULT_CANADIAN_RATE = 0.05;
// Non-Canadian (export) sales are zero-rated — no Canadian sales tax.
export const EXPORT_TAX_RATE = 0;

const PROVINCE_NAMES: Record<string, string> = {
  ON: "Ontario", QC: "Quebec", BC: "British Columbia", AB: "Alberta",
  MB: "Manitoba", SK: "Saskatchewan", NS: "Nova Scotia", NB: "New Brunswick",
  NL: "Newfoundland & Labrador", PE: "Prince Edward Island",
  NT: "Northwest Territories", NU: "Nunavut", YT: "Yukon",
};

/** The sales-tax rate that applies to a single order, based on billing region. */
export function taxRateForOrder(order: Order): number {
  const province = (order.billingAddress?.province ?? "").trim().toUpperCase();
  if (province in PROVINCE_TAX_RATES) return PROVINCE_TAX_RATES[province];

  const country = (order.billingAddress?.country ?? "").trim().toLowerCase();
  if (country === "canada" || country === "ca") return DEFAULT_CANADIAN_RATE;
  return EXPORT_TAX_RATE;
}

/** A short label for the tax jurisdiction an order belongs to. */
export function jurisdictionForOrder(order: Order): { code: string; name: string; rate: number } {
  const province = (order.billingAddress?.province ?? "").trim().toUpperCase();
  const rate = taxRateForOrder(order);
  if (province in PROVINCE_TAX_RATES) {
    return { code: province, name: PROVINCE_NAMES[province] ?? province, rate };
  }
  if (rate === DEFAULT_CANADIAN_RATE) return { code: "CA", name: "Canada (other)", rate };
  return { code: "INTL", name: "International (export)", rate };
}

export type CourseBreakdown = {
  course: string;
  orders: number;
  gross: number; // incl. tax
  net: number;   // excl. tax
  tax: number;
};

export type ProvinceBreakdown = {
  code: string;
  name: string;
  rate: number;
  orders: number;
  gross: number;
  net: number;
  tax: number;
};

export type DayBreakdown = {
  day: string;   // "01" … "31"
  orders: number;
  gross: number;
};

export type MonthlyReport = {
  month: string;        // "YYYY-MM"
  label: string;        // "August 2026"
  totalOrders: number;
  refundedOrders: number;
  grossIncl: number;    // revenue including tax
  netExcl: number;      // revenue excluding tax
  tax: number;          // tax collected
  courses: CourseBreakdown[];
  provinces: ProvinceBreakdown[];
  days: DayBreakdown[];
};

/** Split one order's tax-inclusive amount into net + tax using its own rate. */
export function splitOrderTax(order: Order) {
  const rate = taxRateForOrder(order);
  const net = order.amount / (1 + rate);
  return { rate, net, tax: order.amount - net };
}

function sumTax(os: Order[]) {
  let gross = 0, net = 0, tax = 0;
  for (const o of os) {
    const s = splitOrderTax(o);
    gross += o.amount;
    net += s.net;
    tax += s.tax;
  }
  return { gross, net, tax };
}

/** All months that have at least one order, newest first: [{ value, label }]. */
export function availableMonths(): { value: string; label: string }[] {
  const seen = new Set<string>();
  for (const o of orders) {
    if (o.date) seen.add(o.date.slice(0, 7));
  }
  return [...seen]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: monthLabel(value) }));
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
}

/** Build the accountant report for a given "YYYY-MM". */
export function buildMonthlyReport(month: string): MonthlyReport {
  const inMonth = orders.filter((o) => o.date && o.date.startsWith(month));

  // Refunded orders don't count toward collected revenue.
  const revenueOrders = inMonth.filter((o) => o.status !== "refunded");
  const refundedOrders = inMonth.length - revenueOrders.length;

  const totals = sumTax(revenueOrders);

  // Per-course breakdown
  const courses: CourseBreakdown[] = groupBy(revenueOrders, (o) => o.course)
    .map(([course, os]) => {
      const t = sumTax(os);
      return { course, orders: os.length, ...t };
    })
    .sort((a, b) => b.gross - a.gross);

  // Per-jurisdiction (province) breakdown — one row per applicable tax rate
  const provinces: ProvinceBreakdown[] = groupBy(revenueOrders, (o) => jurisdictionForOrder(o).code)
    .map(([code, os]) => {
      const j = jurisdictionForOrder(os[0]);
      const t = sumTax(os);
      return { code, name: j.name, rate: j.rate, orders: os.length, ...t };
    })
    .sort((a, b) => b.gross - a.gross);

  // Per-day breakdown (for the orders trend)
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const days: DayBreakdown[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const os = revenueOrders.filter((o) => o.date.slice(8, 10) === day);
    return { day, orders: os.length, gross: sum(os, (o) => o.amount) };
  });

  return {
    month,
    label: monthLabel(month),
    totalOrders: revenueOrders.length,
    refundedOrders,
    grossIncl: totals.gross,
    netExcl: totals.net,
    tax: totals.tax,
    courses,
    provinces,
    days,
  };
}

function groupBy<T>(arr: T[], key: (x: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const x of arr) {
    const k = key(x);
    const a = map.get(k) ?? [];
    a.push(x);
    map.set(k, a);
  }
  return [...map.entries()];
}

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((s, x) => s + pick(x), 0);
}
