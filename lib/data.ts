// Mock data representing ConfiDentist WooCommerce store

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

// ── Courses ──────────────────────────────────────────────────────────────────
export const courses: Course[] = [
  {
    id: "afk",
    name: "Assessment of Fundamental Knowledge (AFK)",
    shortName: "AFK",
    price: 500,
    sold: 245,
    revenue: 122500,
    active: 89,
    color: "#1B2E5E",
  },
  {
    id: "acj",
    name: "Assessment of Clinical Judgement (ACJ)",
    shortName: "ACJ",
    price: 800,
    sold: 178,
    revenue: 142400,
    active: 67,
    color: "#2E4A97",
  },
  {
    id: "ndecc",
    name: "NDECC Clinical Skills & Situational Judgement",
    shortName: "NDECC",
    price: 1200,
    sold: 134,
    revenue: 160800,
    active: 52,
    color: "#0D9488",
  },
  {
    id: "osce",
    name: "Virtual OSCE Preparation",
    shortName: "OSCE",
    price: 600,
    sold: 156,
    revenue: 93600,
    active: 74,
    color: "#4C6EC4",
  },
  {
    id: "adat",
    name: "Advanced Dental Admission Test (ADAT)",
    shortName: "ADAT",
    price: 700,
    sold: 89,
    revenue: 62300,
    active: 34,
    color: "#F59E0B",
  },
  {
    id: "interview",
    name: "University Interview Coaching",
    shortName: "Interview",
    price: 400,
    sold: 89,
    revenue: 35600,
    active: 26,
    color: "#6366F1",
  },
];

// ── Students ─────────────────────────────────────────────────────────────────
export const students: Student[] = [
  { id: "1",  name: "Aiden Khalil",     email: "aiden.k@email.com",      courses: ["AFK", "ACJ"],     enrolledAt: "2026-06-15", status: "active",    examDate: "2026-12-11", country: "🇨🇦 Canada" },
  { id: "2",  name: "Sara Mousavi",     email: "sara.m@email.com",        courses: ["NDECC"],          enrolledAt: "2026-05-22", status: "active",    examDate: "2026-01-15", country: "🇮🇷 Iran" },
  { id: "3",  name: "James Liu",        email: "james.l@email.com",       courses: ["AFK"],            enrolledAt: "2026-07-01", status: "active",    examDate: "2026-12-11", country: "🇨🇳 China" },
  { id: "4",  name: "Priya Sharma",     email: "priya.s@email.com",       courses: ["ACJ", "OSCE"],    enrolledAt: "2026-04-10", status: "completed", examDate: null,         country: "🇮🇳 India" },
  { id: "5",  name: "Mohamed Hassan",   email: "m.hassan@email.com",      courses: ["AFK", "NDECC"],   enrolledAt: "2026-06-28", status: "active",    examDate: "2026-12-11", country: "🇪🇬 Egypt" },
  { id: "6",  name: "Natalie Torres",   email: "n.torres@email.com",      courses: ["ADAT"],           enrolledAt: "2026-07-05", status: "active",    examDate: null,         country: "🇨🇦 Canada" },
  { id: "7",  name: "Yuna Kim",         email: "yuna.k@email.com",        courses: ["OSCE", "ACJ"],    enrolledAt: "2026-05-14", status: "active",    examDate: "2026-01-15", country: "🇰🇷 Korea" },
  { id: "8",  name: "David Mensah",     email: "d.mensah@email.com",      courses: ["Interview"],      enrolledAt: "2026-07-12", status: "active",    examDate: null,         country: "🇬🇭 Ghana" },
  { id: "9",  name: "Fatima Al-Rashid", email: "f.rashid@email.com",      courses: ["AFK"],            enrolledAt: "2026-06-02", status: "inactive",  examDate: null,         country: "🇸🇦 Saudi Arabia" },
  { id: "10", name: "Carlos Reyes",     email: "c.reyes@email.com",       courses: ["NDECC", "OSCE"],  enrolledAt: "2026-07-18", status: "active",    examDate: "2026-01-15", country: "🇲🇽 Mexico" },
  { id: "11", name: "Lena Fischer",     email: "lena.f@email.com",        courses: ["ACJ"],            enrolledAt: "2026-03-19", status: "completed", examDate: null,         country: "🇩🇪 Germany" },
  { id: "12", name: "Raj Patel",        email: "raj.p@email.com",         courses: ["AFK", "ACJ"],     enrolledAt: "2026-07-22", status: "active",    examDate: "2026-12-11", country: "🇮🇳 India" },
  { id: "13", name: "Nina Johansson",   email: "nina.j@email.com",        courses: ["Interview"],      enrolledAt: "2026-06-30", status: "active",    examDate: null,         country: "🇸🇪 Sweden" },
  { id: "14", name: "Omar Benali",      email: "o.benali@email.com",      courses: ["AFK", "NDECC"],   enrolledAt: "2026-05-05", status: "active",    examDate: "2026-12-11", country: "🇩🇿 Algeria" },
  { id: "15", name: "Mei Zhang",        email: "mei.z@email.com",         courses: ["OSCE"],           enrolledAt: "2026-07-25", status: "active",    examDate: "2026-01-15", country: "🇨🇳 China" },
];

// ── Orders ───────────────────────────────────────────────────────────────────
export const orders: Order[] = [
  {
    id: "1",
    orderId: "#5021",
    student: "Raj Patel",
    email: "raj.p@email.com",
    phone: "+1 (416) 555-0182",
    course: "AFK Bundle",
    amount: 1300,
    paidAmount: 867,
    paymentType: "partial",
    installmentPlan: {
      method: "installment",
      totalInstallments: 3,
      paidInstallments: 2,
      installmentAmount: 433,
      nextDueDate: "2026-08-06",
      overdueDays: 5,
    },
    status: "processing",
    date: "2026-08-09",
    billingAddress: {
      name: "Raj Patel",
      line1: "88 Bloor Street West, Apt 14",
      city: "Toronto",
      province: "ON",
      postal: "M5S 1M8",
      country: "Canada",
      phone: "+1 (416) 555-0182",
    },
    transactions: [
      { id: "txn-5021-a", date: "2026-08-09", amount: 433, status: "success",  gateway: "Stripe", method: "Visa •••• 4242", note: "Installment 1 of 3" },
      { id: "txn-5021-b", date: "2026-07-09", amount: 433, status: "success",  gateway: "Stripe", method: "Visa •••• 4242", note: "Installment 2 of 3" },
      { id: "txn-5021-c", date: "2026-08-06", amount: 434, status: "pending",  gateway: "Stripe", method: "Visa •••• 4242", note: "Installment 3 of 3 — OVERDUE" },
    ],
  },
  {
    id: "2",
    orderId: "#5020",
    student: "Mei Zhang",
    email: "mei.z@email.com",
    phone: "+1 (604) 555-0934",
    course: "OSCE",
    amount: 600,
    paidAmount: 0,
    paymentType: "full",
    status: "processing",
    date: "2026-08-09",
    billingAddress: {
      name: "Mei Zhang",
      line1: "345 Robson Street",
      city: "Vancouver",
      province: "BC",
      postal: "V6B 1Z6",
      country: "Canada",
      phone: "+1 (604) 555-0934",
    },
    transactions: [
      { id: "txn-5020-a", date: "2026-08-09", amount: 600, status: "failed",  gateway: "Stripe", method: "Mastercard •••• 8831", note: "Card declined — insufficient funds" },
      { id: "txn-5020-b", date: "2026-08-09", amount: 600, status: "pending", gateway: "Stripe", method: "Mastercard •••• 8831", note: "Retry attempt queued" },
    ],
  },
  {
    id: "3",
    orderId: "#5019",
    student: "Nina Johansson",
    email: "nina.j@email.com",
    phone: "+46 70 555 1234",
    course: "Interview",
    amount: 400,
    paidAmount: 400,
    paymentType: "full",
    status: "completed",
    date: "2026-08-08",
    billingAddress: {
      name: "Nina Johansson",
      line1: "Götgatan 12",
      city: "Stockholm",
      province: "Stockholm County",
      postal: "116 21",
      country: "Sweden",
      phone: "+46 70 555 1234",
    },
    transactions: [
      { id: "txn-5019-a", date: "2026-08-08", amount: 400, status: "success", gateway: "Stripe", method: "Visa •••• 7701", note: "Full payment" },
    ],
  },
  {
    id: "4",
    orderId: "#5018",
    student: "Omar Benali",
    email: "o.benali@email.com",
    phone: "+1 (514) 555-0271",
    course: "AFK + NDECC",
    amount: 1700,
    paidAmount: 425,
    paymentType: "partial",
    installmentPlan: {
      method: "installment",
      totalInstallments: 4,
      paidInstallments: 1,
      installmentAmount: 425,
      nextDueDate: "2026-07-30",
      overdueDays: 12,
    },
    status: "processing",
    date: "2026-08-08",
    billingAddress: {
      name: "Omar Benali",
      line1: "1420 Rue Sherbrooke O",
      city: "Montreal",
      province: "QC",
      postal: "H3G 1K2",
      country: "Canada",
      phone: "+1 (514) 555-0271",
    },
    shippingAddress: {
      name: "Omar Benali",
      line1: "1420 Rue Sherbrooke O",
      city: "Montreal",
      province: "QC",
      postal: "H3G 1K2",
      country: "Canada",
      phone: "+1 (514) 555-0271",
    },
    transactions: [
      { id: "txn-5018-a", date: "2026-08-08", amount: 425, status: "success", gateway: "Stripe", method: "Visa •••• 5593", note: "Installment 1 of 4" },
      { id: "txn-5018-b", date: "2026-07-30", amount: 425, status: "failed",  gateway: "Stripe", method: "Visa •••• 5593", note: "Installment 2 of 4 — Card declined" },
      { id: "txn-5018-c", date: "2026-07-30", amount: 425, status: "failed",  gateway: "Stripe", method: "Visa •••• 5593", note: "Installment 2 of 4 — Retry failed" },
      { id: "txn-5018-d", date: "2026-08-11", amount: 425, status: "pending", gateway: "Stripe", method: "Visa •••• 5593", note: "Installment 2 of 4 — Awaiting customer action" },
    ],
  },
  {
    id: "5",
    orderId: "#5017",
    student: "Natalie Torres",
    email: "n.torres@email.com",
    phone: "+1 (780) 555-0349",
    course: "ADAT",
    amount: 700,
    paidAmount: 700,
    paymentType: "full",
    status: "completed",
    date: "2026-08-07",
    billingAddress: {
      name: "Natalie Torres",
      line1: "10225 104 Street NW",
      city: "Edmonton",
      province: "AB",
      postal: "T5J 1B1",
      country: "Canada",
      phone: "+1 (780) 555-0349",
    },
    transactions: [
      { id: "txn-5017-a", date: "2026-08-07", amount: 700, status: "success", gateway: "PayPal", method: "PayPal Balance", note: "Full payment" },
    ],
  },
  {
    id: "6",
    orderId: "#5016",
    student: "Carlos Reyes",
    email: "c.reyes@email.com",
    phone: "+52 55 5555 0198",
    course: "NDECC + OSCE",
    amount: 1800,
    paidAmount: 900,
    paymentType: "partial",
    installmentPlan: {
      method: "deposit",
      totalInstallments: 2,
      paidInstallments: 1,
      installmentAmount: 900,
      nextDueDate: "2026-08-08",
      overdueDays: 3,
    },
    status: "processing",
    date: "2026-08-07",
    billingAddress: {
      name: "Carlos Reyes",
      line1: "Insurgentes Sur 1602",
      line2: "Col. Crédito Constructor",
      city: "Mexico City",
      province: "CDMX",
      postal: "03940",
      country: "Mexico",
      phone: "+52 55 5555 0198",
    },
    transactions: [
      { id: "txn-5016-a", date: "2026-08-07", amount: 900, status: "success", gateway: "Stripe", method: "Mastercard •••• 3310", note: "Deposit — 50% upfront" },
      { id: "txn-5016-b", date: "2026-08-08", amount: 900, status: "pending", gateway: "Stripe", method: "Mastercard •••• 3310", note: "Balance payment — OVERDUE by 3 days" },
    ],
  },
  {
    id: "7",
    orderId: "#5015",
    student: "David Mensah",
    email: "d.mensah@email.com",
    phone: "+233 30 555 0127",
    course: "Interview",
    amount: 400,
    paidAmount: 400,
    paymentType: "full",
    status: "completed",
    date: "2026-08-06",
    billingAddress: {
      name: "David Mensah",
      line1: "14 Independence Ave",
      city: "Accra",
      province: "Greater Accra",
      postal: "GA-184",
      country: "Ghana",
      phone: "+233 30 555 0127",
    },
    transactions: [
      { id: "txn-5015-a", date: "2026-08-06", amount: 400, status: "success", gateway: "Stripe", method: "Visa •••• 0092", note: "Full payment" },
    ],
  },
  {
    id: "8",
    orderId: "#5014",
    student: "Yuna Kim",
    email: "yuna.k@email.com",
    phone: "+1 (613) 555-0566",
    course: "OSCE + ACJ",
    amount: 1400,
    paidAmount: 700,
    paymentType: "partial",
    installmentPlan: {
      method: "installment",
      totalInstallments: 2,
      paidInstallments: 1,
      installmentAmount: 700,
      nextDueDate: "2026-09-06",
      overdueDays: 0,
    },
    status: "processing",
    date: "2026-08-06",
    billingAddress: {
      name: "Yuna Kim",
      line1: "200 Laurier Ave W",
      city: "Ottawa",
      province: "ON",
      postal: "K1P 1J9",
      country: "Canada",
      phone: "+1 (613) 555-0566",
    },
    transactions: [
      { id: "txn-5014-a", date: "2026-08-06", amount: 700, status: "success", gateway: "Stripe", method: "Visa •••• 2288", note: "Installment 1 of 2" },
      { id: "txn-5014-b", date: "2026-09-06", amount: 700, status: "pending", gateway: "Stripe", method: "Visa •••• 2288", note: "Installment 2 of 2 — Due Sep 6" },
    ],
  },
  {
    id: "9",
    orderId: "#5013",
    student: "James Liu",
    email: "james.l@email.com",
    phone: "+1 (403) 555-0813",
    course: "AFK",
    amount: 500,
    paidAmount: 0,
    paymentType: "full",
    status: "processing",
    date: "2026-08-05",
    billingAddress: {
      name: "James Liu",
      line1: "707 5 St SW",
      city: "Calgary",
      province: "AB",
      postal: "T2P 0Y3",
      country: "Canada",
      phone: "+1 (403) 555-0813",
    },
    transactions: [
      { id: "txn-5013-a", date: "2026-08-05", amount: 500, status: "pending", gateway: "Stripe", method: "Mastercard •••• 1177", note: "Awaiting payment confirmation" },
    ],
  },
  {
    id: "10",
    orderId: "#5012",
    student: "Aiden Khalil",
    email: "aiden.k@email.com",
    phone: "+1 (416) 555-0394",
    course: "AFK + ACJ",
    amount: 1300,
    paidAmount: 1300,
    paymentType: "full",
    status: "completed",
    date: "2026-08-05",
    billingAddress: {
      name: "Aiden Khalil",
      line1: "219 Dundas Street East",
      city: "Toronto",
      province: "ON",
      postal: "M5A 2E3",
      country: "Canada",
      phone: "+1 (416) 555-0394",
    },
    transactions: [
      { id: "txn-5012-a", date: "2026-08-05", amount: 650,  status: "failed",  gateway: "Stripe", method: "Visa •••• 9910", note: "First attempt declined" },
      { id: "txn-5012-b", date: "2026-08-05", amount: 1300, status: "success", gateway: "Stripe", method: "Mastercard •••• 4455", note: "Full payment — retry succeeded" },
    ],
  },
  {
    id: "11",
    orderId: "#5011",
    student: "Mohamed Hassan",
    email: "m.hassan@email.com",
    phone: "+20 100 555 0247",
    course: "AFK + NDECC",
    amount: 1700,
    paidAmount: 1700,
    paymentType: "full",
    status: "completed",
    date: "2026-08-04",
    billingAddress: {
      name: "Mohamed Hassan",
      line1: "26 July St, Mohandessin",
      city: "Cairo",
      province: "Giza",
      postal: "12411",
      country: "Egypt",
      phone: "+20 100 555 0247",
    },
    transactions: [
      { id: "txn-5011-a", date: "2026-08-04", amount: 1700, status: "success", gateway: "Stripe", method: "Visa •••• 3367", note: "Full payment" },
    ],
  },
  {
    id: "12",
    orderId: "#5010",
    student: "Fatima Al-Rashid",
    email: "f.rashid@email.com",
    phone: "+966 50 555 0389",
    course: "AFK",
    amount: 500,
    paidAmount: 0,
    paymentType: "full",
    status: "refunded",
    date: "2026-08-03",
    billingAddress: {
      name: "Fatima Al-Rashid",
      line1: "King Fahd Rd, Al Olaya",
      city: "Riyadh",
      province: "Riyadh Region",
      postal: "12211",
      country: "Saudi Arabia",
      phone: "+966 50 555 0389",
    },
    transactions: [
      { id: "txn-5010-a", date: "2026-08-03", amount: 500,  status: "success", gateway: "Stripe", method: "Visa •••• 6620", note: "Full payment" },
      { id: "txn-5010-b", date: "2026-08-04", amount: -500, status: "success", gateway: "Stripe", method: "Visa •••• 6620", note: "Full refund issued" },
    ],
  },
];

// ── Monthly Revenue ───────────────────────────────────────────────────────────
export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "Jan", revenue: 38200,  orders: 62,  students: 58  },
  { month: "Feb", revenue: 41500,  orders: 71,  students: 66  },
  { month: "Mar", revenue: 49800,  orders: 84,  students: 79  },
  { month: "Apr", revenue: 55300,  orders: 91,  students: 87  },
  { month: "May", revenue: 62100,  orders: 103, students: 96  },
  { month: "Jun", revenue: 71400,  orders: 118, students: 112 },
  { month: "Jul", revenue: 84200,  orders: 137, students: 128 },
  { month: "Aug", revenue: 58900,  orders: 96,  students: 89  },
];

// ── Summary Stats ─────────────────────────────────────────────────────────────
export const stats = {
  totalRevenue:     617200,
  totalStudents:    1084,
  activeStudents:   342,
  newThisMonth:     47,
  totalOrders:      891,
  avgOrderValue:    692,
  completionRate:   78,
  satisfactionRate: 96,
};
