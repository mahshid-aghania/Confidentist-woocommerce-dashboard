// Minimal Supabase REST (PostgREST) helper using the service-role key.
// Server-only — the service key bypasses RLS, never expose it to the client.

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function sb(
  table: string,
  init: RequestInit & { params?: Record<string, string> } = {},
): Promise<any> {
  if (!URL_BASE || !KEY) throw new Error("Missing Supabase URL / service role key");
  const url = new URL(`${URL_BASE}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(init.params || {})) url.searchParams.set(k, v);
  const { params, ...rest } = init;
  const res = await fetch(url.toString(), {
    ...rest,
    cache: "no-store",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${table} ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export function supaSelect(table: string, params: Record<string, string>) {
  return sb(table, { method: "GET", params });
}

// Upsert on a unique column (onConflict). Returns the affected rows.
export function supaUpsert(table: string, rows: any[], onConflict: string) {
  return sb(table, {
    method: "POST",
    params: { on_conflict: onConflict },
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
}

export function supaInsert(table: string, rows: any[]) {
  return sb(table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
}

export function supaUpdate(table: string, patch: any, match: Record<string, string>) {
  return sb(table, {
    method: "PATCH",
    params: match,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
}

export function supaDelete(table: string, match: Record<string, string>) {
  return sb(table, { method: "DELETE", params: match, headers: { Prefer: "return=minimal" } });
}
