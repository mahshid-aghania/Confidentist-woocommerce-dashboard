import { NextRequest, NextResponse } from "next/server";

// Gate the whole dashboard behind HTTP Basic Auth.
// Credentials come from env: DASHBOARD_USER / DASHBOARD_PASS.
// The /api/sync route is excluded here because it has its own SYNC_SECRET header auth
// (so cron / server-to-server calls still work).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/sync")) {
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
