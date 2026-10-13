import "./styles.css";
import { fetchOrdersPage, monthOptions, monthToRange, type OrdersQuery } from "@/lib/wc-orders";
import WcOrdersClient from "./WcOrdersClient";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function WcOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(one(sp.page) || "1", 10) || 1);
  const orderbyRaw = one(sp.orderby) || "date";
  const orderby = (["date", "id", "total", "export"].includes(orderbyRaw)
    ? orderbyRaw
    : "date") as OrdersQuery["orderby"];
  const order = (one(sp.order) === "asc" ? "asc" : "desc") as "asc" | "desc";

  const month = one(sp.month) || ""; // "YYYY-MM" or ""
  const customerRaw = one(sp.customer) || ""; // numeric id or free text (name/email)

  const q: OrdersQuery = {
    page,
    perPage: PER_PAGE,
    status: "any",
    orderby,
    order,
  };
  const range = month ? monthToRange(month) : null;
  if (range) {
    q.after = range.after;
    q.before = range.before;
  }
  if (customerRaw) {
    if (/^\d+$/.test(customerRaw)) q.customer = parseInt(customerRaw, 10);
    else q.search = customerRaw;
  }

  let result;
  let error: string | null = null;
  try {
    result = await fetchOrdersPage(q);
  } catch (e: any) {
    error = e?.message || "Failed to load orders from WooCommerce.";
  }

  // Month options are derived from the newest visible order (falls back to the
  // first page's top row); purely for the "All dates" dropdown.
  const newestISO = result?.orders?.[0]?.dateISO || "";
  const months = monthOptions(newestISO || "2026-10-01", 24);

  if (error) {
    return (
      <div className="wcx">
        <div className="wcx-error">
          <strong>Couldn’t load orders.</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <WcOrdersClient
      orders={result!.orders}
      total={result!.total}
      totalPages={result!.totalPages}
      page={page}
      perPage={PER_PAGE}
      orderby={orderby!}
      order={order}
      month={month}
      customer={customerRaw}
      months={months}
      scanned={result!.scanned}
    />
  );
}
