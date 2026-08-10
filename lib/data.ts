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

export type Order = {
  id: string;
  orderId: string;
  student: string;
  email: string;
  course: string;
  amount: number;
  status: "completed" | "processing" | "refunded" | "pending";
  date: string;
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
  { id: "1",  orderId: "#5021", student: "Raj Patel",       email: "raj.p@email.com",      course: "AFK Bundle",      amount: 1300, status: "completed",  date: "2026-08-09" },
  { id: "2",  orderId: "#5020", student: "Mei Zhang",       email: "mei.z@email.com",      course: "OSCE",            amount: 600,  status: "processing", date: "2026-08-09" },
  { id: "3",  orderId: "#5019", student: "Nina Johansson",  email: "nina.j@email.com",     course: "Interview",       amount: 400,  status: "completed",  date: "2026-08-08" },
  { id: "4",  orderId: "#5018", student: "Omar Benali",     email: "o.benali@email.com",   course: "AFK + NDECC",     amount: 1700, status: "completed",  date: "2026-08-08" },
  { id: "5",  orderId: "#5017", student: "Natalie Torres",  email: "n.torres@email.com",   course: "ADAT",            amount: 700,  status: "completed",  date: "2026-08-07" },
  { id: "6",  orderId: "#5016", student: "Carlos Reyes",    email: "c.reyes@email.com",    course: "NDECC + OSCE",    amount: 1800, status: "completed",  date: "2026-08-07" },
  { id: "7",  orderId: "#5015", student: "David Mensah",    email: "d.mensah@email.com",   course: "Interview",       amount: 400,  status: "completed",  date: "2026-08-06" },
  { id: "8",  orderId: "#5014", student: "Yuna Kim",        email: "yuna.k@email.com",     course: "OSCE + ACJ",      amount: 1400, status: "completed",  date: "2026-08-06" },
  { id: "9",  orderId: "#5013", student: "James Liu",       email: "james.l@email.com",    course: "AFK",             amount: 500,  status: "processing", date: "2026-08-05" },
  { id: "10", orderId: "#5012", student: "Aiden Khalil",    email: "aiden.k@email.com",    course: "AFK + ACJ",       amount: 1300, status: "completed",  date: "2026-08-05" },
  { id: "11", orderId: "#5011", student: "Mohamed Hassan",  email: "m.hassan@email.com",   course: "AFK + NDECC",     amount: 1700, status: "completed",  date: "2026-08-04" },
  { id: "12", orderId: "#5010", student: "Fatima Al-Rashid",email: "f.rashid@email.com",   course: "AFK",             amount: 500,  status: "refunded",   date: "2026-08-03" },
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
