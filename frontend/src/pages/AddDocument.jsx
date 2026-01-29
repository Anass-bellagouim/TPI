// src/pages/AddDocument.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

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
          ▾
        </button>
      </div>

      {open && !disabled && (
        <div className="ac__menu">
          {loading ? (
            <div className="ac__empty">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="ac__empty">لا توجد أي اقتراحات.</div>
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
          placeholder="اكتب نوع القضية أو الرمز (بحث عام)..."
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
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
          ▾
        </button>
      </div>

      {open && !disabled && (
        <div className="ac__menu">
          {loading ? (
            <div className="ac__empty">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="ac__empty">لا يوجد أي نوع مطابق.</div>
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
                    الشعبة: {divisionNameOf(it.division_id) || it.division_id}
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

function UploadArrowIcon({ size = 54 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="uploadMark">
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 1 .7.29l4.5 4.5a1 1 0 1 1-1.4 1.42L13 6.41V15a1 1 0 1 1-2 0V6.41L8.2 9.21A1 1 0 1 1 6.8 7.79l4.5-4.5A1 1 0 0 1 12 3z"
      />
      <path
        fill="currentColor"
        d="M5 14a1 1 0 0 1 1 1v3h12v-3a1 1 0 1 1 2 0v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}


export default function AddDocument() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [file, setFile] = useState(null);

  const [caseNumber, setCaseNumber] = useState("");
  const [judgementNumber, setJudgementNumber] = useState("");
  const [judgeName, setJudgeName] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [divisionId, setDivisionId] = useState("");
  const [divisionName, setDivisionName] = useState("");

  const [caseTypeCode, setCaseTypeCode] = useState("");
  const [caseTypeName, setCaseTypeName] = useState("");

  const [caseTypeMismatch, setCaseTypeMismatch] = useState("");
  const [caseCodeLookupMsg, setCaseCodeLookupMsg] = useState("");

  const fileName = useMemo(() => file?.name || "", [file]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/lookups/divisions", { params: { active: 1 } });
        const data = res.data?.data || [];
        setDivisions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const divisionNameOf = useCallback(
    (division_id) => {
      const d = (divisions || []).find((x) => String(x.id) === String(division_id));
      return d?.name || "";
    },
    [divisions]
  );

  const lookupCaseTypeByCode = useCallback(async (code4) => {
    const res = await api.get("/lookups/case-types", {
      params: { q: String(code4 || ""), active: 1 },
    });
    const data = res.data?.data || [];
    const arr = Array.isArray(data) ? data : [];
    const exact = arr.find((x) => String(x.code) === String(code4));
    return exact || null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const parts = extractCaseCodeFromFileNumber(caseNumber.trim());
    setCaseCodeLookupMsg("");
    setCaseTypeMismatch("");

    if (!caseNumber.trim()) return;
    if (!parts) return;

    const midCode = String(parts.caseCode);

    const t = setTimeout(async () => {
      try {
        const it = await lookupCaseTypeByCode(midCode);

        if (cancelled) return;

        if (!it) {
          setCaseCodeLookupMsg(`❌ لا يوجد أي نوع قضية بالرمز: ${midCode}. صحّح رقم الملف أو الرمز.`);
          return;
        }

        if (!caseTypeCode) {
          setCaseTypeCode(it.code || "");
          setCaseTypeName(it.name || "");

          const dn = divisionNameOf(it.division_id);
          setDivisionId(it?.division_id ? String(it.division_id) : "");
          setDivisionName(dn || "");
        } else {
          if (String(caseTypeCode) !== String(midCode)) {
            setCaseTypeMismatch(`⚠️ يوجد عدم تطابق: رمز نوع القضية المختار (${caseTypeCode}) ≠ الرمز الموجود في منتصف رقم الملف (${midCode}).`);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCaseCodeLookupMsg("⚠️ حدثت مشكلة أثناء التحقق من رمز نوع القضية. حاول مرة أخرى.");
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [caseNumber, caseTypeCode, lookupCaseTypeByCode, divisionNameOf]);

  useEffect(() => {
    setCaseTypeMismatch("");

    const parts = extractCaseCodeFromFileNumber(caseNumber.trim());
    if (!parts) return;
    if (!caseTypeCode) return;

    const midCode = String(parts.caseCode);
    if (String(caseTypeCode) !== String(midCode)) {
      setCaseTypeMismatch(`⚠️ يوجد عدم تطابق: رمز نوع القضية المختار (${caseTypeCode}) ≠ الرمز الموجود في منتصف رقم الملف (${midCode}).`);
    }
  }, [caseTypeCode, caseNumber]);

  const fileHint = useMemo(() => {
    const parts = extractCaseCodeFromFileNumber(caseNumber);
    if (!caseNumber) return { ok: null, text: "الصيغة: 10021/2101/2026" };
    if (!parts) return { ok: false, text: "رقم الملف غير صحيح. مثال: 10021/2101/2026" };
    return { ok: true, text: `✅ الرمز المستخرج من رقم الملف: ${parts.caseCode}` };
  }, [caseNumber]);

  const judgementHint = useMemo(() => {
    if (!judgementNumber) return { ok: null, text: "الصيغة: 12/2026" };
    const parts = extractJudgementParts(judgementNumber);
    if (!parts) return { ok: false, text: "رقم الحكم غير صحيح. مثال: 12/2026" };
    return { ok: true, text: "✅ الصيغة صحيحة." };
  }, [judgementNumber]);

  function resetForm() {
    setFile(null);
    setCaseNumber("");
    setJudgementNumber("");
    setJudgeName("");
    setDivisionId("");
    setDivisionName("");
    setCaseTypeCode("");
    setCaseTypeName("");
    setCaseTypeMismatch("");
    setCaseCodeLookupMsg("");
    setError("");
    setInfo("");
  }

  async function fetchJudgeNames(query) {
    const res = await api.get("/lookups/judges", { params: { q: query || "", active: 1 } });
    const data = res.data?.data || [];
    return (Array.isArray(data) ? data : []).map((x) => x.full_name).filter(Boolean);
  }

  function validateCaseTypeMatchesFileNumber() {
    const cn = caseNumber.trim();
    const ct = String(caseTypeCode || "").trim();
    if (!cn || !ct) return null;

    const parts = extractCaseCodeFromFileNumber(cn);
    if (!parts) return null;

    const midCode = String(parts.caseCode);
    if (midCode !== ct) {
      return `عدم تطابق: وسط رقم الملف = ${midCode} ولكن رمز نوع القضية = ${ct}. يجب أن يكونا الرقم نفسه.`;
    }
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!file) return setError("إضافة ملف PDF إجباري.");
    if (file.type !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
      return setError("يجب أن يكون الملف بصيغة PDF.");
    }

    if (!caseNumber.trim()) {
      return setError("رقم الملف إجباري.");
    }
    if (!extractCaseCodeFromFileNumber(caseNumber.trim())) {
      return setError("رقم الملف يجب أن يكون مثل: 10021/2101/2026");
    }
    if (!judgementNumber.trim()) {
      return setError("رقم الحكم إجباري.");
    }
    if (!extractJudgementParts(judgementNumber.trim())) {
      return setError("رقم الحكم يجب أن يكون مثل: 12/2026");
    }

    if (!divisionId) return setError("اختيار الشعبة إجباري.");
    if (!caseTypeCode) return setError("اختيار نوع القضية إجباري.");
    if (!judgeName.trim()) return setError("اسم القاضي إجباري.");

    const mismatch = validateCaseTypeMatchesFileNumber();
    if (mismatch) return setError(mismatch);

    const parts = extractCaseCodeFromFileNumber(caseNumber.trim());
    if (parts && caseCodeLookupMsg) {
      return setError(caseCodeLookupMsg.replace(/^❌\s*/, ""));
    }

    const safeType = (caseTypeName || "").trim() || String(caseTypeCode || "").trim();

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("pdf", file);

      fd.append("case_number", caseNumber.trim());
      fd.append("judgement_number", judgementNumber.trim());
      fd.append("judge_name", judgeName.trim());

      fd.append("division", divisionName.trim());
      fd.append("keyword", String(caseTypeCode).trim());
      fd.append("type", safeType);

      await api.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });

      navigate("/search", { replace: true });
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
    <div className="addDoc">
      <div className="pageHeader">
        <div>
          <h2>إضافة وثيقة</h2>
        </div>

        <div className="headerActions">
        <button
          className="btn btnSecondary"
          type="button"
          disabled={loading}
          onClick={() => {
            // رجوع لآخر صفحة (history back)
            if (window.history.length > 1) navigate(-1);
            else navigate("/search");
          }}
        >
          رجوع
        </button>

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
          {/* ✅ LEFT PDF + RIGHT inputs */}
          <div className="addDocTop addDocTop--pdfLeft">
            {/* LEFT: PDF upload */}
            <div className="pdfBox">
              <label className={`pdfDrop ${file ? "is-picked" : ""}`}>
                <input
                  className="pdfInput"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  disabled={loading}
                />

                {!file ? (
                  <div className="pdfDrop__empty">
                    <div className="pdfIcon" aria-hidden="true">
                      <UploadArrowIcon size={58} />
                    </div>

                    <div className="pdfDrop__txt">
                      <div className="pdfDrop__big">إضافة ملف PDF</div>
                      <div className="pdfDrop__small">اضغط هنا أو اسحب الملف إلى هذا المربع</div>
                    </div>

                    <div className="pdfDrop__btn">اختيار ملف</div>
                  </div>
                ) : (
                  <div className="pdfDrop__picked">
                    <div className="pdfPicked__icon" aria-hidden="true">
                      <UploadArrowIcon size={52} />
                    </div>

                    <div className="pdfPicked__meta">
                      <div className="pdfPicked__name">{fileName}</div>
                      <div className="pdfPicked__hint">تم اختيار الملف ✅</div>
                    </div>

                    <button
                      type="button"
                      className="pdfPicked__clear"
                      onClick={() => setFile(null)}
                      disabled={loading}
                      title="حذف الملف"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* RIGHT: inputs */}
            <div className="addDocInputs">
              <div className="grid2">
                <div className="field">
                  <div className="label">الشعبة</div>
              <select
                className="select"
                value={divisionId}
                required
                onChange={(e) => {
                  const id = e.target.value;
                  const d = divisions.find((x) => String(x.id) === String(id));
                  setDivisionId(id);
                      setDivisionName(d?.name || "");
                    }}
                    disabled={loading}
                  >
                    <option value="">— اختر الشعبة —</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="label">نوع القضية</div>
                  <CaseTypeAutocompleteGlobal
                    divisions={divisions}
                    divisionId={divisionId}
                    value={caseTypeCode}
                    onChange={(code) => {
                      setCaseTypeCode(code);
                      setCaseTypeName("");
                    }}
                    onPick={(it) => {
                      const d = divisions.find((x) => String(x.id) === String(it?.division_id));
                      setDivisionId(d ? String(d.id) : "");
                      setDivisionName(d?.name || "");
                      setCaseTypeCode(it?.code || "");
                      setCaseTypeName(it?.name || "");
                    }}
                    disabled={loading}
                  />

                  {caseTypeMismatch && (
                    <div className="hint hint--bad" style={{ marginTop: 6 }}>
                      {caseTypeMismatch}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field">
                  <div className="label">رقم الملف</div>
                  <input
                    className="input"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="مثال: 10021/2101/2026"
                    required
                    disabled={loading}
                  />
                  <div className={`hint ${fileHint.ok === true ? "hint--ok" : fileHint.ok === false ? "hint--bad" : ""}`}>
                    {fileHint.text}
                  </div>

                  {caseCodeLookupMsg && (
                    <div className="hint hint--bad" style={{ marginTop: 6 }}>
                      {caseCodeLookupMsg}
                    </div>
                  )}
                </div>

                <div className="field">
                  <div className="label">رقم الحكم</div>
                  <input
                    className="input"
                    value={judgementNumber}
                    onChange={(e) => setJudgementNumber(e.target.value)}
                    placeholder="مثال: 12/2026"
                    required
                    disabled={loading}
                  />
                  <div className={`hint ${judgementHint.ok === true ? "hint--ok" : judgementHint.ok === false ? "hint--bad" : ""}`}>
                    {judgementHint.text}
                  </div>
                </div>
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <div className="label">اسم القاضي</div>
                <AutocompleteRemote
                  value={judgeName}
                  onChange={(v) => setJudgeName(v)}
                  fetchOptions={fetchJudgeNames}
                  placeholder="اكتب وسيتم عرض القضاة…"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "رفع الوثيقة"}
            </button>

            <button className="btn btnSecondary" type="button" disabled={loading} onClick={resetForm}>
              مسح
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
