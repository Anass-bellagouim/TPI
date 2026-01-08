import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const TYPE_OPTIONS = ["", "جنحة", "مخالفة", "حوادث"];

export default function AddDocument() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [file, setFile] = useState(null);

  const [type, setType] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [judgementNumber, setJudgementNumber] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [division, setDivision] = useState("");
  const [keyword, setKeyword] = useState("");

  const fileName = useMemo(() => file?.name || "", [file]);

  function resetForm() {
    setFile(null);
    setType("");
    setCaseNumber("");
    setJudgementNumber("");
    setJudgeName("");
    setDivision("");
    setKeyword("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!file) {
      setError("خاصك تختار ملف PDF قبل الرفع.");
      return;
    }

    // حماية بسيطة
    if (file.type !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
      setError("الملف خاصو يكون PDF.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      // ✅ مهم: اسم الحقل خاصو يكون "pdf" باش يطابق backend validation
      fd.append("pdf", file);

      // metadata
      fd.append("type", type || "");
      fd.append("case_number", caseNumber.trim());
      fd.append("judgement_number", judgementNumber.trim());
      fd.append("judge_name", judgeName.trim());
      fd.append("division", division.trim());
      fd.append("keyword", keyword.trim());

      const res = await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const doc = res.data?.data;
      setInfo(res.data?.message || "تم رفع الوثيقة بنجاح.");

      // من بعد الرفع، سير للتفاصيل
      if (doc?.id) {
        navigate(`/documents/${doc.id}`, { replace: true });
        return;
      }

      // إذا ما رجعش id لأي سبب، خليه غير يبين message
      resetForm();
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (typeof e2?.response?.data === "string" ? e2.response.data : null) ||
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
          <h2>إضافة وثيقة</h2>
          <p>رفع PDF + إدخال معلومات الوثيقة.</p>
        </div>
      </div>

      {info && (
        <div className="alert alertInfo card" style={{ marginBottom: 14 }}>
          {info}
        </div>
      )}

      {error && (
        <div className="alert alertError card" style={{ marginBottom: 14 }}>
          <strong>خطأ:</strong> {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={onSubmit}>
          <div className="field" style={{ marginBottom: 12 }}>
            <div className="label">ملف PDF</div>
            <input
              className="input"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <div className="help" style={{ marginTop: 6 }}>
              {file ? `الملف المختار: ${file.name}` : "اختار ملف PDF."}
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">نوع القضية</div>
              <select
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t || "all"} value={t}>
                    {t || "—"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">رقم الملف</div>
              <input
                className="input"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 2025/0001/7"
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">رقم الحكم</div>
              <input
                className="input"
                value={judgementNumber}
                onChange={(e) => setJudgementNumber(e.target.value)}
                placeholder="مثال: 2024/9"
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">اسم القاضي</div>
              <input
                className="input"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="مثال: محمد..."
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">الشعبة</div>
              <input
                className="input"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="مثال: الشعبة الأولى"
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">كلمة مفتاحية</div>
              <input
                className="input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="مثال: استئناف..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "رفع الوثيقة"}
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loading}
              onClick={resetForm}
            >
              مسح
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loading}
              onClick={() => navigate("/search")}
              style={{ marginInlineStart: "auto" }}
            >
              رجوع
            </button>
          </div>

          <div className="help" style={{ marginTop: 10 }}>
            ملاحظة: بعد الرفع، الوثيقة كتكون <strong>pending</strong> حتى يكمل استخراج النص
            (queue worker).
          </div>
        </form>
      </div>
    </div>
  );
}
