import { orders } from "./data";
import type { Order } from "./data";

// Canadian HST (Ontario). Order `amount` is treated as tax-inclusive (gross),
// so we back the tax out to get the tax-excluded (net) revenue.
export const TAX_RATE = 0.13;

export type CourseBreakdown = {
  course: string;
  orders: number;
  gross: number; // incl. tax
  net: number;   // excl. tax
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
  days: DayBreakdown[];
};

/** Split a tax-inclusive gross amount into net + tax. */
export function splitTax(gross: number) {
  const net = gross / (1 + TAX_RATE);
  return { net, tax: gross - net };
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

  const grossIncl = sum(revenueOrders, (o) => o.amount);
  const { net: netExcl, tax } = splitTax(grossIncl);

  // Per-course breakdown
  const byCourse = new Map<string, Order[]>();
  for (const o of revenueOrders) {
    const arr = byCourse.get(o.course) ?? [];
    arr.push(o);
    byCourse.set(o.course, arr);
  }
  const courses: CourseBreakdown[] = [...byCourse.entries()]
    .map(([course, os]) => {
      const gross = sum(os, (o) => o.amount);
      const { net, tax: t } = splitTax(gross);
      return { course, orders: os.length, gross, net, tax: t };
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
    grossIncl,
    netExcl,
    tax,
    courses,
    days,
  };
}

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((s, x) => s + pick(x), 0);
}
