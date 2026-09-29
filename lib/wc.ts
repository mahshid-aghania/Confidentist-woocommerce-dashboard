// WooCommerce REST client for confidentist.ca.
// Two host quirks are handled here:
//  1. ModSecurity/WAF returns 406 for non-browser user-agents  -> send a browser UA.
//  2. The server strips the Authorization header               -> pass keys as query string.

const BASE = process.env.WC_STORE_URL || "https://www.confidentist.ca";
const CK = process.env.WC_CONSUMER_KEY || "";
const CS = process.env.WC_CONSUMER_SECRET || "";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function wc(
  path: string,
  params: Record<string, string | number> = {},
): Promise<any> {
  if (!CK || !CS) throw new Error("Missing WC_CONSUMER_KEY / WC_CONSUMER_SECRET");
  const url = new URL(`${BASE}/wp-json/wc/v3/${path}`);
  url.searchParams.set("consumer_key", CK);
  url.searchParams.set("consumer_secret", CS);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`WC ${path} returned non-JSON (${res.status}): ${text.slice(0, 160)}`);
  }
  if (json && json.code && json.data && json.data.status >= 400) {
    throw new Error(`WC ${path}: ${json.code} — ${json.message}`);
  }
  return json;
}

export const getOrder = (id: number | string) => wc(`orders/${id}`);

// List orders page-by-page. Returns [] when a page is empty.
export const listOrders = (params: Record<string, string | number>) =>
  wc("orders", { per_page: 100, ...params });
