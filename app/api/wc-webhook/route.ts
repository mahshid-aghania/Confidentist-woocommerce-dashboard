// WooCommerce webhook → keeps Supabase live for every WooCommerce transaction.
//
// WooCommerce calls this the moment an order is created or changes (paid, partially
// paid, installment paid, refunded, cancelled…). We verify the signature and re-sync
// that order into Supabase right away (customer, order, installment schedule), so the
// dashboard never waits for a batch sync.
//
// Setup (once), in WordPress: WooCommerce → Settings → Advanced → Webhooks → Add webhook
//   Name:         Dashboard live sync (create one for each topic below)
//   Status:       Active
//   Topic:        Order created   (and a second webhook: Order updated)
//   Delivery URL: https://dashboard.confidentist.ca/api/wc-webhook
//   Secret:       the same value as WC_WEBHOOK_SECRET in Vercel
//   API version:  WP REST API Integration v3
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { syncOrder } from "@/lib/sync";
import { supaInsert } from "@/lib/supa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SECRET = process.env.WC_WEBHOOK_SECRET || "";

// WooCommerce signs the raw body: base64(HMAC-SHA256(body, secret)).
function verify(raw: string, header: string | null): boolean {
  if (!header || !SECRET) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(raw, "utf8").digest();
  let got: Buffer;
  try { got = Buffer.from(header, "base64"); } catch { return false; }
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

export async function POST(req: Request) {
  const raw = await req.text();

  // When a webhook is first saved, WooCommerce sends an unsigned form-encoded
  // ping ("webhook_id=12"). Acknowledge it so WooCommerce activates the hook.
  if (!req.headers.get("x-wc-webhook-signature") && /^webhook_id=\d+/.test(raw.trim())) {
    return NextResponse.json({ ok: true, ping: true });
  }

  if (!SECRET) {
    return NextResponse.json({ error: "WC_WEBHOOK_SECRET not configured" }, { status: 500 });
  }
  if (!verify(raw, req.headers.get("x-wc-webhook-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let order: any;
  try { order = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const topic = req.headers.get("x-wc-webhook-topic") || "";
  // An installment payment is a child order of the plan; sync the parent plan so the
  // whole schedule (paid / remaining) is refreshed.
  const parentId = Number(order?.parent_id || 0);
  const id = parentId > 0 ? parentId : Number(order?.id || 0);
  if (!id) return NextResponse.json({ ok: true, ignored: "no order id", topic });

  const started = new Date().toISOString();
  try {
    const r = await syncOrder(id);
    await supaInsert("sync_log", [{
      source: "woocommerce-webhook",
      entity: `order ${id} (${topic || "order"})`,
      started_at: started,
      finished_at: new Date().toISOString(),
      status: "success",
      records: 1,
    }]).catch(() => null);
    return NextResponse.json({ ok: true, synced: r.order_number, topic });
  } catch (e: any) {
    // 500 → WooCommerce retries the delivery.
    return NextResponse.json({ error: e?.message || "sync failed", order: id }, { status: 500 });
  }
}
