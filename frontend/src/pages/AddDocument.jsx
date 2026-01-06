import React, { useMemo, useState } from "react";
import api from "../api.js";

const TYPE_OPTIONS = [
  { value: "جنحة", label: "جنحة" },
  { value: "مخالفة", label: "مخالفة" },
  { value: "حوادث", label: "حوادث" },
];

function isPdf(file) {
  if (!file) return false;
  const byType = file.type === "application/pdf";
  const byName = file.name?.toLowerCase().endsWith(".pdf");
  return byType || byName;
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    pending: "badge badgePending",
    processing: "badge badgeProcessing",
    done: "badge badgeDone",
    failed: "badge badgeFailed",
  };
  const cls = map[s] || "badge badgePending";

  const labelMap = {
    pending: "في الانتظار",
    processing: "قيد المعالجة",
    done: "تم الاستخراج",
    failed: "فشل الاستخراج",
  };

  return (
    <span className={cls}>
      <span className="dot" />
      {labelMap[s] || status || "pending"}
    </span>
  );
}

export default function AddDocument() {
  const [type, setType] = useState(TYPE_OPTIONS[0].value);
  const [judgementNumber, setJudgementNumber] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const fileHint = useMemo(() => {
    if (!file) return "اختار ملف PDF من هنا.";
    if (!isPdf(file)) return "الملف ماشي PDF. رجاءً اختار PDF صحيح.";
    return `تم اختيار: ${file.name}`;
  }, [file]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("خاصك تختار ملف PDF قبل الإرسال.");
      return;
    }
    if (!isPdf(file)) {
      setError("الملف المختار ماشي PDF.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("type", type);
      if (judgementNumber) form.append("judgement_number", judgementNumber);
      if (caseNumber) form.append("case_number", caseNumber);
      if (judgeName) form.append("judge_name", judgeName);
      form.append("file", file);

      const res = await api.post("/api/documents", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const doc = res.data?.document ?? res.data;
      setSuccess({
        id: doc?.id,
        status: doc?.extract_status || "pending",
      });

      // Reset
      setJudgementNumber("");
      setCaseNumber("");
      setJudgeName("");
      setFile(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء رفع الوثيقة.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>إضافة وثيقة قضائية</h2>
          <p>دير المعلومات فاليمين ورفع الملف فاليسر بطريقة واضحة.</p>
        </div>
      </div>

      {success && (
        <div className="alert alertSuccess card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div><strong>تم الرفع بنجاح.</strong></div>
            <div>المعرف: <strong>{success.id ?? "—"}</strong></div>
            <StatusBadge status={success.status} />
          </div>
        </div>
      )}

      {error && (
        <div className="alert alertError card" style={{ marginBottom: 14 }}>
          <strong>خطأ:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="addLayout">
        {/* RIGHT: inputs */}
        <div className="card">
          <div className="grid2">
            <div className="field">
              <div className="label">نوع القضية (مطلوب)</div>
              <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">رقم الحكم (اختياري)</div>
              <input
                className="input"
                value={judgementNumber}
                onChange={(e) => setJudgementNumber(e.target.value)}
                placeholder="مثال: 2024/123"
              />
            </div>

            <div className="field">
              <div className="label">رقم الملف (اختياري)</div>
              <input
                className="input"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 01/2025"
              />
            </div>

            <div className="field">
              <div className="label">اسم القاضي (اختياري)</div>
              <input
                className="input"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="مثال: الأستاذ(ة) ..."
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 14 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "جاري الإرسال..." : "رفع الوثيقة"}
            </button>
          </div>
        </div>

        {/* LEFT: big upload */}
        <div className="card uploadCard">
          <div className="dropZone">
            <strong>رفع ملف PDF</strong>
            <div className="help">
              اختار PDF واضح. إلا كان Scanned، النظام غادي يدير OCR.
            </div>

            <div style={{ marginTop: 12 }}>
              <input
                className="bigFileInput"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <div className="fileNamePill">
                  {isPdf(file) ? "✅ " : "⚠️ "} {file.name}
                </div>
              )}
              {!file && <div className="help" style={{ marginTop: 10 }}>{fileHint}</div>}
              {file && !isPdf(file) && (
                <div className="help" style={{ marginTop: 10, color: "#b42318" }}>
                  الملف ماشي PDF.
                </div>
              )}
            </div>
          </div>

          <div className="footerNote">
            نصيحة: خلّي حجم الملف أقل من 20MB باش الرفع يكون سريع.
          </div>
        </div>
      </form>
    </div>
  );
}
