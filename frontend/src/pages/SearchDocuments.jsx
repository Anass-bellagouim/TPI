import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
 * ✅ Remote autocomplete for Judges
 * - fetchOptions(query) => string[]
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
 * ✅ Remote case-type autocomplete filtered by division_id
 * - value stored = code
 */
function CaseTypeAutocompleteRemote({ divisionId, value, onChange, disabled }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // show selected code by default
    if (!value) setQ("");
    else if (!q) setQ(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (!open || disabled || !divisionId) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/lookups/case-types", {
          params: { division_id: divisionId, q: q || "", active: 1 },
        });
        const data = res.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, disabled, divisionId, q]);

  const filtered = useMemo(() => (items || []).slice(0, 12), [items]);

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

export default function SearchDocuments() {
  // ✅ divisions from DB
  const [divisions, setDivisions] = useState([]);

  const [filters, setFilters] = useState({
    division_id: "",
    division_name: "",
    case_type_code: "",
    file_number: "",
    judgement_number: "",
    judge_name: "",
    q: "",
  });

  const [caseTypesMap, setCaseTypesMap] = useState({}); // code => name (for hint + table)

  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const rows = useMemo(() => pageData?.data || [], [pageData]);

  // load divisions once
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

  // when division changes -> load mapping of case types for that division
  useEffect(() => {
    const id = filters.division_id;
    if (!id) {
      setCaseTypesMap({});
      return;
    }

    (async () => {
      try {
        const res = await api.get("/lookups/case-types", {
          params: { division_id: id, q: "", active: 1 },
        });
        const data = res.data?.data || [];
        const map = {};
        for (const it of Array.isArray(data) ? data : []) {
          if (it?.code) map[it.code] = it.name || it.code;
        }
        setCaseTypesMap(map);
      } catch (e) {
        console.error(e);
        setCaseTypesMap({});
      }
    })();
  }, [filters.division_id]);

  async function fetchJudgeNames(query) {
    const res = await api.get("/lookups/judges", { params: { q: query || "", active: 1 } });
    const data = res.data?.data || [];
    return (Array.isArray(data) ? data : []).map((x) => x.full_name).filter(Boolean);
  }

  const fileHint = useMemo(() => {
    const parts = extractCaseCodeFromFileNumber(filters.file_number);
    if (!filters.file_number) return { ok: null, text: "الصيغة: 10021/2101/2026" };
    if (!parts) return { ok: false, text: "رقم الملف غير صحيح. مثال: 10021/2101/2026" };

    const name = caseTypesMap[parts.caseCode];
    if (name) return { ok: true, text: `✅ نوع القضية: ${name} — (${parts.caseCode})` };
    return { ok: true, text: `✅ الرمز المستخرج: ${parts.caseCode} (قد لا يكون مسجل فهذه الشعبة)` };
  }, [filters.file_number, caseTypesMap]);

  const judgementHint = useMemo(() => {
    if (!filters.judgement_number) return { ok: null, text: "الصيغة: 12/2026" };
    const parts = extractJudgementParts(filters.judgement_number);
    if (!parts) return { ok: false, text: "الصيغة غير صحيحة. مثال: 12/2026" };
    return { ok: true, text: "✅ الصيغة صحيحة." };
  }, [filters.judgement_number]);

  async function fetchDocs(url = "/documents/search", params = {}) {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const res = await api.get(url, { params });
      setPageData(res.data);

      if ((res.data?.data || []).length === 0) {
        setInfo("ما كاين حتى وثيقة مطابقة لهاد البحث.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء جلب الوثائق.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function buildParams() {
    const params = { per_page: perPage };

    // ✅ backend كيعرف division كنص (وثائق مخزنة ب division name)
    if (filters.division_name) params.division = filters.division_name;

    if (filters.case_type_code) params.keyword = filters.case_type_code;

    if (filters.judge_name?.trim()) params.judge_name = filters.judge_name.trim();
    if (filters.file_number?.trim()) params.case_number = filters.file_number.trim();
    if (filters.judgement_number?.trim()) params.judgement_number = filters.judgement_number.trim();
    if (filters.q?.trim()) params.q = filters.q.trim();

    return params;
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const fn = filters.file_number.trim();
    if (fn && !extractCaseCodeFromFileNumber(fn)) {
      setError("رقم الملف غير صحيح. خاصو يكون بحال: 10021/2101/2026");
      return;
    }

    const jn = filters.judgement_number.trim();
    if (jn && !extractJudgementParts(jn)) {
      setError("رقم الحكم غير صحيح. خاصو يكون بحال: 12/2026");
      return;
    }

    fetchDocs("/documents/search", buildParams());
  }

  useEffect(() => {
    fetchDocs("/documents", { per_page: perPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDocs("/documents/search", buildParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const canPrev = !!pageData?.prev_page_url;
  const canNext = !!pageData?.next_page_url;

  return (
    <div className="docSearch">
      <div className="pageHeader">
        <div>
          <h2>البحث عن وثيقة</h2>
          <p>الشعبة + نوع القضية + رقم الملف/الحكم + القاضي + كلمة مفتاحية…</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={onSubmit}>
          <div className="grid3">
            <div className="field">
              <div className="label">الشعبة (من DB)</div>
              <select
                className="select"
                value={filters.division_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const d = divisions.find((x) => String(x.id) === String(id));
                  setFilters((p) => ({
                    ...p,
                    division_id: id,
                    division_name: d?.name || "",
                    case_type_code: "",
                  }));
                }}
              >
                <option value="">— اختر الشعبة —</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="help">اختيار الشعبة كيحدد أنواع القضايا.</div>
            </div>

            <div className="field">
              <div className="label">نوع القضية (من DB)</div>
              <CaseTypeAutocompleteRemote
                divisionId={filters.division_id}
                value={filters.case_type_code}
                onChange={(code) => setFilters((p) => ({ ...p, case_type_code: code }))}
              />
              <div className="help">
                مثال: كتب <b>2101</b> أو <b>جنحي</b>.
              </div>
            </div>

            <div className="field">
              <div className="label">اسم القاضي (من DB)</div>
              <AutocompleteRemote
                value={filters.judge_name}
                onChange={(v) => setFilters((p) => ({ ...p, judge_name: v }))}
                fetchOptions={fetchJudgeNames}
                placeholder="كتب وغيطلعوا القضاة…"
              />
              <div className="help">كيجيب القضاة من قاعدة البيانات.</div>
            </div>
          </div>

          <div className="grid2" style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">رقم الملف (n*/****/****)</div>
              <input
                className="input"
                value={filters.file_number}
                onChange={(e) => setFilters((p) => ({ ...p, file_number: e.target.value }))}
                placeholder="مثال: 10021/2101/2026"
              />
              <div className={`hint ${fileHint.ok === true ? "hint--ok" : fileHint.ok === false ? "hint--bad" : ""}`}>
                {fileHint.text}
              </div>
            </div>

            <div className="field">
              <div className="label">رقم الحكم (n*/****)</div>
              <input
                className="input"
                value={filters.judgement_number}
                onChange={(e) => setFilters((p) => ({ ...p, judgement_number: e.target.value }))}
                placeholder="مثال: 12/2026"
              />
              <div
                className={`hint ${judgementHint.ok === true ? "hint--ok" : judgementHint.ok === false ? "hint--bad" : ""}`}
              >
                {judgementHint.text}
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <div className="label">الكلمة المفتاحية</div>
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              placeholder="مثال: تزوير / عقد / اسم شخص..."
            />
            <div className="help">كتقلب فـ محتوى الوثيقة و/أو metadata.</div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "بحث"}
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loading}
              onClick={() => {
                setFilters({
                  division_id: "",
                  division_name: "",
                  case_type_code: "",
                  file_number: "",
                  judgement_number: "",
                  judge_name: "",
                  q: "",
                });
                setCaseTypesMap({});
                fetchDocs("/documents", { per_page: perPage });
              }}
            >
              تصفير
            </button>
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

      <div className="tableTop">
        <div className="help">
          {pageData ? (
            <>
              صفحة {pageData.current_page} / {pageData.last_page} — المجموع: {pageData.total}
            </>
          ) : (
            "—"
          )}
        </div>

        <div className="rowActions">
          <div className="rowsSelect">
            <span className="help">عرض:</span>
            <select className="select select--sm" value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value, 10))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>الشعبة</th>
                <th>نوع القضية</th>
                <th>رقم الملف</th>
                <th>رقم الحكم</th>
                <th>القاضي</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((d) => {
                  const code = d.keyword || "";
                  const name = code ? caseTypesMap[code] : null;

                  return (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td>{d.division || "—"}</td>

                      <td>
                        {code ? (
                          <>
                            <span style={{ fontWeight: 800 }}>{code}</span>
                            {name ? (
                              <div className="help" style={{ marginTop: 4 }}>
                                {name}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          d.type || "—"
                        )}
                      </td>

                      <td>{d.case_number || "—"}</td>
                      <td>{d.judgement_number || "—"}</td>
                      <td>{d.judge_name || "—"}</td>

                      <td>
                        <div className="rowActions">
                          <Link className="btn btnSecondary" to={`/documents/${d.id}`}>
                            عرض
                          </Link>
                          <a className="btn btnSecondary" href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                            تحميل
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageData && (
          <div className="pager" style={{ marginTop: 12 }}>
            <div className="help">
              صفحة {pageData.current_page} / {pageData.last_page}
            </div>

            <div className="rowActions">
              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canPrev || loading}
                onClick={() => fetchDocs(pageData.prev_page_url, buildParams())}
              >
                السابق
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canNext || loading}
                onClick={() => fetchDocs(pageData.next_page_url, buildParams())}
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
