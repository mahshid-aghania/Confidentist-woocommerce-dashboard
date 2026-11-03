"use client";

import { useState } from "react";
import { Mail, Copy, Check, ExternalLink, X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  orderNumber: string;
  sequence: number;
  instLabel: string;
  amountLabel: string;
  dueLabel: string;
  email: string;
  customerName: string;
  course: string;
  url: string;
};

type Result =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; logged: boolean }
  | { kind: "not_configured"; message: string; draft: { subject: string; text: string } }
  | { kind: "error"; message: string };

export default function SendLinkDialog(props: Props) {
  const { orderNumber, sequence, instLabel, amountLabel, dueLabel, email, customerName, course, url } = props;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [copied, setCopied] = useState<"" | "link" | "draft">("");

  async function copy(text: string, which: "link" | "draft") {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(which);
    setTimeout(() => setCopied(""), 1800);
  }

  async function send() {
    setResult({ kind: "sending" });
    try {
      const res = await fetch("/api/payment-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, sequence }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sent) {
        setResult({ kind: "sent", logged: !!data.logged });
      } else if (res.status === 503 && data.draft) {
        setResult({ kind: "not_configured", message: data.error || "Email isn't configured.", draft: data.draft });
      } else {
        setResult({ kind: "error", message: data.error || `Send failed (HTTP ${res.status}).` });
      }
    } catch (e: any) {
      setResult({ kind: "error", message: e?.message || "Network error." });
    }
  }

  function close() { setOpen(false); setResult({ kind: "idle" }); }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg font-semibold"
        style={{ minHeight: 40, padding: "0 12px", background: "#175CD3", color: "#fff", fontSize: 13 }}
      >
        <Mail size={15} /> Send link
      </button>

      {open && (
        <div
          onClick={close}
          style={{ position: "fixed", inset: 0, background: "rgba(16,29,67,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px", zIndex: 1000, overflowY: "auto" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Send payment link"
            style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(16,29,67,0.3)", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", borderBottom: "1px solid #EAECF0" }}>
              <Mail size={18} style={{ color: "#101F43" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#202B3A" }}>Send payment link</h3>
              <button onClick={close} aria-label="Close" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#475467" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Confirmation details */}
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#475467" }}>
                Confirm the details below, then send the secure Stripe payment link to the student. Sending an email never charges a card or marks anything paid.
              </p>
              <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "7px 12px", margin: 0, fontSize: 14 }}>
                <dt style={{ color: "#475467" }}>Student</dt><dd style={{ margin: 0, color: "#202B3A", fontWeight: 500 }}>{customerName}</dd>
                <dt style={{ color: "#475467" }}>Email</dt><dd style={{ margin: 0, color: "#202B3A", fontWeight: 500 }}>{email}</dd>
                <dt style={{ color: "#475467" }}>Course</dt><dd style={{ margin: 0, color: "#202B3A" }}>{course}</dd>
                <dt style={{ color: "#475467" }}>Installment</dt><dd style={{ margin: 0, color: "#202B3A" }}>{instLabel}</dd>
                <dt style={{ color: "#475467" }}>Amount</dt><dd style={{ margin: 0, color: "#202B3A", fontWeight: 600 }}>{amountLabel} CAD</dd>
                <dt style={{ color: "#475467" }}>Due date</dt><dd style={{ margin: 0, color: "#202B3A" }}>{dueLabel}</dd>
              </dl>

              {/* Always-available fallbacks */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={() => copy(url, "link")} className="inline-flex items-center gap-1.5 rounded-lg font-semibold"
                  style={{ minHeight: 40, padding: "0 12px", fontSize: 13, background: copied === "link" ? "#ECFDF3" : "#EFF4FF", color: copied === "link" ? "#067647" : "#175CD3", border: `1px solid ${copied === "link" ? "#86EFAC" : "#B2CCFF"}` }}>
                  {copied === "link" ? <Check size={15} /> : <Copy size={15} />}{copied === "link" ? "Copied" : "Copy link"}
                </button>
                <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg font-semibold"
                  style={{ minHeight: 40, padding: "0 12px", fontSize: 13, color: "#175CD3", border: "1px solid #B2CCFF" }}>
                  <ExternalLink size={14} /> Open
                </a>
              </div>

              {/* Result states */}
              {result.kind === "sent" && (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#ECFDF3", color: "#067647", display: "flex", gap: 8, fontSize: 14 }}>
                  <CheckCircle2 size={18} />
                  <span>Email sent to {email}.{result.logged ? " Logged to the order activity." : ""}</span>
                </div>
              )}
              {result.kind === "error" && (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#FEF3F2", color: "#B42318", display: "flex", gap: 8, fontSize: 14 }}>
                  <AlertTriangle size={18} /> <span>{result.message}</span>
                </div>
              )}
              {result.kind === "not_configured" && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#FFFAEB", color: "#B54708", display: "flex", gap: 8, fontSize: 13.5 }}>
                    <AlertTriangle size={18} /> <span>{result.message}</span>
                  </div>
                  <label style={{ display: "block", marginTop: 12, fontSize: 12.5, color: "#475467", fontWeight: 600 }}>Email draft (copy &amp; paste)</label>
                  <textarea readOnly value={`Subject: ${result.draft.subject}\n\n${result.draft.text}`}
                    style={{ width: "100%", height: 150, marginTop: 6, fontSize: 12.5, fontFamily: "ui-monospace,Menlo,monospace", padding: 10, border: "1px solid #D0D5DD", borderRadius: 8, color: "#202B3A" }} />
                  <button onClick={() => copy(`Subject: ${result.draft.subject}\n\n${result.draft.text}`, "draft")}
                    className="inline-flex items-center gap-1.5 rounded-lg font-semibold"
                    style={{ marginTop: 8, minHeight: 40, padding: "0 12px", fontSize: 13, background: copied === "draft" ? "#ECFDF3" : "#EFF4FF", color: copied === "draft" ? "#067647" : "#175CD3", border: `1px solid ${copied === "draft" ? "#86EFAC" : "#B2CCFF"}` }}>
                    {copied === "draft" ? <Check size={15} /> : <Copy size={15} />}{copied === "draft" ? "Copied draft" : "Copy draft"}
                  </button>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid #EAECF0" }}>
              <button onClick={close} style={{ minHeight: 40, padding: "0 16px", borderRadius: 8, border: "1px solid #D0D5DD", background: "#fff", color: "#344054", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {result.kind === "sent" ? "Close" : "Cancel"}
              </button>
              {result.kind !== "sent" && (
                <button onClick={send} disabled={result.kind === "sending"}
                  className="inline-flex items-center gap-2"
                  style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, border: "none", background: "#175CD3", color: "#fff", fontSize: 14, fontWeight: 600, cursor: result.kind === "sending" ? "default" : "pointer", opacity: result.kind === "sending" ? 0.7 : 1 }}>
                  {result.kind === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {result.kind === "sending" ? "Sending…" : result.kind === "not_configured" || result.kind === "error" ? "Try again" : "Send email"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
