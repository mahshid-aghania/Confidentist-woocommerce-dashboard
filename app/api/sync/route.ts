import { NextResponse } from "next/server";
import { syncOrder, syncAll } from "@/lib/sync";
import { supaInsert } from "@/lib/supa";

// POST /api/sync
//   ?order=58527   -> sync a single WooCommerce order
//   ?all=1         -> sync every order that has an installment plan
// Auth: header  x-sync-secret: <SYNC_SECRET>
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret && req.headers.get("x-sync-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const order = searchParams.get("order");
  const all = searchParams.get("all");
  const started = new Date().toISOString();

  try {
    let payload: any;
    if (order) {
      payload = { synced: [await syncOrder(order)], errors: [] };
    } else if (all) {
      payload = await syncAll();
    } else {
      return NextResponse.json({ error: "Pass ?order=<id> or ?all=1" }, { status: 400 });
    }

    await supaInsert("sync_log", [{
      source: "woocommerce",
      entity: order ? `order ${order}` : "orders (all)",
      started_at: started,
      finished_at: new Date().toISOString(),
      status: payload.errors?.length ? "completed_with_errors" : "success",
      records: payload.synced?.length ?? 0,
      message: payload.errors?.length ? JSON.stringify(payload.errors).slice(0, 500) : "ok",
    }]).catch(() => {});

    return NextResponse.json({ ok: true, ...payload });
  } catch (err: any) {
    await supaInsert("sync_log", [{
      source: "woocommerce",
      entity: order ? `order ${order}` : "orders (all)",
      started_at: started,
      finished_at: new Date().toISOString(),
      status: "failed",
      records: 0,
      message: String(err?.message || err).slice(0, 500),
    }]).catch(() => {});
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
