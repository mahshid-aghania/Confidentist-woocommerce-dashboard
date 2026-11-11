// Reads the installment schedule for an order that uses the WooCommerce
// "Advanced Deposits & Part-Payments" (AWCDP) plugin, directly from WooCommerce.
//
// Why this exists: AWCDP stores the full plan on the PARENT order's meta
// (`_awcdp_deposits_payment_schedule`) and creates one child order per payment
// (the deposit + each partial payment). Each child order is a real WooCommerce
// order with its own total, tax, status and paid date — the authoritative source.
// The dashboard's Supabase-based installment view doesn't see these, so an order
// paid through this plugin looked like it only had its first payment.
//
// The parent's schedule meta lists each payment's child-order id (and its type +
// due timestamp). We fetch each child order BY ID to get the exact amount, tax,
// status and paid date. (Filtering `orders?parent=` is unreliable on this store —
// it returns nothing — so we must fetch by id.)

import { getOrder } from "./wc";

export type AwcdpInstallment = {
  sequence: number;        // 1-based display order (deposit first)
  label: string;           // "Deposit" | "Installment N"
  kind: "deposit" | "partial";
  childOrderId: number;    // the WooCommerce child order id
  dueDate: string | null;  // YYYY-MM-DD
  amount: number;          // gross amount the customer pays (incl. tax & shipping)
  tax: number;             // tax portion of this payment
  status: "paid" | "pending";
  paidAt: string | null;   // YYYY-MM-DD
};

export type AwcdpPlan = {
  installments: AwcdpInstallment[];
  total: number;     // sum of all payments
  totalTax: number;  // sum of per-payment tax
};

function metaVal(order: any, key: string): any {
  const m = (order?.meta_data || []).find((x: any) => x.key === key);
  return m ? m.value : undefined;
}

function tsToDate(ts: unknown): string | null {
  const n = typeof ts === "string" ? parseInt(ts, 10) : (ts as number);
  if (!n || Number.isNaN(n)) return null;
  return new Date(n * 1000).toISOString().slice(0, 10);
}

function dateOnly(d: unknown): string | null {
  if (!d || typeof d !== "string") return null;
  return d.length > 10 ? d.slice(0, 10) : d;
}

/**
 * Returns the AWCDP installment plan for a parent order, or null if the order
 * isn't an AWCDP deposits/part-payment order (or the data can't be read).
 */
export async function getAwcdpPlan(parentOrder: any): Promise<AwcdpPlan | null> {
  const schedRaw = metaVal(parentOrder, "_awcdp_deposits_payment_schedule");
  if (!schedRaw) return null;

  let sched: any;
  try {
    sched = typeof schedRaw === "string" ? JSON.parse(schedRaw) : schedRaw;
  } catch {
    return null;
  }
  if (!sched || typeof sched !== "object") return null;

  // Each schedule entry → one child order id, its type, and (for partials) a due timestamp.
  const entries: { id: number; type: string; dueTs: number | null }[] = [];
  for (const [key, e] of Object.entries<any>(sched)) {
    if (e && e.id != null) {
      entries.push({
        id: Number(e.id),
        type: e.type || (key === "deposit" ? "deposit" : "partial_payment"),
        dueTs: /^\d+$/.test(key) ? parseInt(key, 10) : null,
      });
    }
  }
  if (entries.length === 0) return null;

  // Fetch each child order by id (authoritative amount / tax / status / paid date).
  const fetched = await Promise.all(
    entries.map((en) =>
      getOrder(en.id)
        .then((c: any) => ({ en, c }))
        .catch(() => null),
    ),
  );

  const rows: AwcdpInstallment[] = [];
  for (const item of fetched) {
    if (!item || !item.c || item.c.id == null) continue;
    const { en, c } = item;
    const isDeposit = en.type === "deposit";
    const paid = c.status === "completed" || c.status === "processing" || !!c.date_paid;
    rows.push({
      sequence: 0,
      label: "",
      kind: isDeposit ? "deposit" : "partial",
      childOrderId: c.id,
      dueDate: isDeposit
        ? (dateOnly(c.date_paid) || dateOnly(c.date_created))
        : (tsToDate(en.dueTs) || tsToDate(metaVal(c, "_awcdp_auto_payment_due_date"))),
      amount: parseFloat(c.total || "0"),
      tax: parseFloat(c.total_tax || "0"),
      status: paid ? "paid" : "pending",
      paidAt: dateOnly(c.date_paid),
    });
  }
  if (rows.length === 0) return null;

  // Deposit first, then partials ordered by due date.
  rows.sort((a, b) =>
    a.kind !== b.kind
      ? (a.kind === "deposit" ? -1 : 1)
      : String(a.dueDate).localeCompare(String(b.dueDate)),
  );
  let seq = 0;
  let partialN = 0;
  for (const r of rows) {
    r.sequence = ++seq;
    r.label = r.kind === "deposit" ? "Deposit" : `Installment ${++partialN}`;
  }

  return {
    installments: rows,
    total: rows.reduce((s, r) => s + r.amount, 0),
    totalTax: rows.reduce((s, r) => s + r.tax, 0),
  };
}
