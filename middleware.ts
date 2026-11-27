import { NextRequest, NextResponse } from "next/server";

// Gate the whole dashboard behind HTTP Basic Auth.
// Credentials come from env: DASHBOARD_USER / DASHBOARD_PASS.
// Server-to-server endpoints are excluded here because they do their own auth:
//   /api/sync          → SYNC_SECRET header (cron / server-to-server)
//   /api/stripe-webhook → Stripe signature (STRIPE_WEBHOOK_SECRET)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_API = ["/api/sync", "/api/stripe-webhook"];

export function middleware(req: NextRequest) {
  if (PUBLIC_API.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;
  if (!user || !pass) {
    // Fail closed in production so the dashboard is never publicly open before
    // the login env vars are configured. In local dev, allow through.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "Dashboard authentication is not configured (set DASHBOARD_USER / DASHBOARD_PASS).",
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const header = req.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch {
      decoded = "";
    }
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ConfiDentist Dashboard", charset="UTF-8"' },
  });
}
