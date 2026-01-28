import React, { useEffect, useMemo, useState, useContext, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { API_BASE_URL } from "../api.js";
import { AuthContext } from "../context/AuthContext.jsx";
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

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

function extractCaseCodeFromFileNumber(fileNo) {
  const v = (fileNo || "").trim();
  const m = v.match(/^(\d+)\/(\d{4})\/(\d{4})$/);
  if (!m) return null;
  return { fileIndex: m[1], caseCode: m[2], year: m[3] };
}

function extractJudgementParts(j) {
  const v = (j || "").trim();
  const m = v.match(/^(\d+)\/(\d{4})$/);
  if (!m) return null;
  return { judgementIndex: m[1], year: m[2] };
}

function AutocompleteRemote({ value, onChange, fetchOptions, placeholder, disabled }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const [active, setActive] = useState(-1);
  const [opts, setOpts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setQ(value || ""), [value]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open || disabled) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchOptions(q);
        setOpts(Array.isArray(res) ? res : []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, open, disabled, fetchOptions]);

  const filtered = useMemo(() => {
    const qq = norm(q);
    const base = opts || [];
    if (!qq) return base.slice(0, 10);

    const starts = [];
    const contains = [];
    for (const o of base) {
      const oo = norm(o);
      if (oo.startsWith(qq)) starts.push(o);
      else if (oo.includes(qq)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, 10);
  }, [opts, q]);

  return (
    <div className="ac" ref={wrapRef}>
      <div className={`ac__control ${disabled ? "is-disabled" : ""}`}>
        <input
          className="ac__input"
          value={q}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
            onChange?.(e.target.value);
            onChange?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!filtered.length) return;
              setOpen(true);
              setActive((i) => (i + 1) % filtered.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (!filtered.length) return;
              setOpen(true);
              setActive((i) => (i <= 0 ? filtered.length - 1 : i - 1));
              return;
            }
            if (e.key === "Enter") {
              if (open && active >= 0 && filtered[active]) {
                e.preventDefault();
                onChange?.(filtered[active]);
                setQ(filtered[active]);
                setOpen(false);
                setActive(-1);
              }
            }
          }}
        />
        <button type="button" className="ac__toggle" tabIndex={-1} disabled={disabled} onClick={() => setOpen((v) => !v)}>
          ?
        </button>
      </div>

      {open && !disabled && (
        <div className="ac__menu">
          {loading ? (
            <div className="ac__empty">{"جاري التحميل..."}</div>
          ) : filtered.length === 0 ? (
            <div className="ac__empty">{"لا توجد أي اقتراحات."}</div>
          ) : (
            filtered.map((o, idx) => (
              <button
                key={`${o}-${idx}`}
                type="button"
                className={`ac__item ${idx === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange?.(o);
                  setQ(o);
                  setOpen(false);
                  setActive(-1);
                }}
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CaseTypeAutocompleteGlobal({ divisions, divisionId, value, onChange, onPick, disabled }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value && !q) setQ(String(value));
  }, [value, q]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open || disabled) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/lookups/case-types", {
          params: { q: q || "", active: 1, division_id: divisionId || undefined },
        });
        const data = res.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, disabled, q]);

  const divisionNameOf = useCallback(
    (division_id) => {
      const d = (divisions || []).find((x) => String(x.id) === String(division_id));
      return d?.name || "";
    },
    [divisions]
  );

  const filtered = useMemo(() => (items || []).slice(0, 12), [items]);

  function commit(it) {
    onChange?.(it.code);
    setQ(`${it.name} (${it.code})`);
    setOpen(false);
    setActive(-1);
    onPick?.(it);
  }

  return (
    <div className="ac" ref={wrapRef}>
      <div className={`ac__control ${disabled ? "is-disabled" : ""}`}>
        <input
          className="ac__input"
          value={q}
          placeholder={"اكتب نوع القضية أو الرمز (بحث عام)..."}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
            onChange?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!filtered.length) return;
              setOpen(true);
              setActive((i) => (i + 1) % filtered.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (!filtered.length) return;
              setOpen(true);
              setActive((i) => (i <= 0 ? filtered.length - 1 : i - 1));
              return;
            }
            if (e.key === "Enter") {
              if (open && active >= 0 && filtered[active]) {
                e.preventDefault();
                commit(filtered[active]);
              }
            }
          }}
        />
        <button type="button" className="ac__toggle" tabIndex={-1} disabled={disabled} onClick={() => setOpen((v) => !v)}>
          ?
        </button>
      </div>

      {open && !disabled && (
        <div className="ac__menu">
          {loading ? (
            <div className="ac__empty">{"جاري التحميل..."}</div>
          ) : filtered.length === 0 ? (
            <div className="ac__empty">{"لا يوجد أي نوع مطابق."}</div>
          ) : (
            filtered.map((it, idx) => (
              <button
                key={it.id || it.code}
                type="button"
                className={`ac__item ${idx === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(it);
                }}
              >
                <div className="acRow" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="acName" style={{ fontWeight: 900 }}>
                    {it.name}
                  </span>
                  <span className="acCode" style={{ opacity: 0.85 }}>
                    {it.code}
                  </span>
                </div>

                {!!it?.division_id && (
                  <div className="help" style={{ marginTop: 4 }}>
                    {"الشعبة"}: {divisionNameOf(it.division_id) || it.division_id}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
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
  const [divisions, setDivisions] = useState([]);
  const [divisionId, setDivisionId] = useState("");

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

  const fileHint = useMemo(() => {
    const parts = extractCaseCodeFromFileNumber(form.case_number);
    if (!form.case_number) return { ok: null, text: "الصيغة: 10021/2101/2026" };
    if (!parts) return { ok: false, text: "رقم الملف غير صحيح. مثال: 10021/2101/2026" };
    return { ok: true, text: `✅ الرمز المستخرج من رقم الملف: ${parts.caseCode}` };
  }, [form.case_number]);

  const judgementHint = useMemo(() => {
    if (!form.judgement_number) return { ok: null, text: "الصيغة: 12/2026" };
    const parts = extractJudgementParts(form.judgement_number);
    if (!parts) return { ok: false, text: "رقم الحكم غير صحيح. مثال: 12/2026" };
    return { ok: true, text: "✅ الصيغة صحيحة." };
  }, [form.judgement_number]);

  const caseTypeMismatch = useMemo(() => {
    const cn = form.case_number?.trim() || "";
    const ct = String(form.keyword || "").trim();
    if (!cn || !ct) return "";
    const parts = extractCaseCodeFromFileNumber(cn);
    if (!parts) return "";
    const midCode = String(parts.caseCode);
    if (midCode !== ct) {
      return `عدم تطابق: وسط رقم الملف = ${midCode} ولكن رمز نوع القضية = ${ct}. يجب أن يكونا الرقم نفسه.`;
    }
    return "";
  }, [form.case_number, form.keyword]);

  async function fetchDoc() {
    setError(null);
    setMsg(null);

    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      const payload = res.data || {};
      const d = payload?.data || payload;
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
    (async () => {
      try {
        const res = await api.get("/lookups/divisions", { params: { active: 1 } });
        const data = res.data?.data || [];
        setDivisions(Array.isArray(data) ? data : []);
      } catch {
        setDivisions([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.division || !divisions.length) return;
    const d = divisions.find((x) => String(x.name) === String(form.division));
    setDivisionId(d ? String(d.id) : "");
  }, [form.division, divisions]);

  const divisionNameOf = useCallback(
    (division_id) => {
      const d = (divisions || []).find((x) => String(x.id) === String(division_id));
      return d?.name || "";
    },
    [divisions]
  );

  async function fetchJudgeNames(query) {
    const res = await api.get("/lookups/judges", { params: { q: query || "", active: 1 } });
    const data = res.data?.data || [];
    return (Array.isArray(data) ? data : []).map((x) => x.full_name).filter(Boolean);
  }

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
      if (caseTypeMismatch) {
        setError(caseTypeMismatch);
        return;
      }

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
                  <div className="label">{"الشعبة"}</div>
                  <select
                    className="select"
                    value={divisionId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const d = divisions.find((x) => String(x.id) === String(id));
                      setDivisionId(id);
                      setForm((p) => ({ ...p, division: d?.name || "" }));
                    }}
                  >
                    <option value="">{"— اختر الشعبة —"}</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <div className="label">{"نوع القضية"}</div>
                  <CaseTypeAutocompleteGlobal
                    divisions={divisions}
                    divisionId={divisionId}
                    value={form.keyword}
                    onChange={(code) => {
                      const v = String(code || "");
                      setForm((p) => ({ ...p, keyword: v, type: v ? p.type : "" }));
                    }}
                    onPick={(it) => {
                      const dn = divisionNameOf(it?.division_id);
                      setDivisionId(it?.division_id ? String(it.division_id) : "");
                      setForm((p) => ({
                        ...p,
                        keyword: it?.code || "",
                        type: it?.name || "",
                        division: dn || p.division,
                      }));
                    }}
                  />
                  {caseTypeMismatch && (
                    <div className="hint hint--bad" style={{ marginTop: 6 }}>
                      {caseTypeMismatch}
                    </div>
                  )}
                </div>
                <div className="field">
                  <div className="label">{"رقم الملف"}</div>
                  <input className="input" value={form.case_number} onChange={(e) => setForm((p) => ({ ...p, case_number: e.target.value }))} />
                  <div className={`hint ${fileHint.ok === true ? "hint--ok" : fileHint.ok === false ? "hint--bad" : ""}`}>
                    {fileHint.text}
                  </div>
                </div>
                <div className="field">
                  <div className="label">{"رقم الحكم"}</div>
                  <input className="input" value={form.judgement_number} onChange={(e) => setForm((p) => ({ ...p, judgement_number: e.target.value }))} />
                  <div className={`hint ${judgementHint.ok === true ? "hint--ok" : judgementHint.ok === false ? "hint--bad" : ""}`}>
                    {judgementHint.text}
                  </div>
                </div>
                <div className="field">
                  <div className="label">{"اسم القاضي"}</div>
                  <AutocompleteRemote
                    value={form.judge_name}
                    onChange={(v) => setForm((p) => ({ ...p, judge_name: v }))}
                    fetchOptions={fetchJudgeNames}
                    placeholder={"اكتب وسيتم عرض القضاة…"}
                  />
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
