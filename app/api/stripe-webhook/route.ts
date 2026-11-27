// Stripe webhook → makes the dashboard live.
//
// Stripe calls this endpoint the instant a payment succeeds (a payment link is
// paid, a website checkout completes, or any charge goes through). We verify the
// signature, then reconcile the matching installment in Supabase right away, so
// WC Orders / Collections / Recent Payments all reflect the payment in real time
// instead of only when someone opens the Recent Payments page.
//
// Setup (once):
//   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
//      URL:    https://dashboard.confidentist.ca/api/stripe-webhook
//      Events: checkout.session.completed, charge.succeeded, payment_intent.succeeded
//   2. Copy the signing secret (whsec_…) and set it as STRIPE_WEBHOOK_SECRET in Vercel.
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { reconcileForWebhook } from "@/lib/live-payments";

export const runtime = "nodejs";        // need the raw body + node crypto
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const TOLERANCE = 5 * 60; // seconds — reject events whose timestamp is too far off

// Events worth reconciling on. Others (refunds, disputes, test pings) are acked and ignored.
const HANDLED = new Set([
  "checkout.session.completed",
  "charge.succeeded",
  "payment_intent.succeeded",
]);

// Verify Stripe's `Stripe-Signature` header without the SDK.
// Header looks like: t=1699999999,v1=hexmac,v1=hexmac2
function verify(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const t = parts["t"];
  if (!t) return false;
  // Replay protection.
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > TOLERANCE) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`, "utf8")
    .digest("hex");
  // Stripe may send several v1 signatures (during secret rotation); accept any match.
  const provided = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  const exp = Buffer.from(expected, "hex");
  return provided.some((sig) => {
    try {
      const got = Buffer.from(sig, "hex");
      return got.length === exp.length && crypto.timingSafeEqual(got, exp);
    } catch {
      return false;
    }
  });
}

export async function POST(req: Request) {
  if (!SECRET) {
    // Fail loud: without the secret we can't trust anything Stripe sends.
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!verify(raw, sig, SECRET)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const type = String(event?.type || "");
  if (!HANDLED.has(type)) {
    // Acknowledge so Stripe doesn't retry events we intentionally ignore.
    return NextResponse.json({ ok: true, ignored: type });
  }

  try {
    const summary = await reconcileForWebhook(2);
    return NextResponse.json({ ok: true, type, ...summary });
  } catch (e: any) {
    // Return 500 so Stripe retries later; the live check on the page is the backstop.
    return NextResponse.json({ error: e?.message || "reconcile failed", type }, { status: 500 });
  }
}

// A GET is handy for a quick "is it deployed / configured?" check in the browser.
export async function GET() {
  return NextResponse.json({
    endpoint: "stripe-webhook",
    configured: !!SECRET,
    handles: [...HANDLED],
  });
}
