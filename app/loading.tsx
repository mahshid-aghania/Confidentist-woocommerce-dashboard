// Shown instantly when switching tabs while the next page loads its data
// (WooCommerce / Supabase / Stripe), so navigation never looks frozen.
export default function Loading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3 mb-6">
        <span
          className="inline-block w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "#CBD5E1", borderTopColor: "#2E4A97" }}
        />
        <span className="text-sm font-medium" style={{ color: "#64748B" }}>Loading…</span>
      </div>
      <div className="h-7 w-64 rounded-lg mb-6" style={{ background: "#E2E8F0" }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "#E2E8F0" }} />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 rounded-lg" style={{ background: "#EEF2F6" }} />
        ))}
      </div>
    </div>
  );
}
