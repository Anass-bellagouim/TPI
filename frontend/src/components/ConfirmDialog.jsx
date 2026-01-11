// src/components/ConfirmDialog.jsx
import React, { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title = "تأكيد العملية",
  message = "هل أنت متأكد؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // focus cancel button by default for safety
    setTimeout(() => cancelBtnRef.current?.focus?.(), 0);

    function onKeyDown(e) {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Tab") {
        // simple focus trap
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirmOverlay"
      role="presentation"
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onCancel?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--border)",
            background: "linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,0))",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: danger ? "rgba(220,38,38,.12)" : "rgba(37,99,235,.12)",
              color: danger ? "#dc2626" : "#2563eb",
              fontWeight: 900,
            }}
          >
            {danger ? "!" : "i"}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
            <div style={{ color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
              {message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btnSecondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn ${danger ? "btnDanger" : "btnPrimary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
