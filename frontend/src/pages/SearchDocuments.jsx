import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    pending: { cls: "badge badgePending", label: "في الانتظار" },
    processing: { cls: "badge badgeProcessing", label: "قيد المعالجة" },
    done: { cls: "badge badgeDone", label: "تم الاستخراج" },
    failed: { cls: "badge badgeFailed", label: "فشل الاستخراج" },
  };
  const m = map[s] || { cls: "badge badgePending", label: status || "pending" };

  return (
    <span className={m.cls}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

export default function SearchDocuments() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState("أدخل كلمة/رقم للبحث (رقم الحكم، رقم الملف، اسم القاضي...).");

  async function doSearch() {
    setError(null);
    setInfo(null);
    setRows([]);

    const query = q.trim();
    if (!query) {
      setInfo("خاصك تدخل قيمة فـ خانة البحث.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/api/documents/search", {
        params: { q: query },
      });

      // نتوقع Array ديال النتائج
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.results ?? []);
      setRows(Array.isArray(data) ? data : []);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setInfo("ما لقيْنا حتى نتيجة بهاد البحث.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء البحث.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    doSearch();
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>البحث في الوثائق</h2>
          <p>البحث كيرجع النتائج بدون content_text باش يبقى response خفيف.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={onSubmit}>
          <div className="rowActions">
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="مثال: 2024/123 أو اسم القاضي..."
              style={{ minWidth: 280, flex: 1 }}
            />
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "جاري البحث..." : "بحث"}
            </button>
          </div>
          <div className="help" style={{ marginTop: 8 }}>
            تلميح: جرّب رقم الحكم / رقم الملف / الاسم.
          </div>
        </form>
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

      {rows.length > 0 && (
        <div className="card">
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>النوع</th>
                  <th>اسم الملف الأصلي</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.type || "—"}</td>
                    <td title={r.original_filename}>
                      {r.original_filename || "—"}
                    </td>
                    <td>
                      <StatusBadge status={r.extract_status} />
                    </td>
                    <td>
                      <div className="rowActions">
                        <Link className="btn btnSecondary" to={`/documents/${r.id}`}>
                          عرض التفاصيل
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="footerNote">
            إذا كانت الحالة "قيد المعالجة"، عاود فتح التفاصيل من بعد.
          </div>
        </div>
      )}
    </div>
  );
}
