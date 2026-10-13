import "../styles.css";
import { getOrder } from "@/lib/wc";
import { mapOrder, formatMoney } from "@/lib/wc-orders";

export const dynamic = "force-dynamic";

function money(v: any) {
  return formatMoney(parseFloat(v || "0"));
}

export default async function WcOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let o: any;
  try {
    o = await getOrder(id);
  } catch (e: any) {
    return (
      <div className="wcx">
        <div className="wcx-error"><strong>Couldn’t load order #{id}.</strong> {e?.message || ""}</div>
        <div style={{ padding: 16 }}><a className="wcx-btn" href="/wc-orders">← Back to orders</a></div>
      </div>
    );
  }

  const row = mapOrder(o);
  const meta = new Map<string, any>();
  for (const m of o.meta_data || []) meta.set(m.key, m.value);

  const b = o.billing || {};
  const s = o.shipping || {};
  const hasShipping = s.first_name || s.address_1;

  const deposit = meta.get("_awcdp_deposits_deposit_amount");
  const balance = meta.get("awcdp_deposits_balance_amount");

  return (
    <div className="wcx" style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Order #{row.number}</h1>
        <a className="wcx-btn" href="/wc-orders">← Back to orders</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>General</h2>
          <dl className="wcx-kv">
            <dt>Date created</dt><dd>{row.dateLabel}</dd>
            <dt>Status</dt>
            <dd><span className="wcx-badge" style={{ background: row.statusBg, color: row.statusColor }}>{row.statusLabel}</span></dd>
            <dt>Customer</dt><dd>{row.customerName}{row.customerId ? ` (#${row.customerId})` : ""}</dd>
            <dt>Email</dt><dd>{b.email || "—"}</dd>
            <dt>Phone</dt><dd>{b.phone || "—"}</dd>
            <dt>Payment</dt><dd>{o.payment_method_title || o.payment_method || "—"}</dd>
            <dt>Origin</dt><dd>{row.origin}</dd>
          </dl>
        </section>
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Billing</h2>
          <div style={{ color: "#2c3338", lineHeight: 1.7 }}>
            {b.first_name} {b.last_name}<br />
            {b.address_1}{b.address_2 ? `, ${b.address_2}` : ""}<br />
            {[b.city, b.state, b.postcode].filter(Boolean).join(" ")}<br />
            {b.country}
          </div>
          {hasShipping && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: "14px 0 8px" }}>Shipping</h2>
              <div style={{ color: "#2c3338", lineHeight: 1.7 }}>
                {s.first_name} {s.last_name}<br />
                {s.address_1}{s.address_2 ? `, ${s.address_2}` : ""}<br />
                {[s.city, s.state, s.postcode].filter(Boolean).join(" ")}
              </div>
            </>
          )}
        </section>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Items</h2>
      <table className="wcx-mini-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th style={{ textAlign: "right" }}>Total</th></tr>
        </thead>
        <tbody>
          {(o.line_items || []).map((li: any, i: number) => (
            <tr key={i}>
              <td>{li.name}</td>
              <td>{li.quantity}</td>
              <td style={{ textAlign: "right" }}>{money(li.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <dl className="wcx-kv" style={{ gridTemplateColumns: "180px 120px", width: "auto" }}>
          <dt>Items subtotal</dt><dd style={{ textAlign: "right" }}>{money(parseFloat(o.total || "0") - parseFloat(o.total_tax || "0") - parseFloat(o.shipping_total || "0") + parseFloat(o.discount_total || "0"))}</dd>
          {parseFloat(o.discount_total || "0") > 0 && (<><dt>Discount</dt><dd style={{ textAlign: "right" }}>- {money(o.discount_total)}</dd></>)}
          <dt>Shipping</dt><dd style={{ textAlign: "right" }}>{money(o.shipping_total)}</dd>
          <dt>Tax</dt><dd style={{ textAlign: "right" }}>{money(o.total_tax)}</dd>
          <dt style={{ fontWeight: 600 }}>Order total</dt><dd style={{ textAlign: "right", fontWeight: 600 }}>{money(o.total)}</dd>
          {deposit && (<><dt>Deposit</dt><dd style={{ textAlign: "right" }}>{money(deposit)}</dd></>)}
          {balance && (<><dt>Future payments</dt><dd style={{ textAlign: "right" }}>{money(balance)}</dd></>)}
          {row.hasRefund && (<><dt>Refunded</dt><dd style={{ textAlign: "right" }}>- {money(Math.abs(row.total - row.net))}</dd></>)}
        </dl>
      </div>

      <p style={{ color: "#646970", fontSize: 12, marginTop: 20 }}>
        Read-only view — backed by the live WooCommerce order. No store-changing actions are enabled.
      </p>
    </div>
  );
}
