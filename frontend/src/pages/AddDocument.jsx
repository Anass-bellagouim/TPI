import React, { useEffect, useMemo, useRef, useState } from "react";
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

/**
 * ✅ Remote autocomplete (for Judges)
 * - calls fetchOptions(query) => returns array of strings
 */
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

  // fetch options when q changes (debounced)
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
            onChange?.(e.target.value); // allow free text
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
            <div className="ac__empty">ما كاين حتى اقتراح.</div>
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

/**
 * ✅ Remote case-types autocomplete (by division_id)
 * - value stored = code (4 digits)
 */
function CaseTypeAutocompleteRemote({ divisionId, value, onChange, disabled }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // show selected label if we have it
  useEffect(() => {
    if (!value) setQ("");
  }, [value]);

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

  // fetch case types when open + divisionId + query changes
  useEffect(() => {
    if (!open || disabled || !divisionId) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/lookups/case-types", {
          params: {
            division_id: divisionId,
            q: q || "",
            active: 1,
          },
        });
        const data = res.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, disabled, divisionId, q]);

  const filtered = useMemo(() => {
    // backend already filters; just limit
    return (items || []).slice(0, 12);
  }, [items]);

  function commit(it) {
    onChange?.(it.code);
    setQ(`${it.name} (${it.code})`);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="ac" ref={wrapRef}>
      <div className={`ac__control ${disabled ? "is-disabled" : ""}`}>
        <input
          className="ac__input"
          value={q}
          placeholder={divisionId ? "اكتب اسم النوع أو الرمز..." : "اختار الشعبة أولا"}
          disabled={disabled || !divisionId}
          onFocus={() => divisionId && setOpen(true)}
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
        <button
          type="button"
          className="ac__toggle"
          tabIndex={-1}
          disabled={disabled || !divisionId}
          onClick={() => divisionId && setOpen((v) => !v)}
        >
          ▾
        </button>
      </div>

      {open && !disabled && divisionId && (
        <div className="ac__menu">
          {loading ? (
            <div className="ac__empty">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="ac__empty">ما كاين حتى نوع مطابق فـ هاد الشعبة.</div>
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
                <div className="acRow">
                  <span className="acName">{it.name}</span>
                  <span className="acCode">{it.code}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
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

  // ✅ divisions from DB
  const [divisions, setDivisions] = useState([]);
  const [divisionId, setDivisionId] = useState("");
  const [divisionName, setDivisionName] = useState("");

  // ✅ case type code from DB
  const [caseTypeCode, setCaseTypeCode] = useState("");

  const fileName = useMemo(() => file?.name || "", [file]);

  // load divisions once
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/lookups/divisions", { params: { active: 1 } });
        const data = res.data?.data || [];
        setDivisions(Array.isArray(data) ? data : []);
      } catch (e) {
        // silent; show in UI if you want
        console.error(e);
      }
    })();
  }, []);

  const fileHint = useMemo(() => {
    const parts = extractCaseCodeFromFileNumber(caseNumber);
    if (!caseNumber) return { ok: null, text: "الصيغة: 10021/2101/2026" };
    if (!parts) return { ok: false, text: "رقم الملف غير صحيح. مثال: 10021/2101/2026" };

    // just show the code; real validation is DB-side
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
  }

  async function fetchJudgeNames(query) {
    const res = await api.get("/lookups/judges", {
      params: { q: query || "", active: 1 },
    });
    const data = res.data?.data || [];
    return (Array.isArray(data) ? data : []).map((x) => x.full_name).filter(Boolean);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!file) return setError("خاصك تختار ملف PDF قبل الرفع.");
    if (file.type !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
      return setError("الملف خاصو يكون PDF.");
    }

    if (caseNumber.trim() && !extractCaseCodeFromFileNumber(caseNumber.trim())) {
      return setError("رقم الملف خاصو يكون بحال: 10021/2101/2026");
    }
    if (judgementNumber.trim() && !extractJudgementParts(judgementNumber.trim())) {
      return setError("رقم الحكم خاصو يكون بحال: 12/2026");
    }

    if (!divisionId) return setError("اختار الشعبة قبل الرفع.");
    if (!caseTypeCode) return setError("اختار نوع القضية (بالاسم أو بالرمز) قبل الرفع.");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("pdf", file);

      fd.append("case_number", caseNumber.trim());
      fd.append("judgement_number", judgementNumber.trim());
      fd.append("judge_name", judgeName.trim());

      // ✅ نخزنو الاسم فـ documents.division (بحال اللي عندك دابا)
      fd.append("division", divisionName.trim());

      // ✅ نخزنو الرمز فـ documents.keyword
      fd.append("keyword", caseTypeCode);

      const res = await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const doc = res.data?.data;
      setInfo(res.data?.message || "تم رفع الوثيقة بنجاح.");

      if (doc?.id) {
        navigate(`/documents/${doc.id}`, { replace: true });
        return;
      }

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
    <div className="addDoc">
      <div className="pageHeader">
        <div>
          <h2>إضافة وثيقة</h2>
          <p>رفع PDF + اختيار (الشعبة + نوع القضية + القاضي) من قاعدة البيانات.</p>
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
              <div className="label">الشعبة (من DB)</div>
              <select
                className="select"
                value={divisionId}
                onChange={(e) => {
                  const id = e.target.value;
                  const d = divisions.find((x) => String(x.id) === String(id));
                  setDivisionId(id);
                  setDivisionName(d?.name || "");
                  setCaseTypeCode("");
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
              <div className="help">اختيار الشعبة كيحدد أنواع القضايا تلقائياً.</div>
            </div>

            <div className="field">
              <div className="label">نوع القضية (من DB)</div>
              <CaseTypeAutocompleteRemote
                divisionId={divisionId}
                value={caseTypeCode}
                onChange={(code) => setCaseTypeCode(code)}
                disabled={loading}
              />
              <div className="help">كتب الاسم أو الرمز (مثال 2101).</div>
            </div>
          </div>

          <div className="grid2" style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">رقم الملف (n*/****/****)</div>
              <input
                className="input"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 10021/2101/2026"
                disabled={loading}
              />
              <div className={`hint ${fileHint.ok === true ? "hint--ok" : fileHint.ok === false ? "hint--bad" : ""}`}>
                {fileHint.text}
              </div>
            </div>

            <div className="field">
              <div className="label">رقم الحكم (n*/****)</div>
              <input
                className="input"
                value={judgementNumber}
                onChange={(e) => setJudgementNumber(e.target.value)}
                placeholder="مثال: 12/2026"
                disabled={loading}
              />
              <div
                className={`hint ${judgementHint.ok === true ? "hint--ok" : judgementHint.ok === false ? "hint--bad" : ""}`}
              >
                {judgementHint.text}
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <div className="label">اسم القاضي (من DB)</div>
            <AutocompleteRemote
              value={judgeName}
              onChange={(v) => setJudgeName(v)}
              fetchOptions={fetchJudgeNames}
              placeholder="كتب وغيطلعوا القضاة…"
              disabled={loading}
            />
            <div className="help">كيجيب القضاة من قاعدة البيانات (lookups/judges).</div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "رفع الوثيقة"}
            </button>

            <button className="btn btnSecondary" type="button" disabled={loading} onClick={resetForm}>
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
            ملاحظة: بعد الرفع، الوثيقة كتكون <strong>pending</strong> حتى يكمل استخراج النص.
          </div>
        </form>
      </div>
    </div>
  );
}
