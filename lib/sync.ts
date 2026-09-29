// WooCommerce -> Supabase sync for ConfiDentist installment orders.
//
// Design guarantees (important):
//  * Idempotent: keyed on wc_order_id / wc_customer_id, re-runnable safely.
//  * NEVER overwrites Stripe payment links on an installment (stripe_payment_link_id/url
//    are omitted from installment updates, so PostgREST leaves them untouched).
//  * NEVER downgrades a Stripe-confirmed `paid` installment back to `pending`
//    (WooCommerce has no knowledge of Stripe-link payments).
import { getOrder, listOrders } from "@/lib/wc";
import { supaSelect, supaUpsert, supaInsert, supaUpdate, supaDelete } from "@/lib/supa";

const ORDER_ENUM = new Set([
  "pending", "processing", "on-hold", "completed",
  "cancelled", "refunded", "failed", "trash", "checkout-draft",
]);

function mapOrderStatus(wc: string): string {
  return ORDER_ENUM.has(wc) ? wc : "processing"; // e.g. "partially-paid" -> processing
}

function mapInstStatus(wc: string): string {
  if (wc === "completed" || wc === "processing") return "paid";
  if (wc === "failed") return "failed";
  if (wc === "cancelled") return "cancelled";
  if (wc === "refunded") return "refunded";
  return "pending"; // pending, on-hold, checkout-draft, ...
}

const num = (v: any): number => (v === null || v === undefined || v === "" ? 0 : Number(v));
const gmt = (v: any): string | null => (v ? `${v}Z` : null);

type SyncResult = {
  order_number: string;
  customer: string;
  installments: number;
  paid: number;
  pending: number;
  preserved_links: number;
};

export async function syncOrder(idOrNumber: number | string): Promise<SyncResult> {
  const order = await getOrder(idOrNumber);
  if (!order || !order.id) throw new Error(`WooCommerce order ${idOrNumber} not found`);

  const meta: Record<string, any> = Object.fromEntries(
    (order.meta_data || []).map((m: any) => [m.key, m.value]),
  );
  const b = order.billing || {};
  const s = order.shipping || {};

  // ---- 1) Customer ---------------------------------------------------------
  let customerUuid: string | null = null;
  const custRow = {
    email: b.email || null,
    first_name: b.first_name || null,
    last_name: b.last_name || null,
    phone: b.phone || null,
    is_paying_customer: true,
  };
  if (order.customer_id && Number(order.customer_id) > 0) {
    const rows = await supaUpsert(
      "customers",
      [{ wc_customer_id: Number(order.customer_id), ...custRow }],
      "wc_customer_id",
    );
    customerUuid = rows?.[0]?.id ?? null;
  } else if (b.email) {
    const found = await supaSelect("customers", {
      email: `eq.${b.email}`, select: "id", limit: "1",
    });
    if (found?.[0]) customerUuid = found[0].id;
    else {
      const ins = await supaInsert("customers", [custRow]);
      customerUuid = ins?.[0]?.id ?? null;
    }
  }

  // ---- 2) Order raw breakdown ---------------------------------------------
  const lineItems = order.line_items || [];
  const itemsSubtotal = lineItems.reduce((a: number, li: any) => a + num(li.subtotal), 0);
  const taxLine = (order.tax_lines || [])[0];
  const shipLine = (order.shipping_lines || [])[0];
  const couponLine = (order.coupon_lines || [])[0];
  const hstMatch = taxLine?.label ? String(taxLine.label).match(/([0-9]{9}RT[0-9]{4})/) : null;

  const addr = (x: any) =>
    [x.address_1, x.address_2, x.city, [x.state, x.postcode].filter(Boolean).join(" "), x.country]
      .filter(Boolean).join(", ");

  const rawBreakdown: Record<string, any> = {
    tax_label: taxLine?.label || (num(order.total_tax) > 0 ? "Tax" : "None"),
    tax_rate_percent: taxLine?.rate_percent ?? (num(order.total_tax) > 0 ? null : 0),
    tax_total: num(order.total_tax),
    hst_number: hstMatch ? hstMatch[1] : null,
    deposit: num(meta["_awcdp_deposits_deposit_amount"]) || null,
    future_payments:
      num(meta["_awcdp_deposits_second_payment"]) ||
      num(meta["awcdp_deposits_balance_amount"]) || null,
    shipping: num(order.shipping_total),
    shipping_method: shipLine?.method_title || null,
    items_subtotal: itemsSubtotal,
    discount: num(order.discount_total),
    coupon: couponLine?.code || null,
    order_total: num(order.total),
    product: lineItems[0]?.name || null,
    original_wc_status: order.status,
    billing_address: addr(b) || null,
    shipping_address: (s.first_name || s.address_1) ? addr(s) || null : null,
    customer_note: order.customer_note || null,
    synced_at: new Date().toISOString(),
  };

  // ---- 3) Order upsert (on wc_order_id) -----------------------------------
  const orderRows = await supaUpsert(
    "orders",
    [{
      wc_order_id: Number(order.id),
      order_number: String(order.number),
      status: mapOrderStatus(order.status),
      currency: order.currency || "CAD",
      customer_id: customerUuid,
      total_amount: num(order.total),
      total_tax: num(order.total_tax),
      shipping_total: num(order.shipping_total),
      discount_total: num(order.discount_total),
      customer_note: order.customer_note || null,
      payment_method_title: order.payment_method_title || "Partially Paid",
      date_created: gmt(order.date_created_gmt),
      date_paid: gmt(order.date_paid_gmt),
      ip_address: order.customer_ip_address || null,
      raw: rawBreakdown,
    }],
    "wc_order_id",
  );
  const orderUuid = orderRows?.[0]?.id;
  if (!orderUuid) throw new Error("Failed to upsert order");

  // ---- 4) Line items (replace) --------------------------------------------
  await supaDelete("order_line_items", { order_id: `eq.${orderUuid}` });
  if (lineItems.length) {
    await supaInsert(
      "order_line_items",
      lineItems.map((li: any) => ({
        order_id: orderUuid,
        wc_line_item_id: li.id ?? null,
        wc_product_id: li.product_id ?? null,
        name: li.name,
        sku: li.sku || null,
        quantity: li.quantity ?? 1,
        price: num(li.price),
        subtotal: num(li.subtotal),
        subtotal_tax: num(li.subtotal_tax),
        total: num(li.total),
        total_tax: num(li.total_tax),
      })),
    );
  }

  // ---- 5) Installments (from AWCDP schedule + child order statuses) --------
  const schedule = meta["_awcdp_deposits_payment_schedule"];
  const entries: { key: string; kind: string; due: string | null; amount: number; childId?: number }[] = [];
  if (schedule && typeof schedule === "object") {
    if (schedule.deposit) {
      entries.push({
        key: "deposit", kind: "deposit",
        due: gmt(order.date_created_gmt), amount: num(schedule.deposit.total),
        childId: schedule.deposit.id,
      });
    }
    Object.keys(schedule)
      .filter((k) => k !== "deposit")
      .sort((a, b) => Number(a) - Number(b))
      .forEach((k) => {
        entries.push({
          key: k, kind: "installment",
          due: new Date(Number(k) * 1000).toISOString(),
          amount: num(schedule[k].total), childId: schedule[k].id,
        });
      });
  }

  // Fetch each child order's status in parallel (that's where paid/pending lives).
  const children = await Promise.all(
    entries.map((e) =>
      e.childId
        ? getOrder(e.childId).then((c) => c).catch(() => null)
        : Promise.resolve(null),
    ),
  );

  // Existing rows so we can preserve Stripe links + not downgrade paid.
  const existing: any[] = await supaSelect("order_installments", {
    order_id: `eq.${orderUuid}`,
    select: "id,sequence,status,paid_at,stripe_payment_link_id",
  });
  const bySeq = new Map<number, any>(existing.map((r) => [r.sequence, r]));

  const total = entries.length;
  let preserved = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const seq = i + 1;
    const child = children[i];
    const wcStatus = child?.status || (e.kind === "deposit" ? "completed" : "pending");
    const prev = bySeq.get(seq);
    const finalStatus = prev && prev.status === "paid" ? "paid" : mapInstStatus(wcStatus);
    if (prev?.stripe_payment_link_id) preserved++;

    const base: Record<string, any> = {
      order_id: orderUuid,
      wc_payment_id: `${order.number}-${seq}`,
      sequence: seq,
      kind: e.kind,
      label: e.kind === "deposit" ? "Deposit" : `Installment ${seq} of ${total}`,
      due_date: e.due ? e.due.slice(0, 10) : null,
      payment_method: child?.payment_method_title || null,
      amount: e.amount,
      currency: order.currency || "CAD",
      status: finalStatus,
    };
    if (finalStatus === "paid") {
      base.paid_at = prev?.paid_at || gmt(child?.date_paid_gmt) || gmt(order.date_paid_gmt) || new Date().toISOString();
    }

    if (prev) {
      // Update WITHOUT stripe_payment_link_id/url so existing links are preserved.
      await supaUpdate("order_installments", base, { id: `eq.${prev.id}` });
    } else {
      await supaInsert("order_installments", [base]);
    }
  }

  // ---- 6) Paid summary on the order raw -----------------------------------
  const finalInst: any[] = await supaSelect("order_installments", {
    order_id: `eq.${orderUuid}`,
    select: "sequence,status,amount,wc_payment_id,due_date",
    order: "sequence.asc",
  });
  const paidRows = finalInst.filter((r) => r.status === "paid");
  const dueRows = finalInst.filter((r) => r.status === "pending" || r.status === "failed");
  const lastPaid = paidRows[paidRows.length - 1];
  rawBreakdown.payments = {
    amount_paid_to_date: Number(paidRows.reduce((a, r) => a + Number(r.amount), 0).toFixed(2)),
    remaining_balance: Number(dueRows.reduce((a, r) => a + Number(r.amount), 0).toFixed(2)),
    installments_paid: paidRows.length,
    installments_total: finalInst.length,
    last_payment_recorded: lastPaid
      ? `${lastPaid.wc_payment_id} · ${lastPaid.due_date}`
      : null,
  };
  await supaUpdate("orders", { raw: rawBreakdown }, { id: `eq.${orderUuid}` });

  return {
    order_number: String(order.number),
    customer: `${b.first_name || ""} ${b.last_name || ""}`.trim(),
    installments: finalInst.length,
    paid: paidRows.length,
    pending: dueRows.length,
    preserved_links: preserved,
  };
}

// Sync every parent order that carries a deposit/installment plan.
// Defaults to the in-progress installment orders ("partially-paid"); pass other
// statuses (e.g. "completed") to also backfill finished plans.
export async function syncAll(
  statuses: string[] = ["partially-paid"],
  maxPages = 20,
): Promise<{ synced: SyncResult[]; errors: any[] }> {
  const synced: SyncResult[] = [];
  const errors: any[] = [];
  const seen = new Set<number>();
  for (const status of statuses) {
    for (let page = 1; page <= maxPages; page++) {
      const list = await listOrders({ page, status, per_page: 50 });
      if (!Array.isArray(list) || list.length === 0) break;
      for (const o of list) {
        if (o.parent_id && Number(o.parent_id) > 0) continue; // skip child scheduled orders
        const meta: Record<string, any> = Object.fromEntries(
          (o.meta_data || []).map((m: any) => [m.key, m.value]),
        );
        const hasPlan = meta["_awcdp_deposits_order_has_deposit"] === "yes" ||
          !!meta["_awcdp_deposits_payment_schedule"];
        if (!hasPlan || seen.has(o.id)) continue;
        seen.add(o.id);
        try {
          synced.push(await syncOrder(o.id));
        } catch (err: any) {
          errors.push({ order: o.number || o.id, error: String(err?.message || err) });
        }
      }
      if (list.length < 50) break;
    }
  }
  return { synced, errors };
}
