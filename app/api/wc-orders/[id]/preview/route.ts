import { NextResponse } from "next/server";
import { getOrder } from "@/lib/wc";
import { mapOrder, formatMoney } from "@/lib/wc-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only order preview, backed by the live WooCommerce order.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }
  try {
    const o = await getOrder(id);
    const row = mapOrder(o);
    const items = (o.line_items || []).map((li: any) => ({
      name: li.name,
      quantity: li.quantity,
      total: formatMoney(parseFloat(li.total || "0")),
    }));
    return NextResponse.json({
      number: row.number,
      statusLabel: row.statusLabel,
      dateLabel: row.dateLabel,
      customerName: row.customerName,
      email: o.billing?.email || "",
      phone: o.billing?.phone || "",
      origin: row.origin,
      paymentMethod: o.payment_method_title || o.payment_method || "",
      items,
      orderTotal: formatMoney(row.total),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load order." }, { status: 502 });
  }
}
