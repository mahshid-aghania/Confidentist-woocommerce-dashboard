// Data layer for the WooCommerce-admin Orders replica (/wc-orders).
// Fetches live orders from the store and maps them to the exact view model the
// screenshot shows: Order (#number + customer), Date, Status badge, Total (with
// refund strikethrough), Export Status, and Origin (order attribution).
//
// Nothing here is hard-coded from the screenshot — every value is derived from
// the real WooCommerce REST response.

import { wcListWithMeta } from "./wc";

export type OrderRow = {
  id: number;
  number: string;
  customerName: string;
  customerId: number;
  status: string;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
  dateISO: string;
  dateLabel: string;
  currency: string;
  total: number; // original order total (WooCommerce keeps this on refunds)
  net: number; // total + refunds (refunds are negative)
  hasRefund: boolean;
  exportStatus: string | null; // null => render centered dash
  origin: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// WooCommerce order-status pill styling, matched to the screenshot.
const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  completed:       { label: "Completed",       bg: "#c8d7e1", color: "#2e4453" },
  "partially-paid":{ label: "Partially Paid",  bg: "#e5e5e5", color: "#2c3338" },
  refunded:        { label: "Refunded",        bg: "#e5e5e5", color: "#2c3338" },
  failed:          { label: "Failed",          bg: "#eba3a3", color: "#3c1313" },
  processing:      { label: "Processing",      bg: "#c6e1c6", color: "#2c4700" },
  "on-hold":       { label: "On hold",         bg: "#f8dda7", color: "#573b00" },
  pending:         { label: "Pending payment", bg: "#e5e5e5", color: "#2c3338" },
  cancelled:       { label: "Cancelled",       bg: "#e5e5e5", color: "#2c3338" },
  "checkout-draft":{ label: "Draft",           bg: "#e5e5e5", color: "#2c3338" },
};

function titleCase(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusInfo(status: string) {
  return STATUS[status] || { label: titleCase(status), bg: "#e5e5e5", color: "#2c3338" };
}

// Format a WooCommerce local datetime string ("2026-10-11T17:51:49") as
// "Oct 11, 2026" without timezone drift (the string is already store-local).
function formatDate(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${MONTHS[parseInt(mo, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

export function formatMoney(n: number): string {
  return (
    "$" +
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// Order attribution -> the admin "Origin" label.
// Mirrors WooCommerce's OrderAttribution get_origin_label() behaviour, verified
// against the live store (typein/(direct), organic/google, referral/<host>, …).
function originLabel(meta: Map<string, any>): string {
  const src = String(meta.get("_wc_order_attribution_source_type") || "").trim();
  const utm = String(meta.get("_wc_order_attribution_utm_source") || "").trim();
  if (!src) return "Unknown";
  switch (src) {
    case "typein":
      return "Direct";
    case "organic":
      return "Organic: " + (utm ? titleCase(utm) : "Unknown");
    case "referral":
      return "Referral: " + (utm || "Unknown");
    case "utm":
      return "Source: " + (utm || "Unknown");
    case "admin":
      return "Web admin";
    case "mobile_app":
      return "Mobile app";
    default:
      return utm ? `${titleCase(src)}: ${utm}` : titleCase(src);
  }
}

export function mapOrder(o: any): OrderRow {
  const meta = new Map<string, any>();
  for (const m of o.meta_data || []) meta.set(m.key, m.value);

  const name = `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim();
  const total = parseFloat(o.total || "0");
  const refundSum = (o.refunds || []).reduce(
    (s: number, r: any) => s + parseFloat(r.total || "0"),
    0,
  );
  const net = total + refundSum;
  const si = statusInfo(o.status);

  return {
    id: o.id,
    number: String(o.number ?? o.id),
    customerName: name,
    customerId: o.customer_id ?? 0,
    status: o.status,
    statusLabel: si.label,
    statusBg: si.bg,
    statusColor: si.color,
    dateISO: o.date_created || o.date_created_gmt || "",
    dateLabel: formatDate(o.date_created || o.date_created_gmt || ""),
    currency: o.currency || "CAD",
    total,
    net,
    hasRefund: Math.abs(refundSum) > 0.0001,
    // No export plugin meta is exposed by this store's REST API, so there is
    // nothing authentic to show — render a dash rather than fabricate a value.
    exportStatus: null,
    origin: originLabel(meta),
  };
}

export type OrdersQuery = {
  page?: number;
  perPage?: number;
  status?: string; // "any" or a specific slug
  orderby?: "date" | "id" | "total" | "export";
  order?: "asc" | "desc";
  after?: string; // ISO date (inclusive lower bound)
  before?: string; // ISO date (exclusive upper bound)
  customer?: number; // registered customer id
  search?: string; // free-text (customer name/email) fallback
};

const FIELDS =
  "id,number,status,date_created,date_created_gmt,total,currency,refunds,billing,customer_id,meta_data";

function baseParams(q: OrdersQuery): Record<string, string | number> {
  const p: Record<string, string | number> = {
    status: q.status || "any",
    _fields: FIELDS,
  };
  if (q.after) p.after = q.after;
  if (q.before) p.before = q.before;
  if (q.customer) p.customer = q.customer;
  if (q.search) p.search = q.search;
  return p;
}

// REST can only order by date/id. For those we page server-side (cheap).
// For total/export we must scan the whole filtered set and sort in JS.
const REST_SORTABLE = new Set(["date", "id"]);

export async function fetchOrdersPage(
  q: OrdersQuery,
): Promise<{ orders: OrderRow[]; total: number; totalPages: number; scanned: boolean }> {
  const perPage = q.perPage || 20;
  const page = Math.max(1, q.page || 1);
  const orderby = q.orderby || "date";
  const order = q.order || "desc";

  if (REST_SORTABLE.has(orderby)) {
    const { data, total, totalPages } = await wcListWithMeta("orders", {
      ...baseParams(q),
      per_page: perPage,
      page,
      orderby,
      order,
    });
    return { orders: data.map(mapOrder), total, totalPages, scanned: false };
  }

  // total / export sort: pull the entire filtered dataset, sort, then slice.
  const all = await fetchAllOrders(q);
  const dir = order === "asc" ? 1 : -1;
  all.sort((a, b) => {
    if (orderby === "total") return (a.net - b.net) * dir;
    // export status is effectively empty everywhere; keep a stable id order
    return (a.id - b.id) * dir;
  });
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return { orders: all.slice(start, start + perPage), total, totalPages, scanned: true };
}

// Pull every order matching the current filters (used by CSV export and by
// total/export sorting). Fetches page 1 to learn the page count, then grabs the
// rest in small parallel batches.
export async function fetchAllOrders(q: OrdersQuery): Promise<OrderRow[]> {
  const PER = 100;
  const first = await wcListWithMeta("orders", {
    ...baseParams(q),
    per_page: PER,
    page: 1,
    orderby: "date",
    order: "desc",
  });
  const rows: OrderRow[] = first.data.map(mapOrder);
  const pages = first.totalPages || 1;

  const BATCH = 6;
  for (let p = 2; p <= pages; p += BATCH) {
    const batch: Promise<{ data: any[] }>[] = [];
    for (let i = p; i < p + BATCH && i <= pages; i++) {
      batch.push(
        wcListWithMeta("orders", {
          ...baseParams(q),
          per_page: PER,
          page: i,
          orderby: "date",
          order: "desc",
        }),
      );
    }
    const results = await Promise.all(batch);
    for (const r of results) for (const o of r.data) rows.push(mapOrder(o));
  }
  return rows;
}

// Build the WooCommerce-style month options ("October 2026" … ) for the
// "All dates" dropdown, derived from the newest order date backwards.
export function monthOptions(newestISO: string, count = 24): { value: string; label: string }[] {
  const m = (newestISO || "").match(/^(\d{4})-(\d{2})/);
  let year = m ? parseInt(m[1], 10) : new Date().getUTCFullYear();
  let month = m ? parseInt(m[2], 10) : 1; // 1-12
  const FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ value: `${year}-${String(month).padStart(2, "0")}`, label: `${FULL[month - 1]} ${year}` });
    month--;
    if (month < 1) { month = 12; year--; }
  }
  return out;
}

// Convert a "YYYY-MM" month value into WooCommerce after/before ISO bounds.
export function monthToRange(value: string): { after: string; before: string } | null {
  const m = value.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const after = `${m[1]}-${m[2]}-01T00:00:00`;
  const ny = mo === 12 ? y + 1 : y;
  const nm = mo === 12 ? 1 : mo + 1;
  const before = `${ny}-${String(nm).padStart(2, "0")}-01T00:00:00`;
  return { after, before };
}
