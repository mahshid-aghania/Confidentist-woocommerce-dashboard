"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Real "Copy Payment Link" action — copies an existing Stripe payment link to the
// clipboard. No store/Stripe state is changed; nothing is marked paid. The link
// itself is generated/sent through the authorized payment flow elsewhere.
export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / insecure contexts.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy payment link to clipboard"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
      style={{
        minHeight: 40,
        background: copied ? "#DCFCE7" : "#EFF4FF",
        color: copied ? "#15803D" : "#175CD3",
        border: `1px solid ${copied ? "#86EFAC" : "#B2CCFF"}`,
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
