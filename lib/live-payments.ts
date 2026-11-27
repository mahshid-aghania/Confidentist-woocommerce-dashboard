// Live Stripe → dashboard reconciliation.
//
// Reads every successful Stripe charge in a recent window straight from Stripe and
// matches it to the dashboard's records (Supabase `orders` / `order_installments`):
//   1. Payment Link checkout  → order_installments.stripe_payment_link_id
//   2. "Order 58527-2" charge → order_installments.wc_payment_id
//   3. Website checkout       → orders.transaction_id (payment intent) / orders.order_key (session)
//   4. "Order 58527" / metadata.order_number → that order's installment with the same amount
//   5. Customer email + amount → that customer's installment with the same amount
// If the matched installment is still unpaid, it is marked paid right away (fix=true), so the
// dashboard reflects Stripe even when a webhook was missed or a link was made by hand.
// Installments fixed here are stamped `source_status = "paid (stripe live <charge id>)"`, which
// both prevents re-using the same charge twice and tells the Recent Payments page that the
// real-time webhook had missed it.
import { supaSelect, supaUpdate } from "@/lib/supa";
import { stripe } from "@/lib/stripe";

type Row = Record<string, any>;
const num = (v: any): number => (v === null || v === undefined || v === "" ? 0 : Number(v));

export type LiveState =
  | "realtime"      // already paid in the dashboard by the webhook / sync
  | "caught"        // was missed by the webhook, caught earlier by this live check
  | "fixed"         // was missed by the webhook, marked paid just now
  | "unmatched"     // a Stripe payment we can't tie to any order in the dashboard
  | "not-tracked";  // refers to a WooCommerce order the dashboard doesn't track (no plan)

export type LivePayment = {
  chargeId: string;
  createdISO: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  description: string;
  card: string;
  receiptUrl: string | null;
  refunded: boolean;
  via: "Payment link" | "Checkout" | "Card charge";
  orderNumber: string | null;
  installmentLabel: string | null;
  matchedBy: string | null;
  state: LiveState;
};

const INST = "id,sequence,label,amount,status,paid_at,source_status,wc_payment_id,stripe_payment_link_id";
const LIVE_TAG = "stripe live";
const TAX_RATES = [1, 1.05, 1.11, 1.12, 1.13, 1.14, 1.15];

function amountMatches(instAmount: number, charged: number): boolean {
  if (instAmount <= 0) return false;
  return TAX_RATES.some((r) => Math.abs(instAmount * r - charged) <= 0.06);
}

const q = (v: string) => `"${v.replace(/"/g, "")}"`;
const inList = (vals: string[]) => `in.(${vals.map(q).join(",")})`;

async function listAll(path: string, params: Record<string, string | number>, maxPages = 5): Promise<any[]> {
  const out: any[] = [];
  let after: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const r = await stripe(path, { ...params, limit: 100, ...(after ? { starting_after: after } : {}) });
    if (r?.error) throw new Error(`Stripe ${path}: ${r.error.message}`);
    const data: any[] = r?.data || [];
    out.push(...data);
    if (!r.has_more || !data.length) break;
    after = data[data.length - 1].id;
  }
  return out;
}

function cardLabel(c: any): string {
  const card = c.payment_method_details?.card;
  if (card) return `${String(card.brand || "card").replace(/^\w/, (m: string) => m.toUpperCase())} ···${card.last4}`;
  return c.payment_method_details?.type || "—";
}

export async function getLivePayments(
  days = 7,
  opts: { fix?: boolean } = {},
): Promise<{ payments: LivePayment[]; checkedAt: string; days: number }> {
  const fix = opts.fix !== false;
  const since = Math.floor(Date.now() / 1000) - Math.round(days * 86400);

  const [chargesRaw, sessions] = await Promise.all([
    listAll("/charges", { "created[gte]": since }),
    listAll("/checkout/sessions", { "created[gte]": since - 3 * 86400, status: "complete" }).catch(() => [] as any[]),
  ]);
  const charges = chargesRaw.filter((c) => c.status === "succeeded");

  const sessByPI = new Map<string, any>();
  for (const s of sessions) {
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (pi) sessByPI.set(pi, s);
  }

  // ── Collect lookup keys ───────────────────────────────────────────────
  const plinks = new Set<string>(), wcRefs = new Set<string>(), orderRefs = new Set<string>();
  const pis = new Set<string>(), sessIds = new Set<string>(), emails = new Set<string>();
  const info = charges.map((c) => {
    const pi = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id || "";
    const s = pi ? sessByPI.get(pi) : undefined;
    const desc = String(c.description || "");
    const plink = s && typeof s.payment_link === "string" ? s.payment_link : "";
    const wcRef = desc.match(/Order\s+#?([0-9]+-[0-9]+)/i)?.[1] || "";
    const orderRef =
      (!wcRef && desc.match(/Order\s+#?([0-9]+)\b/i)?.[1]) ||
      String(s?.metadata?.order_number || c.metadata?.order_number || "").replace(/\D/g, "") ||
      (wcRef ? wcRef.split("-")[0] : "");
    const email = String(
      c.billing_details?.email || c.receipt_email || s?.customer_details?.email || s?.customer_email || "",
    ).toLowerCase().trim();
    const name = String(c.billing_details?.name || s?.customer_details?.name || "").trim();
    if (plink) plinks.add(plink);
    if (wcRef) wcRefs.add(wcRef);
    if (orderRef) orderRefs.add(orderRef);
    if (pi) pis.add(pi);
    if (s?.id) sessIds.add(s.id);
    if (email) emails.add(email);
    return { c, s, pi, desc, plink, wcRef, orderRef, email, name };
  });

  // ── Load the dashboard records those keys point at (one query per key type) ──
  const sel = async (table: string, params: Record<string, string>) => {
    try { return ((await supaSelect(table, params)) || []) as Row[]; } catch { return [] as Row[]; }
  };
  const orderSel = `id,order_number,status,total_amount,date_created,transaction_id,order_key,order_installments(${INST})`;
  const [byPlink, byWcRef, ordersByNo, ordersBySite, custs] = await Promise.all([
    plinks.size ? sel("order_installments", { select: `${INST},orders(order_number)`, stripe_payment_link_id: inList([...plinks]) }) : [],
    wcRefs.size ? sel("order_installments", { select: `${INST},orders(order_number)`, wc_payment_id: inList([...wcRefs]) }) : [],
    orderRefs.size ? sel("orders", { select: orderSel, order_number: inList([...orderRefs]) }) : [],
    pis.size || sessIds.size
      ? sel("orders", {
          select: orderSel,
          or: `(${[
            ...(pis.size ? [`transaction_id.${inList([...pis])}`] : []),
            ...(sessIds.size ? [`order_key.${inList([...sessIds])}`] : []),
          ].join(",")})`,
        })
      : [],
    emails.size
      ? sel("customers", {
          select: `email,orders(${orderSel})`,
          or: `(${[...emails].slice(0, 150).map((e) => `email.ilike.${q(e)}`).join(",")})`,
        })
      : [],
  ]);

  const instByPlink = new Map(byPlink.map((r) => [String(r.stripe_payment_link_id), r]));
  const instByWcRef = new Map(byWcRef.map((r) => [String(r.wc_payment_id), r]));
  const orderByNo = new Map(ordersByNo.map((o) => [String(o.order_number), o]));
  const orderByPI = new Map<string, Row>(), orderBySess = new Map<string, Row>();
  for (const o of ordersBySite) {
    if (o.transaction_id) orderByPI.set(String(o.transaction_id), o);
    if (o.order_key) orderBySess.set(String(o.order_key), o);
  }
  const ordersByEmail = new Map<string, Row[]>();
  for (const cu of custs) {
    const k = String(cu.email || "").toLowerCase().trim();
    ordersByEmail.set(k, [...(ordersByEmail.get(k) || []), ...(cu.orders || [])]);
  }

  const used = new Set<string>(); // installment ids claimed by a charge in this run

  const out: LivePayment[] = [];
  for (const it of info) {
    const { c, s, desc, plink, wcRef, orderRef, email, name } = it;
    const created = new Date((c.created ?? 0) * 1000);
    const amount = num(c.amount) / 100;
    const base: LivePayment = {
      chargeId: c.id,
      createdISO: created.toISOString(),
      amount,
      currency: String(c.currency || "cad").toUpperCase(),
      name,
      email,
      description: desc,
      card: cardLabel(c),
      receiptUrl: c.receipt_url ?? null,
      refunded: !!c.refunded,
      via: plink ? "Payment link" : s ? "Checkout" : "Card charge",
      orderNumber: null,
      installmentLabel: null,
      matchedBy: null,
      state: "unmatched",
    };

    const settle = async (inst: Row, orderNumber: string | null, how: string) => {
      used.add(inst.id);
      base.orderNumber = orderNumber;
      base.installmentLabel = inst.label || (inst.sequence ? `Payment ${inst.sequence}` : null);
      base.matchedBy = how;
      if (inst.status === "paid") {
        base.state = String(inst.source_status || "").includes(LIVE_TAG) ? "caught" : "realtime";
        return;
      }
      if (!fix || c.refunded) { base.state = "unmatched"; return; }
      try {
        await supaUpdate(
          "order_installments",
          { status: "paid", paid_at: created.toISOString(), source_status: `paid (${LIVE_TAG} ${c.id})` },
          { id: `eq.${inst.id}`, status: "neq.paid" },
        );
        inst.status = "paid";
        inst.source_status = `paid (${LIVE_TAG} ${c.id})`;
        base.state = "fixed";
      } catch {
        base.state = "unmatched";
      }
    };

    // Choose the installment of an order this charge pays (by amount, closest due date).
    const pickFromOrder = (o: Row): Row | null => {
      const insts: Row[] = (o.order_installments || []).filter((i: Row) => !used.has(i.id));
      const already = insts.find((i) => String(i.source_status || "").includes(c.id));
      if (already) return already;
      const same = insts.filter((i) => amountMatches(num(i.amount), amount));
      const paidNear = same.find(
        (i) => i.status === "paid" && i.paid_at && Math.abs(new Date(i.paid_at).getTime() - created.getTime()) < 3 * 86400000,
      );
      if (paidNear) return paidNear;
      const open = same
        .filter((i) => i.status === "pending" || i.status === "failed")
        .sort((a, b) => num(a.sequence) - num(b.sequence));
      return open[0] || null;
    };

    // 1) Payment link
    const pl = plink ? instByPlink.get(plink) : undefined;
    if (pl && !used.has(pl.id)) { await settle(pl, String(pl.orders?.order_number ?? "") || null, "Payment link"); out.push(base); continue; }

    // 2) "Order 58527-2"
    const wr = wcRef ? instByWcRef.get(wcRef) : undefined;
    if (wr && !used.has(wr.id)) { await settle(wr, String(wr.orders?.order_number ?? "") || null, "Order reference"); out.push(base); continue; }

    // 3) Website checkout recorded as its own order
    const site = (it.pi && orderByPI.get(it.pi)) || (s?.id && orderBySess.get(s.id));
    if (site) {
      const inst = pickFromOrder(site);
      if (inst) { await settle(inst, String(site.order_number), "Website checkout"); out.push(base); continue; }
      base.orderNumber = String(site.order_number);
      base.matchedBy = "Website checkout";
      base.state = "realtime";
      out.push(base);
      continue;
    }

    // 4) Order number on the charge / session
    const byNo = orderRef ? orderByNo.get(orderRef) : undefined;
    if (byNo) {
      const inst = pickFromOrder(byNo);
      if (inst) { await settle(inst, String(byNo.order_number), "Order number"); out.push(base); continue; }
      if (!(byNo.order_installments || []).length) {
        base.orderNumber = String(byNo.order_number);
        base.matchedBy = "Order number";
        base.state = ["completed", "processing"].includes(String(byNo.status)) ? "realtime" : "unmatched";
        out.push(base);
        continue;
      }
    }

    // 5) Customer email + amount
    let done = false;
    for (const o of ordersByEmail.get(email) || []) {
      const inst = pickFromOrder(o);
      if (inst) { await settle(inst, String(o.order_number), "Email + amount"); done = true; break; }
    }
    if (done) { out.push(base); continue; }

    if (orderRef) { base.orderNumber = orderRef; base.state = "not-tracked"; base.matchedBy = "Order number"; }
    out.push(base);
  }

  out.sort((a, b) => b.createdISO.localeCompare(a.createdISO));
  return { payments: out, checkedAt: new Date().toISOString(), days };
}

// Fire-and-forget-safe wrapper for pages: never throws, never waits longer than `ms`.
export async function reconcileRecentPayments(days = 14, ms = 8000): Promise<void> {
  try {
    await Promise.race([
      getLivePayments(days, { fix: true }),
      new Promise((resolve) => setTimeout(resolve, ms)),
    ]);
  } catch {
    /* the page still renders from whatever is in the database */
  }
}
