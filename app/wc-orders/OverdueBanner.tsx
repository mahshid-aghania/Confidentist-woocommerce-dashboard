import Link from "next/link";
import type { Receivable } from "@/lib/db";

// The overdue "call list" that used to be the Accountant dashboard — now live
// from Supabase and surfaced on top of WC Orders. Collapsed by default; staff
// expand it to see who's behind. Pure server component, no JS required.

function money(n: number) {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function when(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function OverdueBanner({ people }: { people: Receivable[] }) {
  if (!people.length) return null;
  const total = people.reduce((s, p) => s + p.overdueAmount, 0);

  return (
    <details
      className="group"
      style={{
        margin: "16px 20px 0",
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          color: "#991B1B",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 22,
            height: 22,
            padding: "0 6px",
            borderRadius: 999,
            background: "#DC2626",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {people.length}
        </span>
        <span>
          student{people.length === 1 ? "" : "s"} overdue · ${money(total)} outstanding
        </span>
        <span style={{ marginLeft: "auto", fontWeight: 500, color: "#B91C1C", fontSize: 12 }}>
          tap to view ▾
        </span>
      </summary>

      <div style={{ borderTop: "1px solid #FECACA", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748B", background: "#FFF7F7" }}>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Student</th>
              <th style={{ padding: "8px 16px", fontWeight: 600, textAlign: "right" }}>Overdue</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Due since</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Contact</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Order</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const orderNo = p.orders[0] || "";
              return (
                <tr key={p.customerId} style={{ borderTop: "1px solid #F1F5F9", color: "#334155" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#0F1D3E" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{p.course || "—"}</div>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#DC2626", whiteSpace: "nowrap" }}>
                    ${money(p.overdueAmount)}
                    {p.hasFailed && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#B45309" }}>failed charge</div>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>{when(p.nextDue)}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>
                    {p.phone && (
                      <div><a href={`tel:${p.phone}`} style={{ color: "#2E4A97" }}>{p.phone}</a></div>
                    )}
                    {p.email && (
                      <div><a href={`mailto:${p.email}`} style={{ color: "#64748B" }}>{p.email}</a></div>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    {orderNo ? (
                      <Link href={`/wc-orders?customer=${encodeURIComponent(orderNo)}`} style={{ color: "#2E4A97", fontWeight: 600, textDecoration: "underline" }}>
                        #{orderNo}
                      </Link>
                    ) : "—"}
                    {p.orders.length > 1 && (
                      <span style={{ fontSize: 11, color: "#94A3B8" }}> +{p.orders.length - 1}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
