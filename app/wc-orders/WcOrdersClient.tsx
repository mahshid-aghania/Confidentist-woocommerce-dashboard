"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatMoney, type OrderRow } from "@/lib/wc-orders";

type Props = {
  orders: OrderRow[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
  orderby: "date" | "id" | "total" | "export";
  order: "asc" | "desc";
  month: string;
  customer: string;
  months: { value: string; label: string }[];
  scanned: boolean;
};

// column key -> the REST orderby value behind it
const SORT_KEY: Record<string, Props["orderby"]> = {
  order: "id",
  date: "date",
  total: "total",
  export: "export",
};

function SortArrows({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  const up = active && dir === "asc" ? "#2271b1" : "#a7aaad";
  const down = active && dir === "desc" ? "#2271b1" : "#a7aaad";
  return (
    <span className="wcx-sort-arrows" aria-hidden>
      <svg width="8" height="5" viewBox="0 0 8 5">
        <path d="M4 0l4 5H0z" fill={up} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5">
        <path d="M4 5L0 0h8z" fill={down} />
      </svg>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function WcOrdersClient(props: Props) {
  const router = useRouter();
  const { orders, total, totalPages, page, orderby, order, month, customer, months, scanned } = props;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pageInput, setPageInput] = useState(String(page));
  const [customerInput, setCustomerInput] = useState(customer);
  const [monthSel, setMonthSel] = useState(month);
  const [bulkNote, setBulkNote] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);

  const allChecked = orders.length > 0 && orders.every((o) => selected.has(o.id));

  // Build a URL preserving current state, overriding with `patch`.
  const buildUrl = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      page: String(page),
      orderby,
      order,
      month: month || undefined,
      customer: customer || undefined,
    };
    const merged = { ...base, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? undefined : String(v)])) };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && v === "1")) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/wc-orders?${qs}` : "/wc-orders";
  };

  const go = (patch: Record<string, string | number | undefined>) => router.push(buildUrl(patch));

  const onSort = (col: keyof typeof SORT_KEY) => {
    const key = SORT_KEY[col];
    const nextDir = orderby === key && order === "desc" ? "asc" : orderby === key && order === "asc" ? "desc" : "desc";
    go({ orderby: key, order: nextDir, page: 1 });
  };

  const applyFilters = () => {
    go({ month: monthSel || undefined, customer: customerInput || undefined, page: 1 });
  };

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(orders.map((o) => o.id)));
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const gotoPage = (n: number) => {
    const target = Math.min(Math.max(1, n), totalPages);
    go({ page: target });
  };

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (month) p.set("month", month);
    if (customer) p.set("customer", customer);
    p.set("orderby", orderby);
    p.set("order", order);
    const qs = p.toString();
    return `/api/wc-orders/export${qs ? `?${qs}` : ""}`;
  }, [month, customer, orderby, order]);

  const SortableTh = ({ col, label, align }: { col: keyof typeof SORT_KEY; label: string; align?: "right" | "center" }) => {
    const key = SORT_KEY[col];
    const active = orderby === key;
    return (
      <th className={align === "right" ? "wcx-col-total" : align === "center" ? "wcx-col-export" : undefined}>
        <span className="wcx-th-sortable" onClick={() => onSort(col)} role="button" tabIndex={0}>
          {label}
          <SortArrows active={active} dir={order} />
        </span>
      </th>
    );
  };

  const header = (
    <div className="wcx-toolbar">
      <select className="wcx-select" defaultValue="" aria-label="Bulk actions" style={{ minWidth: 150 }}>
        <option value="">Bulk actions</option>
        <option value="trash">Move to Trash</option>
      </select>
      <button className="wcx-btn" onClick={() => setBulkNote(true)}>Apply</button>

      <select
        className="wcx-select"
        value={monthSel}
        onChange={(e) => setMonthSel(e.target.value)}
        aria-label="Filter by date"
        style={{ minWidth: 120 }}
      >
        <option value="">All dates</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        className="wcx-select"
        defaultValue=""
        aria-label="Filter by sales channel"
        title="Sales channel is not exposed by this store's WooCommerce REST API"
        style={{ minWidth: 150 }}
      >
        <option value="">All sales channels</option>
      </select>

      <input
        className="wcx-input"
        placeholder="Filter by registered customer"
        value={customerInput}
        onChange={(e) => setCustomerInput(e.target.value)}
        style={{ minWidth: 220 }}
        aria-label="Filter by registered customer"
      />

      <button className="wcx-btn" onClick={applyFilters}>Filter</button>
      <a className="wcx-btn" href={exportHref}>Export to CSV</a>

      <div className="wcx-toolbar-right">
        <span className="wcx-count">{total.toLocaleString("en-US")} items</span>
        <button className="wcx-pag-btn" disabled={page <= 1} onClick={() => gotoPage(1)} aria-label="First page">«</button>
        <button className="wcx-pag-btn" disabled={page <= 1} onClick={() => gotoPage(page - 1)} aria-label="Previous page">‹</button>
        <input
          className="wcx-pag-input"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") gotoPage(parseInt(pageInput || "1", 10)); }}
          onBlur={() => setPageInput(String(page))}
          aria-label="Current page"
        />
        <span className="wcx-pag-text">of {totalPages.toLocaleString("en-US")}</span>
        <button className="wcx-pag-btn" disabled={page >= totalPages} onClick={() => gotoPage(page + 1)} aria-label="Next page">›</button>
        <button className="wcx-pag-btn" disabled={page >= totalPages} onClick={() => gotoPage(totalPages)} aria-label="Last page">»</button>
      </div>
    </div>
  );

  return (
    <div className="wcx">
      {header}

      {bulkNote && (
        <div className="wcx-banner">
          This view is read-only — bulk actions are displayed but not executed. Selected: {selected.size} order(s).
        </div>
      )}
      {scanned && (
        <div className="wcx-banner">
          Sorted across the full {total.toLocaleString("en-US")}-order dataset (WooCommerce REST can’t order by this
          column, so every matching order was fetched and sorted server-side).
        </div>
      )}

      <table className="wcx-table">
        <thead>
          <tr>
            <th className="wcx-col-check">
              <input type="checkbox" className="wcx-check" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
            </th>
            <SortableTh col="order" label="Order" />
            <th className="wcx-col-eye"></th>
            <SortableTh col="date" label="Date" />
            <th>Status</th>
            <SortableTh col="total" label="Total" align="right" />
            <SortableTh col="export" label="Export Status" align="center" />
            <th>Origin</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={8}><div className="wcx-empty">No orders found.</div></td>
            </tr>
          )}
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="wcx-col-check">
                <input type="checkbox" className="wcx-check" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} aria-label={`Select order ${o.number}`} />
              </td>
              <td>
                <a className="wcx-order-link" href={`/wc-orders/${o.id}`}>
                  #{o.number} {o.customerName}
                </a>
              </td>
              <td className="wcx-col-eye">
                <button className="wcx-eye" onClick={() => setPreview(o.id)} aria-label={`Preview order ${o.number}`}>
                  <EyeIcon />
                </button>
              </td>
              <td style={{ color: "#50575e" }}>{o.dateLabel}</td>
              <td>
                <span className="wcx-badge" style={{ background: o.statusBg, color: o.statusColor }}>
                  {o.statusLabel}
                </span>
              </td>
              <td className="wcx-col-total">
                <span className="wcx-total">
                  {o.hasRefund ? (
                    <>
                      <del>{formatMoney(o.total)}</del>
                      <ins>{formatMoney(o.net)}</ins>
                    </>
                  ) : (
                    formatMoney(o.total)
                  )}
                </span>
              </td>
              <td className="wcx-col-export">
                {o.exportStatus ? o.exportStatus : <span className="wcx-dash">—</span>}
              </td>
              <td className="wcx-origin">{o.origin}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {preview !== null && <PreviewModal id={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function PreviewModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/wc-orders/${id}/preview`)
      .then((r) => r.json())
      .then((d) => { if (alive) (d.error ? setErr(d.error) : setData(d)); })
      .catch((e) => { if (alive) setErr(String(e)); });
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="wcx-modal-backdrop" onClick={onClose}>
      <div className="wcx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wcx-modal-head">
          <div className="wcx-modal-title">{data ? `Order #${data.number}` : "Order preview"}</div>
          <button className="wcx-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="wcx-modal-body">
          {err && <div className="wcx-error" style={{ margin: 0 }}>{err}</div>}
          {!err && !data && <div>Loading…</div>}
          {data && (
            <>
              <dl className="wcx-kv">
                <dt>Status</dt><dd>{data.statusLabel}</dd>
                <dt>Date</dt><dd>{data.dateLabel}</dd>
                <dt>Customer</dt><dd>{data.customerName}{data.email ? ` · ${data.email}` : ""}</dd>
                {data.phone && (<><dt>Phone</dt><dd>{data.phone}</dd></>)}
                <dt>Origin</dt><dd>{data.origin}</dd>
                <dt>Payment</dt><dd>{data.paymentMethod || "—"}</dd>
              </dl>
              <table className="wcx-mini-table">
                <thead><tr><th>Item</th><th>Qty</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {data.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td>{it.quantity}</td>
                      <td style={{ textAlign: "right" }}>{it.total}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ textAlign: "right", fontWeight: 600 }}>Order total</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{data.orderTotal}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 14 }}>
                <a className="wcx-btn" href={`/wc-orders/${id}`}>Open full order →</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
