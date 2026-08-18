import ordersRaw    from "./orders-data.json";
import studentsRaw  from "./students-data.json";
import monthlyRaw   from "./monthly-data.json";
import courseStatsRaw from "./course-stats.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Course = {
  id: string;
  name: string;
  shortName: string;
  price: number;
  sold: number;
  revenue: number;
  active: number;
  color: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  courses: string[];
  enrolledAt: string;
  status: "active" | "completed" | "inactive";
  examDate: string | null;
  country: string;
};

export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  phone: string;
};

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: "success" | "failed" | "pending";
  gateway: string;
  method: string;
  note?: string;
};

export type InstallmentPlan = {
  method: "installment" | "deposit";
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number;
  nextDueDate: string | null;
  overdueDays: number;
};

export type Order = {
  id: string;
  orderId: string;
  student: string;
  email: string;
  phone: string;
  course: string;
  productName?: string;   // full WooCommerce product name (incl. variation), e.g. "AFK Comprehensive - Feb 2027"
  variation?: string;     // derived tier, e.g. "Comprehensive", "Extended", "Full Package"
  amount: number;
  paidAmount: number;
  paymentType: "full" | "partial";
  installmentPlan?: InstallmentPlan;
  status: "completed" | "processing" | "refunded" | "pending";
  date: string;
  billingAddress: Address;
  shippingAddress?: Address;
  transactions: Transaction[];
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
  orders: number;
  students: number;
};

// ── Data from JSON ────────────────────────────────────────────────────────────

export const orders: Order[]          = ordersRaw  as unknown as Order[];
export const students: Student[]      = studentsRaw as unknown as Student[];
export const monthlyRevenue: MonthlyRevenue[] = monthlyRaw as MonthlyRevenue[];

// Last 24 months for charts (keeps X-axis readable)
export const recentMonthlyRevenue: MonthlyRevenue[] = monthlyRevenue.slice(-24);

// ── Courses ───────────────────────────────────────────────────────────────────

const cs = courseStatsRaw.courseStats as Record<string, { sold: number; revenue: number; active: number }>;

export const courses: Course[] = [
  { id:"afk",       name:"Assessment of Fundamental Knowledge (AFK)", shortName:"AFK",       price:500,  sold:cs.AFK?.sold??0,      revenue:Math.round(cs.AFK?.revenue??0),      active:cs.AFK?.active??0,      color:"#1B2E5E" },
  { id:"acj",       name:"Assessment of Clinical Judgement (ACJ)",     shortName:"ACJ",       price:800,  sold:cs.ACJ?.sold??0,      revenue:Math.round(cs.ACJ?.revenue??0),      active:cs.ACJ?.active??0,      color:"#2E4A97" },
  { id:"ndecc",     name:"NDECC Clinical Skills & Situational Judgement", shortName:"NDECC",  price:1200, sold:cs.NDECC?.sold??0,    revenue:Math.round(cs.NDECC?.revenue??0),    active:cs.NDECC?.active??0,    color:"#0D9488" },
  { id:"osce",      name:"Virtual OSCE Preparation",                    shortName:"OSCE",     price:600,  sold:cs.OSCE?.sold??0,     revenue:Math.round(cs.OSCE?.revenue??0),     active:cs.OSCE?.active??0,     color:"#4C6EC4" },
  { id:"adat",      name:"Advanced Dental Admission Test (ADAT)",       shortName:"ADAT",     price:700,  sold:cs.ADAT?.sold??0,     revenue:Math.round(cs.ADAT?.revenue??0),     active:cs.ADAT?.active??0,     color:"#F59E0B" },
  { id:"interview", name:"University Interview Coaching",               shortName:"Interview", price:400,  sold:cs.Interview?.sold??0,revenue:Math.round(cs.Interview?.revenue??0),active:cs.Interview?.active??0,color:"#6366F1" },
];

// ── Summary Stats ─────────────────────────────────────────────────────────────

export const stats = courseStatsRaw.stats;
