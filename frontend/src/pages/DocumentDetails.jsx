import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { API_BASE_URL, storageUrl } from "../api.js";

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

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  // edit mode
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    type: "",
    judgement_number: "",
    case_number: "",
    judge_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  const pdfUrl = useMemo(() => {
    if (!doc?.file_path) return null;
    return storageUrl(doc.file_path);
  }, [doc]);

  const downloadUrl = useMemo(() => {
    return `${API_BASE_URL}/api/documents/${id}/download`;
  }, [id]);

  async function fetchDoc() {
    setError(null);
    setMsg(null);

    try {
      setLoading(true);
      const res = await api.get(`/api/documents/${id}`);
      setDoc(res.data);

      // حضّر الفورم للتعديل
      setForm({
        type: res.data?.type || "",
        judgement_number: res.data?.judgement_number || "",
        case_number: res.data?.case_number || "",
        judge_name: res.data?.judge_name || "",
      });
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "تعذر تحميل تفاصيل الوثيقة.";
      setError(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSave() {
    setMsg(null);
    setError(null);

    try {
      setSaving(true);
      const payload = {
        type: form.type,
        judgement_number: form.judgement_number || null,
        case_number: form.case_number || null,
        judge_name: form.judge_name || null,
      };

      const res = await api.put(`/api/documents/${id}`, payload);
      const updated = res.data?.document || res.data;

      setDoc((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      setEditing(false);
      setMsg("✅ تم تعديل الوثيقة بنجاح.");
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء التعديل.";
      setError(m);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setMsg(null);
    setError(null);

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد الوثيقة؟ هاد العملية نهائية.");
    if (!ok) return;

    try {
      setDeleting(true);
      await api.delete(`/api/documents/${id}`);
      navigate("/search");
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء الحذف.";
      setError(m);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>تفاصيل الوثيقة #{id}</h2>
          <p>معاينة PDF + تحميل مباشر + تعديل/حذف.</p>
        </div>

        <div className="rowActions">
          <Link className="btn btnSecondary" to="/search">
            رجوع للبحث
          </Link>

          {pdfUrl && (
            <>
              <a className="btn btnSecondary" href={pdfUrl} target="_blank" rel="noreferrer">
                فتح PDF
              </a>
              <a className="btn btnPrimary" href={downloadUrl}>
                تحميل PDF
              </a>
            </>
          )}

          {!editing ? (
            <>
              <button className="btn btnSecondary" onClick={() => setEditing(true)} disabled={!doc}>
                تعديل
              </button>
              <button className="btn btnDanger" onClick={onDelete} disabled={!doc || deleting}>
                {deleting ? "جاري الحذف..." : "حذف"}
              </button>
            </>
          ) : (
            <>
              <button className="btn btnPrimary" onClick={onSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button
                className="btn btnSecondary"
                onClick={() => {
                  // رجّع القيم الأصلية
                  setForm({
                    type: doc?.type || "",
                    judgement_number: doc?.judgement_number || "",
                    case_number: doc?.case_number || "",
                    judge_name: doc?.judge_name || "",
                  });
                  setEditing(false);
                }}
                disabled={saving}
              >
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="alert alertInfo card" style={{ marginBottom: 14 }}>
          جاري التحميل...
        </div>
      )}

      {msg && (
        <div className="alert alertSuccess card" style={{ marginBottom: 14 }}>
          {msg}
        </div>
      )}

      {error && (
        <div className="alert alertError card" style={{ marginBottom: 14 }}>
          <strong>خطأ:</strong> {error}
        </div>
      )}

      {doc && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="rowActions" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>الحالة:</strong> <StatusBadge status={doc.extract_status} />
              </div>

              {doc.extract_status === "failed" && doc.extract_error && (
                <div className="help" style={{ maxWidth: 520 }}>
                  <strong>سبب الفشل:</strong> {doc.extract_error}
                </div>
              )}
            </div>

            {!editing ? (
              <div style={{ marginTop: 12 }} className="kv">
                <div><span className="k">النوع:</span> {doc.type || "—"}</div>
                <div><span className="k">اسم الملف:</span> {doc.original_filename || "—"}</div>
                <div><span className="k">رقم الحكم:</span> {doc.judgement_number || "—"}</div>
                <div><span className="k">رقم الملف:</span> {doc.case_number || "—"}</div>
                <div><span className="k">اسم القاضي:</span> {doc.judge_name || "—"}</div>
                <div><span className="k">تاريخ الإضافة:</span> {doc.created_at || "—"}</div>
              </div>
            ) : (
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field">
                  <div className="label">النوع</div>
                  <select
                    className="select"
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="جنحة">جنحة</option>
                    <option value="مخالفة">مخالفة</option>
                    <option value="حوادث">حوادث</option>
                  </select>
                </div>

                <div className="field">
                  <div className="label">رقم الحكم</div>
                  <input
                    className="input"
                    value={form.judgement_number}
                    onChange={(e) => setForm((p) => ({ ...p, judgement_number: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <div className="label">رقم الملف</div>
                  <input
                    className="input"
                    value={form.case_number}
                    onChange={(e) => setForm((p) => ({ ...p, case_number: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <div className="label">اسم القاضي</div>
                  <input
                    className="input"
                    value={form.judge_name}
                    onChange={(e) => setForm((p) => ({ ...p, judge_name: e.target.value }))}
                  />
                </div>

                <div className="help" style={{ gridColumn: "1 / -1" }}>
                  ملاحظة: التعديل هنا غير metadata (type, numbers, judge). رفع ملف جديد نقدروا نزيدوه من بعد إذا بغيتي.
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="rowActions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <strong>معاينة PDF</strong>
                <div className="help">
                  إذا ما بانش PDF هنا، استعمل “فتح PDF” أو “تحميل PDF”.
                </div>
              </div>
            </div>

            {pdfUrl ? (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <iframe
                  title={`PDF_${id}`}
                  src={pdfUrl}
                  style={{ width: "100%", height: "75vh", border: "0", display: "block" }}
                />
              </div>
            ) : (
              <div className="alert alertInfo">ما كاينش file_path باش نعرضو PDF.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
