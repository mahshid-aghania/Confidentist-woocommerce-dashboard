import { NextRequest, NextResponse } from "next/server";
import { supaSelect, supaInsert } from "@/lib/supa";

export const dynamic = "force-dynamic";

// POST /api/payment-link/send   { orderNumber, sequence }
//
// Sends an existing Stripe payment link to a student for one unpaid installment.
// Hard rules:
//  - The amount and link are re-derived SERVER-SIDE from Supabase; the client
//    never supplies money values or the URL.
//  - Only pending/failed installments that already carry a Stripe link qualify.
//  - Nothing is ever marked paid here — status changes only when Stripe confirms.
//  - If no email provider is configured, we DO NOT fake success: we return the
//    rendered draft (503) so the employee can copy/paste it manually.
//
// The whole dashboard (this route included) is already behind HTTP Basic Auth
// via middleware.ts, so only signed-in staff can reach it.

const num = (v: any) => (v == null || v === "" ? 0 : Number(v));

function money(n: number): string {
  return "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string | null): string {
  if (!d) return "—";
  const iso = d.length > 10 ? d.slice(0, 10) : d;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  const MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${MON[parseInt(m[2],10)-1]} ${parseInt(m[3],10)}, ${m[1]}`;
}

function emailKey(): string | null {
  return (
    process.env.RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    process.env.confi || // the products app stores its Resend key under this name
    null
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderNumber = String(body?.orderNumber ?? "").trim();
  const sequence = Number(body?.sequence);
  if (!orderNumber || !Number.isFinite(sequence)) {
    return NextResponse.json({ error: "orderNumber and sequence are required." }, { status: 400 });
  }

  // Re-fetch everything from the source of truth.
  let rows: any[];
  try {
    rows = await supaSelect("orders", {
      select:
        "id,order_number,customers(first_name,last_name,email)," +
        "order_line_items(name)," +
        "order_installments(sequence,label,kind,amount,due_date,status,stripe_payment_link_url)",
      order_number: `eq.${orderNumber}`,
      limit: "1",
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Database lookup failed: ${e?.message || e}` }, { status: 500 });
  }

  const order = rows?.[0];
  if (!order) return NextResponse.json({ error: `Order #${orderNumber} not found.` }, { status: 404 });

  const insts = order.order_installments || [];
  const inst = insts.find((i: any) => Number(i.sequence) === sequence);
  if (!inst) return NextResponse.json({ error: `Installment ${sequence} not found on order #${orderNumber}.` }, { status: 404 });

  if (inst.status === "paid") return NextResponse.json({ error: "That installment is already paid." }, { status: 409 });
  if (inst.status === "cancelled" || inst.status === "refunded") {
    return NextResponse.json({ error: `That installment is ${inst.status}; nothing to collect.` }, { status: 409 });
  }
  const link = inst.stripe_payment_link_url;
  if (!link) {
    return NextResponse.json(
      { error: "No Stripe payment link is on file for this installment. Create the link in the payment flow first." },
      { status: 409 },
    );
  }

  const cust = order.customers || {};
  const name = `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || "there";
  const to = (cust.email || "").trim();
  if (!to) return NextResponse.json({ error: "No email address on file for this customer." }, { status: 409 });

  const course = order.order_line_items?.[0]?.name || "your ConfiDentist course";
  const amount = num(inst.amount);
  const total = insts.filter((i: any) => i.status !== "cancelled" && i.status !== "refunded").length;
  const instNo = inst.label || (inst.kind === "deposit" ? "Deposit" : `Installment ${sequence} of ${total}`);
  const dueLabel = fmtDate(inst.due_date);

  const subject = "ConfiDentist — Your Course Installment Payment";
  const text =
`Hello ${name},

This is a reminder that your installment payment for ${course} is ready.

Installment: ${instNo}
Amount Due: ${money(amount)} CAD
Due Date: ${dueLabel}

You can securely complete your payment using the link below:
${link}

If you have already completed this payment, please disregard this reminder.

Thank you,
ConfiDentist Team`;

  const html =
`<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:#202B3A;line-height:1.6">
<p>Hello ${name},</p>
<p>This is a reminder that your installment payment for <strong>${course}</strong> is ready.</p>
<table style="border-collapse:collapse;margin:14px 0">
<tr><td style="padding:2px 14px 2px 0;color:#475467">Installment</td><td style="padding:2px 0;font-weight:600">${instNo}</td></tr>
<tr><td style="padding:2px 14px 2px 0;color:#475467">Amount due</td><td style="padding:2px 0;font-weight:600">${money(amount)} CAD</td></tr>
<tr><td style="padding:2px 14px 2px 0;color:#475467">Due date</td><td style="padding:2px 0;font-weight:600">${dueLabel}</td></tr>
</table>
<p><a href="${link}" style="display:inline-block;background:#175CD3;color:#fff;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:8px">Complete your payment securely</a></p>
<p style="color:#475467;font-size:13px">If the button doesn't work, copy this link into your browser:<br>${link}</p>
<p style="color:#475467;font-size:13px">If you have already completed this payment, please disregard this reminder.</p>
<p>Thank you,<br>ConfiDentist Team</p>
</div>`;

  const key = emailKey();
  const draft = { to, subject, text, link, amount, instNo, dueLabel, course };

  // No provider configured → return the draft, do NOT claim it was sent.
  if (!key) {
    return NextResponse.json(
      {
        sent: false,
        configured: false,
        error: "Automated email isn't configured on the dashboard yet. Add RESEND_API_KEY to the dashboard's environment to enable one-click sending. In the meantime you can copy the draft below.",
        draft,
      },
      { status: 503 },
    );
  }

  // Send via Resend.
  const from = process.env.PAYMENT_EMAIL_FROM || "ConfiDentist <noreply@confidentist.ca>";
  let resendRes: Response;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
  } catch (e: any) {
    return NextResponse.json({ sent: false, configured: true, error: `Email send failed: ${e?.message || e}`, draft }, { status: 502 });
  }
  const resendJson: any = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    return NextResponse.json(
      { sent: false, configured: true, error: `Email provider rejected the send: ${resendJson?.message || resendRes.status}`, draft },
      { status: 502 },
    );
  }

  // Record the action in the order activity log (best-effort — never fail the
  // send just because logging failed).
  let logged = false;
  try {
    await supaInsert("order_notes", [{
      order_id: order.id,
      content: `Payment link emailed to ${to} for ${instNo} (${money(amount)} CAD, due ${dueLabel}) via the admin dashboard.`,
      is_customer_note: false,
      author: "Admin Dashboard",
      date_created: new Date().toISOString(),
    }]);
    logged = true;
  } catch {
    logged = false;
  }

  return NextResponse.json({ sent: true, configured: true, logged, id: resendJson?.id ?? null });
}
