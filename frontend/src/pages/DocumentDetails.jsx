import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { API_BASE_URL } from "../api.js";
import { AuthContext } from "../auth/AuthContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

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

  const auth = useContext(AuthContext);
  const user = auth?.user;

  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  const [pdfBlobUrl, setPdfBlobUrl] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    type: "",
    judgement_number: "",
    case_number: "",
    judge_name: "",
    division: "",
    keyword: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  // ✅ confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);

  const downloadApiUrl = useMemo(() => {
    return `${API_BASE_URL}/api/documents/${id}/download`;
  }, [id]);

  const caseTypeText = useMemo(() => {
    const name = (doc?.type || "").trim();
    const code = (doc?.keyword || "").trim();
    if (name && code) return `${name} (${code})`;
    if (name) return name;
    if (code) return code;
    return "—";
  }, [doc]);

  async function fetchDoc() {
    setError(null);
    setMsg(null);

    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      const d = res.data?.data || res.data;

      setDoc(d);
      setForm({
        type: d?.type || "",
        judgement_number: d?.judgement_number || "",
        case_number: d?.case_number || "",
        judge_name: d?.judge_name || "",
        division: d?.division || "",
        keyword: d?.keyword || "",
      });
    } catch (err) {
      const m = err?.response?.data?.message || err?.message || "تعذر تحميل تفاصيل الوثيقة.";
      setError(m);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPdfBlob() {
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });

      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(res.data);
      });
    } catch {
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }

  useEffect(() => {
    fetchDoc();
  }, [id]);

  useEffect(() => {
    fetchPdfBlob();

    return () => {
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    };
  }, [id]);

  async function onSave() {
    setMsg(null);
    setError(null);

    try {
      setSaving(true);
      const payload = {
        type: form.type?.trim() || "",
        judgement_number: form.judgement_number?.trim() || "",
        case_number: form.case_number?.trim() || "",
        judge_name: form.judge_name?.trim() || "",
        division: form.division?.trim() || "",
        keyword: form.keyword?.trim() ? form.keyword.trim() : null,
      };

      const res = await api.put(`/documents/${id}`, payload);
      const updated = res.data?.data || res.data;

      setDoc((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      setEditing(false);
      setMsg("✅ تم تعديل الوثيقة بنجاح.");
    } catch (err) {
      const m = err?.response?.data?.message || err?.message || "حدث خطأ أثناء التعديل.";
      setError(m);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    setMsg(null);
    setError(null);

    try {
      setDeleting(true);
      await api.delete(`/documents/${id}`);
      navigate("/search", { replace: true });
    } catch (err) {
      const m = err?.response?.data?.message || err?.message || "حدث خطأ أثناء الحذف.";
      setError(m);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function onDeleteClick() {
    setMsg(null);
    setError(null);
    setConfirmOpen(true);
  }

  async function onDownload() {
    setError(null);
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);

      const filename = (doc?.original_filename || `document_${id}.pdf`).toString();

      const a = document.createElement("a");
      a.href = url;
      a.download = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "تعذر تحميل PDF.");
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>تفاصيل الوثيقة</h2>
        </div>

        <div className="rowActions">
          <Link className="btn btnSecondary" to="/search">
            رجوع
          </Link>

          <button className="btn btnSecondary" onClick={fetchPdfBlob} disabled={!doc}>
            إعادة تحميل PDF
          </button>

          <button className="btn btnPrimary" onClick={onDownload} disabled={!doc}>
            تحميل PDF
          </button>

          {!editing ? (
            <>
              <button className="btn btnSecondary" onClick={() => setEditing(true)} disabled={!doc}>
                تعديل
              </button>

              {user?.role === "admin" && (
                <button className="btn btnDanger" onClick={onDeleteClick} disabled={!doc || deleting}>
                  {deleting ? "جاري الحذف..." : "حذف"}
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn btnPrimary" onClick={onSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>

              <button
                className="btn btnSecondary"
                onClick={() => {
                  setForm({
                    type: doc?.type || "",
                    judgement_number: doc?.judgement_number || "",
                    case_number: doc?.case_number || "",
                    judge_name: doc?.judge_name || "",
                    division: doc?.division || "",
                    keyword: doc?.keyword || "",
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
            </div>

            {!editing ? (
              <div style={{ marginTop: 12 }} className="kv">
                <div><span className="k">نوع القضية:</span> {caseTypeText}</div>
                <div><span className="k">اسم الملف:</span> {doc.original_filename || "—"}</div>
                <div><span className="k">رقم الحكم:</span> {doc.judgement_number || "—"}</div>
                <div><span className="k">رقم الملف:</span> {doc.case_number || "—"}</div>
                <div><span className="k">اسم القاضي:</span> {doc.judge_name || "—"}</div>
                <div><span className="k">الشعبة:</span> {doc.division || "—"}</div>
                <div><span className="k">الكلمة المفتاحية:</span> {doc.keyword || "—"}</div>
                <div><span className="k">تاريخ الإضافة:</span> {doc.created_at || "—"}</div>
              </div>
            ) : (
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field">
                  <div className="label">النوع</div>
                  <input className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
                </div>
                <div className="field">
                  <div className="label">رقم الحكم</div>
                  <input className="input" value={form.judgement_number} onChange={(e) => setForm((p) => ({ ...p, judgement_number: e.target.value }))} />
                </div>
                <div className="field">
                  <div className="label">رقم الملف</div>
                  <input className="input" value={form.case_number} onChange={(e) => setForm((p) => ({ ...p, case_number: e.target.value }))} />
                </div>
                <div className="field">
                  <div className="label">اسم القاضي</div>
                  <input className="input" value={form.judge_name} onChange={(e) => setForm((p) => ({ ...p, judge_name: e.target.value }))} />
                </div>
                <div className="field">
                  <div className="label">الشعبة</div>
                  <input className="input" value={form.division} onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))} />
                </div>
                <div className="field">
                  <div className="label">كلمة مفتاحية</div>
                  <input className="input" value={form.keyword} onChange={(e) => setForm((p) => ({ ...p, keyword: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="rowActions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <strong>معاينة PDF</strong>
              </div>
            </div>

            {pdfBlobUrl ? (
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                <iframe title={`PDF_${id}`} src={pdfBlobUrl} style={{ width: "100%", height: "75vh", border: "0", display: "block" }} />
              </div>
            ) : (
              <div className="alert alertInfo">تعذر عرض PDF. استعمل زر التحميل.</div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="حذف الوثيقة نهائيًا"
        message="هل أنت متأكد أنك تريد حذف هذه الوثيقة؟ هذه العملية نهائية ولا يمكن التراجع عنها."
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
      />
    </div>
  );
}
