// Read-only Stripe lookups for reconciling a person's WooCommerce installments
// against what was actually collected in Stripe. Uses STRIPE_SECRET_KEY (read).
const SK = process.env.STRIPE_SECRET_KEY || "";
const BASE = "https://api.stripe.com/v1";

async function stripe(path: string, params: Record<string, string | number> = {}): Promise<any> {
  if (!SK) return { error: { message: "no STRIPE_SECRET_KEY" } };
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${SK}`, "Stripe-Version": "2023-10-16" },
    cache: "no-store",
  });
  return res.json();
}

export type StripeCharge = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  refunded: boolean;
  created: string;       // ISO date
  card: string;          // "Visa ···4242"
  receiptUrl: string | null;
  description: string | null;
};

function mapCharge(c: any): StripeCharge {
  const card = c.payment_method_details?.card;
  return {
    id: c.id,
    amount: (c.amount ?? 0) / 100,
    currency: (c.currency || "cad").toUpperCase(),
    status: c.status,
    paid: !!c.paid,
    refunded: !!c.refunded,
    created: new Date((c.created ?? 0) * 1000).toISOString(),
    card: card ? `${(card.brand || "card").replace(/^\w/, (m: string) => m.toUpperCase())} ···${card.last4}` : (c.payment_method_details?.type || "—"),
    receiptUrl: c.receipt_url ?? null,
    description: c.description ?? null,
  };
}

// All Stripe charges tied to a person's email (billing or receipt email).
export async function chargesByEmail(email: string): Promise<StripeCharge[]> {
  if (!SK || !email) return [];
  // Prefer the Search API (exact email match, all-time).
  const r = await stripe("/charges/search", { query: `billing_details.email:"${email}"`, limit: 100 });
  let data: any[] | null = r?.error ? null : r?.data;
  if (data == null) {
    // Fallback: scan recent charges and filter client-side.
    const r2 = await stripe("/charges", { limit: 100 });
    data = (r2?.data || []).filter((c: any) => {
      const e = (c.billing_details?.email || c.receipt_email || "").toLowerCase();
      return e === email.toLowerCase();
    });
  }
  return (data || []).map(mapCharge).sort((a, b) => a.created.localeCompare(b.created));
}

// Whether a given payment link has a completed (paid) checkout session.
export async function paymentLinkPaid(plinkId: string): Promise<boolean | null> {
  if (!SK || !plinkId) return null;
  const r = await stripe("/checkout/sessions", { payment_link: plinkId, limit: 10 });
  if (r?.error || !Array.isArray(r?.data)) return null;
  return r.data.some((s: any) => s.payment_status === "paid");
}
