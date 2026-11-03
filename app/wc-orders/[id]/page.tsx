import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, Ban,
  CreditCard, User, Mail, Phone, Receipt, GraduationCap, CalendarClock,
  RotateCcw, ExternalLink, Wallet,
} from "lucide-react";
import { getOrder } from "@/lib/wc";
import { mapOrder } from "@/lib/wc-orders";
import { getInstallmentDetailByOrderNumber, type InstallmentRow } from "@/lib/db";
import { chargesByEmail, type StripeCharge } from "@/lib/stripe";
import CopyLinkButton from "./CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Design tokens (WCAG 2.2 AA — validated contrast on white/pale backgrounds) ──
const C = {
  ink: "#202B3A",      // primary text
  slate: "#475467",    // secondary text
  border: "#D0D5DD",
  line: "#EAECF0",
  blue: "#175CD3",     // primary action
  navy: "#101F43",
  bg: "#F7F9FC",
  cardBorder: "#E4E7EC",
};

function fmt(n: number): string {
  const abs = Math.abs(n);
  return (n < 0 ? "−" : "") + "$" +
    abs.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function torontoToday(): string {
  // "YYYY-MM-DD" in America/Toronto for lexicographic comparison with due dates.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return parts; // en-CA already yields YYYY-MM-DD
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const iso = d.length > 10 ? d.slice(0, 10) : d;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MON[parseInt(m[2],10)-1]} ${parseInt(m[3],10)}, ${m[1]}`;
}

// ── Installment financial state (distinct from a single payment attempt) ──
type DisplayStatus =
  | "Paid" | "Partially Paid" | "Due" | "Upcoming" | "Overdue" | "Failed" | "Cancelled" | "Refunded";

function deriveStatus(inst: InstallmentRow, today: string): DisplayStatus {
  switch (inst.status) {
    case "paid": return "Paid";
    case "failed": return "Failed";
    case "cancelled": return "Cancelled";
    case "refunded": return "Refunded";
    default: break; // pending
  }
  const due = inst.dueDate ? inst.dueDate.slice(0, 10) : null;
  if (due && due < today) return "Overdue";
  if (due && due === today) return "Due";
  return "Upcoming";
}

const STATUS_STYLE: Record<DisplayStatus, { bg: string; color: string; Icon: typeof CheckCircle2 }> = {
  "Paid":           { bg: "#ECFDF3", color: "#067647", Icon: CheckCircle2 },
  "Partially Paid": { bg: "#FFFAEB", color: "#B54708", Icon: Wallet },
  "Due":            { bg: "#EFF4FF", color: "#175CD3", Icon: CalendarClock },
  "Upcoming":       { bg: "#F2F4F7", color: "#475467", Icon: Clock },
  "Overdue":        { bg: "#FEF3F2", color: "#B42318", Icon: AlertTriangle },
  "Failed":         { bg: "#FEE4E2", color: "#B42318", Icon: XCircle },
  "Cancelled":      { bg: "#F2F4F7", color: "#475467", Icon: Ban },
  "Refunded":       { bg: "#F4F3FF", color: "#5925DC", Icon: RotateCcw },
};

function StatusChip({ status, size = "sm" }: { status: DisplayStatus; size?: "sm" | "md" }) {
  const s = STATUS_STYLE[status];
  const Icon = s.Icon;
  const pad = size === "md" ? "6px 12px" : "3px 9px";
  const fs = size === "md" ? 14 : 12.5;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color, padding: pad, fontSize: fs }}
    >
      <Icon size={size === "md" ? 15 : 13} aria-hidden="true" />
      {status}
    </span>
  );
}

function amountPaidOf(inst: InstallmentRow): number {
  return inst.status === "paid" ? inst.amount : 0;
}
function remainingOf(inst: InstallmentRow): number {
  if (inst.status === "paid" || inst.status === "cancelled" || inst.status === "refunded") return 0;
  return inst.amount;
}

// ── Summary stat tile ──
function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white p-4" style={{ border: `1px solid ${C.cardBorder}` }}>
      <p className="font-medium" style={{ color: C.slate, fontSize: 13 }}>{label}</p>
      <p className="font-bold mt-1" style={{ color: color || C.ink, fontSize: 22, lineHeight: 1.15 }}>{value}</p>
      {sub && <p className="mt-0.5" style={{ color: C.slate, fontSize: 12.5 }}>{sub}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, children, right }: {
  title: string; icon: typeof User; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white overflow-hidden" style={{ border: `1px solid ${C.cardBorder}` }}>
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Icon size={17} style={{ color: C.navy }} aria-hidden="true" />
        <h2 className="font-semibold" style={{ color: C.ink, fontSize: 15 }}>{title}</h2>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </section>
  );
}

export default async function WcOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let o: any;
  try {
    o = await getOrder(id);
  } catch (e: any) {
    return (
      <div style={{ padding: 24, maxWidth: 1120, margin: "0 auto" }}>
        <div className="rounded-xl p-5" style={{ background: "#FEF3F2", border: "1px solid #FECDCA", color: "#B42318" }}>
          <strong>Couldn’t load order #{id}.</strong> {e?.message || ""}
        </div>
        <Link href="/wc-orders" className="inline-flex items-center gap-1.5 mt-4 font-medium" style={{ color: C.blue, fontSize: 14 }}>
          <ArrowLeft size={15} /> Back to orders
        </Link>
      </div>
    );
  }

  const row = mapOrder(o);
  const b = o.billing || {};
  const today = torontoToday();

  // Supabase installment plan + live Stripe reconciliation, in parallel.
  const [plan, stripeCharges] = await Promise.all([
    getInstallmentDetailByOrderNumber(row.number).catch(() => null),
    (b.email ? chargesByEmail(b.email) : Promise.resolve([])).catch(() => [] as StripeCharge[]),
  ]);

  const insts = plan?.installments ?? [];
  const hasPlan = insts.length > 0;

  // Financials — prefer installment data, fall back to the WooCommerce order total.
  const orderTotal = plan?.totalAmount || row.total;
  const paid = hasPlan ? insts.reduce((s, i) => s + amountPaidOf(i), 0) : 0;
  const remaining = Math.max(0, orderTotal - paid);
  const paidCount = insts.filter((i) => i.status === "paid").length;
  const activeInsts = insts.filter((i) => i.status !== "cancelled" && i.status !== "refunded");
  const nextDue = activeInsts
    .filter((i) => i.status === "pending" || i.status === "failed")
    .slice()
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  const overdueCount = insts.filter((i) => deriveStatus(i, today) === "Overdue").length;
  const progressPct = orderTotal > 0 ? Math.min(100, Math.round((paid / orderTotal) * 100)) : 0;

  // Live Stripe reconciliation.
  const stripeCollected = stripeCharges.filter((c) => c.paid && !c.refunded).reduce((s, c) => s + c.amount, 0);
  const reconciled = Math.abs(stripeCollected - paid) < 1;

  const courseName = o.line_items?.[0]?.name || plan?.customerName || "—";
  const subtotal = parseFloat(o.total || "0") - parseFloat(o.total_tax || "0") - parseFloat(o.shipping_total || "0") + parseFloat(o.discount_total || "0");

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div style={{ padding: 24, maxWidth: 1120, margin: "0 auto" }} className="space-y-5">

        {/* ── Header ── */}
        <div>
          <Link href="/wc-orders" className="inline-flex items-center gap-1.5 font-medium mb-3" style={{ color: C.slate, fontSize: 14, minHeight: 32 }}>
            <ArrowLeft size={15} /> Back to Orders
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-bold flex items-center gap-3 flex-wrap" style={{ color: C.ink, fontSize: 26 }}>
                Order #{row.number}
                <span className="rounded-full font-semibold" style={{ background: row.statusBg, color: row.statusColor, fontSize: 14, padding: "5px 12px" }}>
                  {row.statusLabel}
                </span>
              </h1>
              <p className="mt-1.5" style={{ color: C.slate, fontSize: 15 }}>
                {row.customerName}{row.customerId ? ` · Customer #${row.customerId}` : ""} · Registered {row.dateLabel}
              </p>
            </div>
            {overdueCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold" style={{ background: "#FEF3F2", color: "#B42318", border: "1px solid #FECDCA", fontSize: 14 }}>
                <AlertTriangle size={16} /> {overdueCount} overdue installment{overdueCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* ── Financial summary ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Order total" value={fmt(orderTotal)} sub="CAD" />
          <Stat label="Amount paid" value={fmt(paid)} sub={`${progressPct}% of total`} color="#067647" />
          <Stat label="Remaining balance" value={fmt(remaining)} color={remaining > 0 ? (overdueCount > 0 ? "#B42318" : C.ink) : "#067647"} sub={hasPlan ? `${paidCount} of ${insts.length} installments paid` : "Paid in full"} />
          <Stat label="Next payment" value={nextDue ? fmt(nextDue.amount) : "—"} sub={nextDue ? `Due ${fmtDate(nextDue.dueDate)}` : "Nothing scheduled"} color={overdueCount > 0 ? "#B42318" : C.ink} />
        </div>

        {/* progress bar */}
        {orderTotal > 0 && (
          <div className="rounded-xl bg-white p-4" style={{ border: `1px solid ${C.cardBorder}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium" style={{ color: C.slate, fontSize: 13 }}>Payment progress</span>
              <span className="font-semibold" style={{ color: C.ink, fontSize: 13 }}>{fmt(paid)} <span style={{ color: C.slate, fontWeight: 400 }}>of {fmt(orderTotal)} CAD</span></span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#EAECF0" }} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Payment progress">
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: progressPct === 100 ? "#12B76A" : overdueCount > 0 ? "#D92D20" : C.blue }} />
            </div>
          </div>
        )}

        {/* ── Student + Billing ── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Student Information" icon={User}>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="font-semibold" style={{ color: C.ink, fontSize: 16 }}>{row.customerName}</p>
                {row.customerId ? <p style={{ color: C.slate, fontSize: 13 }}>Customer ID #{row.customerId}</p> : null}
              </div>
              <div className="space-y-2">
                <a href={`mailto:${b.email}`} className="flex items-center gap-2 font-medium" style={{ color: C.blue, fontSize: 14, minHeight: 32 }}>
                  <Mail size={15} aria-hidden="true" /> {b.email || "—"}
                </a>
                <a href={`tel:${b.phone}`} className="flex items-center gap-2 font-medium" style={{ color: C.blue, fontSize: 14, minHeight: 32 }}>
                  <Phone size={15} aria-hidden="true" /> {b.phone || "—"}
                </a>
              </div>
            </div>
          </Card>

          <Card title="Billing & Contact" icon={Receipt}>
            <div className="px-5 py-4" style={{ color: C.ink, fontSize: 14, lineHeight: 1.7 }}>
              {b.first_name} {b.last_name}<br />
              {b.address_1 || "—"}{b.address_2 ? `, ${b.address_2}` : ""}<br />
              {[b.city, b.state, b.postcode].filter(Boolean).join(" ")}<br />
              {b.country}
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <span style={{ color: C.slate, fontSize: 13 }}>Payment method: </span>
                <span style={{ color: C.ink, fontSize: 13 }}>{o.payment_method_title || o.payment_method || "—"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Courses & pricing ── */}
        <Card title="Courses & Pricing" icon={GraduationCap}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th className="text-left font-semibold px-5 py-3" style={{ color: C.slate }}>Course / Program</th>
                  <th className="text-center font-semibold px-3 py-3" style={{ color: C.slate }}>Qty</th>
                  <th className="text-right font-semibold px-5 py-3" style={{ color: C.slate }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(o.line_items || []).map((li: any, i: number) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="px-5 py-3" style={{ color: C.ink }}>{li.name}</td>
                    <td className="text-center px-3 py-3" style={{ color: C.slate }}>{li.quantity}</td>
                    <td className="text-right px-5 py-3 font-medium" style={{ color: C.ink }}>{fmt(parseFloat(li.total || "0"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end px-5 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <dl className="w-full" style={{ maxWidth: 340, fontSize: 14 }}>
              <Row k="Subtotal" v={fmt(subtotal)} />
              {parseFloat(o.discount_total || "0") > 0 && <Row k="Discount" v={`− ${fmt(parseFloat(o.discount_total))}`} />}
              {parseFloat(o.shipping_total || "0") > 0 && <Row k="Shipping" v={fmt(parseFloat(o.shipping_total))} />}
              <Row k="Tax" v={fmt(parseFloat(o.total_tax || "0"))} />
              <Row k="Order total" v={fmt(parseFloat(o.total || "0"))} bold />
              <Row k="Payments received" v={fmt(paid)} color="#067647" />
              <Row k="Remaining balance" v={fmt(remaining)} bold color={remaining > 0 ? C.ink : "#067647"} />
            </dl>
          </div>
        </Card>

        {/* ── Installment schedule ── */}
        {hasPlan && (
          <Card
            title="Installment Schedule"
            icon={CalendarClock}
            right={<span className="font-medium" style={{ color: C.slate, fontSize: 13 }}>{paidCount} of {insts.length} paid</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th className="text-left font-semibold px-5 py-3" style={{ color: C.slate }}>Installment</th>
                    <th className="text-left font-semibold px-3 py-3" style={{ color: C.slate }}>Due date</th>
                    <th className="text-right font-semibold px-3 py-3" style={{ color: C.slate }}>Amount due</th>
                    <th className="text-right font-semibold px-3 py-3" style={{ color: C.slate }}>Paid</th>
                    <th className="text-right font-semibold px-3 py-3" style={{ color: C.slate }}>Remaining</th>
                    <th className="text-left font-semibold px-3 py-3" style={{ color: C.slate }}>Status</th>
                    <th className="text-left font-semibold px-3 py-3" style={{ color: C.slate }}>Paid on</th>
                    <th className="text-right font-semibold px-5 py-3" style={{ color: C.slate }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {insts.map((inst) => {
                    const ds = deriveStatus(inst, today);
                    const ap = amountPaidOf(inst);
                    const rem = remainingOf(inst);
                    const label = inst.label || (inst.kind === "deposit" ? "Deposit" : `Installment ${inst.sequence} of ${insts.length}`);
                    const canSend = (inst.status === "pending" || inst.status === "failed");
                    return (
                      <tr key={inst.sequence} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td className="px-5 py-3.5" style={{ color: C.ink }}>
                          <span className="font-medium">{label}</span>
                        </td>
                        <td className="px-3 py-3.5" style={{ color: C.slate }}>{fmtDate(inst.dueDate)}</td>
                        <td className="text-right px-3 py-3.5 font-medium" style={{ color: C.ink }}>{fmt(inst.amount)}</td>
                        <td className="text-right px-3 py-3.5" style={{ color: ap > 0 ? "#067647" : C.slate }}>{ap > 0 ? fmt(ap) : "—"}</td>
                        <td className="text-right px-3 py-3.5" style={{ color: rem > 0 ? C.ink : C.slate }}>{rem > 0 ? fmt(rem) : "—"}</td>
                        <td className="px-3 py-3.5"><StatusChip status={ds} /></td>
                        <td className="px-3 py-3.5" style={{ color: C.slate }}>{inst.paidAt ? fmtDate(inst.paidAt) : "—"}</td>
                        <td className="text-right px-5 py-3.5">
                          {inst.status === "paid" ? (
                            <span style={{ color: C.slate, fontSize: 13 }}>—</span>
                          ) : canSend && inst.paymentLinkUrl ? (
                            <div className="inline-flex items-center gap-2">
                              <CopyLinkButton url={inst.paymentLinkUrl} />
                              <a href={inst.paymentLinkUrl} target="_blank" rel="noopener" aria-label="Open payment link in a new tab"
                                className="inline-flex items-center gap-1 font-semibold" style={{ color: C.blue, fontSize: 13, minHeight: 40, padding: "0 4px" }}>
                                <ExternalLink size={14} /> Open
                              </a>
                            </div>
                          ) : canSend ? (
                            <span style={{ color: C.slate, fontSize: 13 }}>No link yet</span>
                          ) : (
                            <span style={{ color: C.slate, fontSize: 13 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3" style={{ color: C.slate, fontSize: 12.5, borderTop: `1px solid ${C.line}` }}>
              Payment links shown here were generated through the authorized Stripe flow. “Copy link” / “Open” never charge a card or mark anything paid — status updates only when Stripe confirms the payment.
            </p>
          </Card>
        )}

        {/* ── Live Stripe reconciliation ── */}
        <Card
          title="Payment History — Stripe (live)"
          icon={CreditCard}
          right={
            <span className="rounded-full font-semibold" style={reconciled
              ? { background: "#ECFDF3", color: "#067647", padding: "4px 10px", fontSize: 12.5 }
              : { background: "#FFFAEB", color: "#B54708", padding: "4px 10px", fontSize: 12.5 }}>
              {reconciled ? "✓ Reconciled with dashboard" : "⚠ Mismatch — review"}
            </span>
          }
        >
          <div className="grid grid-cols-3 gap-4 px-5 py-4" style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.line}` }}>
            <div><p style={{ color: C.slate, fontSize: 12.5 }}>Dashboard — paid</p><p className="font-bold" style={{ color: C.ink, fontSize: 16 }}>{fmt(paid)} CAD</p></div>
            <div><p style={{ color: C.slate, fontSize: 12.5 }}>Stripe — collected</p><p className="font-bold" style={{ color: "#635BFF", fontSize: 16 }}>{fmt(stripeCollected)} CAD</p></div>
            <div><p style={{ color: C.slate, fontSize: 12.5 }}>Difference</p><p className="font-bold" style={{ color: reconciled ? "#067647" : "#B42318", fontSize: 16 }}>{fmt(stripeCollected - paid)} CAD</p></div>
          </div>
          {stripeCharges.length === 0 ? (
            <p className="px-5 py-6 text-center" style={{ color: C.slate, fontSize: 13.5 }}>
              No Stripe charges found for {b.email || "this customer"}. Payments may have been collected under a different email, or Stripe access isn’t configured for this environment.
            </p>
          ) : (
            <div>
              {stripeCharges.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-4 px-5 py-3.5" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {c.refunded ? <RotateCcw size={16} style={{ color: "#5925DC" }} /> : c.paid ? <CheckCircle2 size={16} style={{ color: "#067647" }} /> : <Clock size={16} style={{ color: "#B54708" }} />}
                    </span>
                    <div>
                      <p className="font-medium" style={{ color: C.ink, fontSize: 14 }}>{c.card}</p>
                      <p style={{ color: C.slate, fontSize: 12.5 }}>
                        Stripe · {fmtDate(c.created)}{c.description ? ` · ${c.description}` : ""}
                      </p>
                      {c.receiptUrl && (
                        <a href={c.receiptUrl} target="_blank" rel="noopener" className="font-semibold inline-flex items-center gap-1" style={{ color: "#635BFF", fontSize: 13 }}>
                          View receipt <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold" style={{ color: C.ink, fontSize: 15 }}>{fmt(c.amount)} {c.currency}</p>
                    <span className="rounded-full font-semibold" style={c.refunded
                      ? { background: "#F4F3FF", color: "#5925DC", padding: "3px 9px", fontSize: 12 }
                      : c.paid ? { background: "#ECFDF3", color: "#067647", padding: "3px 9px", fontSize: 12 }
                      : { background: "#FFFAEB", color: "#B54708", padding: "3px 9px", fontSize: 12 }}>
                      {c.refunded ? "Refunded" : c.paid ? "Paid" : c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p style={{ color: C.slate, fontSize: 12.5 }}>
          Order facts are read live from WooCommerce; the installment schedule is read from the ConfiDentist database; Stripe figures are read live. This page performs no store-changing or card-charging actions.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v, bold, color }: { k: string; v: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderTop: k === "Order total" ? `1px solid ${C.line}` : undefined }}>
      <dt style={{ color: C.slate, fontWeight: bold ? 600 : 400 }}>{k}</dt>
      <dd style={{ color: color || C.ink, fontWeight: bold ? 700 : 500, margin: 0 }}>{v}</dd>
    </div>
  );
}
