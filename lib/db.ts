// Real data layer — reads from Supabase (synced from WooCommerce) and returns the
// same shapes the pages used to get from lib/data.ts (mock). All server-side.
import { supaSelect } from "@/lib/supa";
import type {
  Order, Student, Course, MonthlyRevenue, Address, Transaction, InstallmentPlan,
} from "@/lib/data";

const num = (v: any) => (v == null || v === "" ? 0 : Number(v));

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Toronto" });
}
function monthKey(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", timeZone: "America/Toronto" }) + " '" +
    String(dt.getFullYear()).slice(2);
}
function daysOverdue(due: string | null): number {
  if (!due) return 0;
  const MS = 86400000;
  const d = new Date(due + "T00:00:00-04:00").getTime();
  const now = Date.now();
  return d < now ? Math.floor((now - d) / MS) : 0;
}

// Course family + tier derived from the WooCommerce product name.
function courseFamily(name = ""): string {
  const n = name.toLowerCase();
  if (n.includes("afk")) return "AFK";
  if (n.includes("acj")) return "ACJ";
  if (n.includes("ndecc")) return "NDECC";
  if (n.includes("osce")) return "OSCE";
  if (n.includes("adat")) return "ADAT";
  if (n.includes("orthodont")) return "Ortho";
  if (n.includes("interview")) return "Interview";
  return name.split(/[\s–-]/)[0] || "Other";
}
function courseTier(name = ""): string {
  const n = name.toLowerCase();
  if (n.includes("comprehensive")) return "Comprehensive";
  if (n.includes("extended")) return "Extended";
  if (n.includes("full package")) return "Full Package";
  if (n.includes("mock")) return "Mock Exam";
  if (n.includes("crash")) return "Crash";
  return "Standard";
}

function parseAddress(str: string | null, name: string, phone: string): Address {
  // raw.billing_address is a comma-joined string "line1, line2, city, PROV postal, country"
  const parts = (str || "").split(",").map((s) => s.trim()).filter(Boolean);
  const country = parts.length ? parts[parts.length - 1] : "";
  return {
    name,
    line1: parts[0] || "",
    line2: parts.length > 4 ? parts[1] : undefined,
    city: parts.length >= 3 ? parts[parts.length - 3] : "",
    province: parts.length >= 2 ? (parts[parts.length - 2].split(" ")[0] || "") : "",
    postal: parts.length >= 2 ? parts[parts.length - 2].split(" ").slice(1).join(" ") : "",
    country,
    phone,
  };
}

const ORDER_SELECT =
  "id,order_number,status,total_amount,total_tax,date_created,raw," +
  "customers(first_name,last_name,email,phone)," +
  "order_line_items(name,total)," +
  "order_installments(sequence,kind,label,wc_payment_id,due_date,amount,status,payment_method,paid_at,stripe_payment_link_url,stripe_payment_link_id)";

type Row = any;

function mapOrder(o: Row): Order {
  const cust = o.customers || {};
  const name = `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || "—";
  const insts = (o.order_installments || []).slice().sort((a: Row, b: Row) => a.sequence - b.sequence);
  const productName = o.order_line_items?.[0]?.name || "—";
  const family = courseFamily(productName);
  const tier = courseTier(productName);

  const paidInsts = insts.filter((i: Row) => i.status === "paid");
  const dueInsts = insts.filter((i: Row) => i.status === "pending" || i.status === "failed");
  const paidAmount = o.raw?.payments?.amount_paid_to_date != null
    ? num(o.raw.payments.amount_paid_to_date)
    : paidInsts.reduce((s: number, i: Row) => s + num(i.amount), 0);

  const hasPlan = insts.length > 1;
  let installmentPlan: InstallmentPlan | undefined;
  if (hasPlan) {
    const nonDeposit = insts.filter((i: Row) => i.kind !== "deposit");
    const nextDue = dueInsts.slice().sort((a: Row, b: Row) =>
      String(a.due_date).localeCompare(String(b.due_date)))[0];
    installmentPlan = {
      method: insts.some((i: Row) => i.kind === "deposit") ? "deposit" : "installment",
      totalInstallments: insts.length,
      paidInstallments: paidInsts.length,
      installmentAmount: num(nonDeposit[0]?.amount ?? insts[0]?.amount),
      nextDueDate: nextDue?.due_date ? fmtDate(nextDue.due_date) : null,
      overdueDays: nextDue ? daysOverdue(nextDue.due_date) : 0,
    };
  }

  const statusMap: Record<string, Order["status"]> = {
    completed: "completed", processing: "processing", "on-hold": "processing",
    refunded: "refunded", cancelled: "refunded", failed: "pending", pending: "pending",
  };
  const status = statusMap[o.status] || "processing";

  const transactions: Transaction[] = insts.map((i: Row): Transaction => ({
    id: i.wc_payment_id || `${o.order_number}-${i.sequence}`,
    date: fmtDate(i.paid_at ? i.paid_at.slice(0, 10) : i.due_date),
    amount: num(i.amount),
    status: i.status === "paid" ? "success" : i.status === "failed" ? "failed" : "pending",
    gateway: i.stripe_payment_link_url ? "Stripe" : (i.payment_method || "WooCommerce"),
    method: i.label || (i.kind === "deposit" ? "Deposit" : `Installment ${i.sequence}`),
    note:
      i.status === "failed" ? "Payment failed — re-collect via Stripe link" :
      i.status === "pending" && i.stripe_payment_link_url ? "Payment link ready" :
      i.status === "pending" ? "Awaiting payment link" : undefined,
  }));

  return {
    id: o.id,
    orderId: `#${o.order_number}`,
    student: name,
    email: cust.email || "",
    phone: cust.phone || "",
    course: family,
    productName,
    variation: tier,
    amount: num(o.total_amount),
    paidAmount,
    paymentType: hasPlan ? "partial" : "full",
    installmentPlan,
    status,
    date: fmtDate(o.date_created),
    billingAddress: parseAddress(o.raw?.billing_address ?? null, name, cust.phone || ""),
    shippingAddress: o.raw?.shipping_address
      ? parseAddress(o.raw.shipping_address, name, cust.phone || "")
      : undefined,
    transactions,
  };
}

// Cache within a single request/render to avoid re-fetching across functions.
let _cache: { orders: Order[]; at: number } | null = null;
async function fetchOrders(): Promise<Order[]> {
  if (_cache && Date.now() - _cache.at < 3000) return _cache.orders;
  const rows: Row[] = await supaSelect("orders", { select: ORDER_SELECT, order: "date_created.desc", limit: "1000" });
  const orders = (rows || []).map(mapOrder);
  _cache = { orders, at: Date.now() };
  return orders;
}

export async function getOrders(): Promise<Order[]> {
  return fetchOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  const rows: Row[] = await supaSelect("orders", { select: ORDER_SELECT, id: `eq.${id}`, limit: "1" });
  return rows?.[0] ? mapOrder(rows[0]) : null;
}

// ── Full student roster (from the customers table — 35k+ rows, DB-paginated) ──
function mapCustomer(c: any): Student {
  const name = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email;
  return {
    id: String(c.wc_customer_id),
    name,
    email: c.email,
    courses: [], // filled once orders are imported
    enrolledAt: fmtDate(c.date_created),
    status: c.is_paying_customer ? "active" : "inactive",
    examDate: null,
    country: c.raw?.country || "—",
  };
}

// Only real students = paying customers (WooCommerce has ~32k junk/bot signups we exclude).
export async function getStudentsPage(page: number, perPage = 50): Promise<{ students: Student[]; total: number }> {
  const offset = (Math.max(1, page) - 1) * perPage;
  const [rows, countRes] = await Promise.all([
    supaSelect("customers", {
      is_paying_customer: "eq.true",
      select: "wc_customer_id,first_name,last_name,email,phone,is_paying_customer,date_created,raw",
      order: "date_created.desc.nullslast",
      limit: String(perPage),
      offset: String(offset),
    }),
    supaSelect("customers", { select: "count", is_paying_customer: "eq.true" }),
  ]);
  const total = Number(countRes?.[0]?.count ?? 0);
  return { students: (rows || []).map(mapCustomer), total };
}

export async function getStudentStats(): Promise<{ total: number; active: number; inactive: number; completed: number }> {
  const paying = await supaSelect("customers", { select: "count", is_paying_customer: "eq.true" });
  const total = Number(paying?.[0]?.count ?? 0);
  return { total, active: total, inactive: 0, completed: 0 };
}

export async function getStudents(): Promise<Student[]> {
  const orders = await fetchOrders();
  const byEmail = new Map<string, Order[]>();
  for (const o of orders) {
    if (!o.email) continue;
    (byEmail.get(o.email) ?? byEmail.set(o.email, []).get(o.email)!).push(o);
  }
  const students: Student[] = [];
  for (const [email, os] of byEmail) {
    const courses = [...new Set(os.map((o) => o.course))];
    const enrolledAt = os.map((o) => o.date).sort()[os.length - 1] || os[0].date;
    const anyRefunded = os.every((o) => o.status === "refunded");
    const allPaid = os.every((o) => o.paidAmount >= o.amount - 0.01);
    const status: Student["status"] = anyRefunded ? "inactive" : allPaid ? "completed" : "active";
    const country = os[0].billingAddress?.country || "—";
    students.push({
      id: email, name: os[0].student, email, courses,
      enrolledAt, status, examDate: null, country,
    });
  }
  return students.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStats() {
  const [orders, custStats] = await Promise.all([fetchOrders(), getStudentStats()]);
  const collected = orders.reduce((s, o) => s + o.paidAmount, 0);
  const contracted = orders.reduce((s, o) => s + o.amount, 0);
  const fullyPaid = orders.filter((o) => o.paidAmount >= o.amount - 0.01).length;
  const now = new Date();
  const newThisMonth = orders.filter((o) => {
    const d = new Date(o.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  return {
    totalRevenue: Math.round(collected),
    totalStudents: custStats.total,
    activeStudents: custStats.active,
    newThisMonth,
    totalOrders: orders.length,
    avgOrderValue: orders.length ? Math.round(contracted / orders.length) : 0,
    completionRate: orders.length ? Math.round((fullyPaid / orders.length) * 100) : 0,
    satisfactionRate: contracted ? Math.round((collected / contracted) * 100) : 0,
  };
}

const COURSE_DEFS: Omit<Course, "sold" | "revenue" | "active">[] = [
  { id: "afk", name: "Assessment of Fundamental Knowledge (AFK)", shortName: "AFK", price: 4999, color: "#1B2E5E" },
  { id: "acj", name: "Assessment of Clinical Judgement (ACJ)", shortName: "ACJ", price: 800, color: "#2E4A97" },
  { id: "ndecc", name: "NDECC Clinical Skills & Situational Judgement", shortName: "NDECC", price: 1200, color: "#0D9488" },
  { id: "osce", name: "Virtual OSCE Preparation", shortName: "OSCE", price: 600, color: "#4C6EC4" },
  { id: "adat", name: "Advanced Dental Admission Test (ADAT)", shortName: "ADAT", price: 700, color: "#F59E0B" },
  { id: "ortho", name: "Orthodontics & Clear Aligners", shortName: "Ortho", price: 349, color: "#6366F1" },
];

export async function getCourses(): Promise<Course[]> {
  const orders = await fetchOrders();
  return COURSE_DEFS.map((def) => {
    const fam = orders.filter((o) => o.course === def.shortName);
    return {
      ...def,
      sold: fam.length,
      revenue: Math.round(fam.reduce((s, o) => s + o.paidAmount, 0)),
      active: fam.filter((o) => o.status !== "refunded" && o.paidAmount < o.amount - 0.01).length,
    };
  });
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const orders = await fetchOrders();
  const map = new Map<string, { revenue: number; orders: number; students: Set<string>; sort: number }>();
  for (const o of orders) {
    const dt = new Date(o.date);
    if (isNaN(dt.getTime())) continue;
    const key = monthKey(o.date);
    const sort = dt.getFullYear() * 12 + dt.getMonth();
    const e = map.get(key) ?? { revenue: 0, orders: 0, students: new Set<string>(), sort };
    e.revenue += o.amount;
    e.orders += 1;
    if (o.email) e.students.add(o.email);
    map.set(key, e);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([month, e]) => ({ month, revenue: Math.round(e.revenue), orders: e.orders, students: e.students.size }));
}
