 import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE_URL } from "../api";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDateTime(value) {
  if (!value) return "?";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  return `${day}/${month}/${year} - ${hours}:${mins}:${secs}`;
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    pending: { cls: "badge badgePending", label: "في الانتظار" },
    processing: { cls: "badge badgeProcessing", label: "قيد المعالجة" },
    done: { cls: "badge badgeDone", label: "تم الاستخراج" },
    failed: { cls: "badge badgeFailed", label: "فشل الاستخراج" },
  };
  const m = map[s] || { cls: "badge", label: status || "—" };

  return (
    <span className={m.cls}>
      <span className="dot" />
      {m.label}
    </span>
  );
}


export default function Dashboard() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [missingOpen, setMissingOpen] = useState(false);
  const [missingYears, setMissingYears] = useState([]);
  const [missingYear, setMissingYear] = useState("");
  const [missingYearsLoading, setMissingYearsLoading] = useState(false);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingError, setMissingError] = useState("");
  const [missingList, setMissingList] = useState([]);

  async function fetchDashboard() {
    setError("");
    try {
      setLoading(true);
      const res = await api.get("/admin/dashboard");
      setPayload(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "تعذر تحميل معطيات لوحة القيادة.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!detailsOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setDetailsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  useEffect(() => {
    if (!missingOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setMissingOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [missingOpen]);

  async function onShowDetails(d) {
    if (d?.is_deleted) {
      const createdLog = d?.added_by || d?.added_at
        ? [{
            action: "created",
            actor_name: d?.added_by || null,
            employee_id: d?.added_by_id || null,
            created_at: d?.added_at || null,
            message: null,
          }]
        : [];

      const updatedLog = d?.updated_by || d?.updated_at
        ? [{
            action: "updated",
            actor_name: d?.updated_by || null,
            employee_id: d?.updated_by_id || null,
            created_at: d?.updated_at || null,
            message: null,
          }]
        : [];

      setDetailsOpen(true);
      setDetailsLoading(false);
      setDetails({
        doc: d,
        logs: [
          ...createdLog,
          ...updatedLog,
          {
            action: "deleted",
            actor_name: d?.deleted_by || null,
            employee_id: d?.deleted_by_id || null,
            created_at: d?.deleted_at || null,
            message: d?.deleted_message || null,
          },
        ],
      });
      return;
    }

    try {
      setDetailsLoading(true);
      setDetailsOpen(true);
      const res = await api.get(`/documents/${d.id}`);
      const payload = res.data || {};
      const doc = payload?.data || payload;
      const logs = Array.isArray(payload?.logs) ? payload.logs : [];
      setDetails({ doc, logs });
    } catch (e) {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function fetchMissing(yearValue) {
    const year = String(yearValue || "").trim();
    if (!/^\d{4}$/.test(year)) {
      setMissingError("Ø§Ù„Ù…Ø±Ø¬Ùˆ Ø§Ø®ØªÙŠØ§Ø± Ø³Ù†Ø© ØµØ­ÙŠØ­Ø©.");
      setMissingList([]);
      return;
    }

    setMissingError("");
    try {
      setMissingLoading(true);
      const res = await api.get("/documents/judgement-missing", { params: { year } });
      const data = res.data || {};
      setMissingList(Array.isArray(data.missing) ? data.missing : []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "ØªØ¹Ø°Ø± Ø¬Ù„Ø¨ Ù„Ø§Ø¦Ø­Ø© Ø§Ù„Ø£Ø±Ù‚Ø§Ù… Ø§Ù„Ù†Ø§Ù‚ØµØ©.";
      setMissingError(msg);
      setMissingList([]);
    } finally {
      setMissingLoading(false);
    }
  }

  async function openMissing() {
    setMissingOpen(true);
    setMissingError("");
    setMissingYearsLoading(true);
    try {
      const res = await api.get("/documents/judgement-years");
      const years = Array.isArray(res.data?.years) ? res.data.years : [];
      setMissingYears(years);
      const currentYear = String(new Date().getFullYear());
      const initial = years.includes(currentYear) ? currentYear : (years[0] || currentYear);
      setMissingYear(initial);
      await fetchMissing(initial);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "ØªØ¹Ø°Ø± Ø¬Ù„Ø¨ Ø§Ù„Ø³Ù†ÙˆØ§Øª.";
      setMissingError(msg);
      setMissingYears([]);
      setMissingList([]);
    } finally {
      setMissingYearsLoading(false);
    }
  }

  function handleMissingDownload() {
    const rows = missingList.length ? missingList : [];
    const content = rows.length ? rows.join("\n") : "Ø§Ù„Ù„Ø§Ø¦Ø­Ø© ÙØ§Ø±ØºØ©.";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `missing-judgements-${missingYear || "year"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  const kpis = payload?.kpis || {};
  const latest = Array.isArray(payload?.latest) ? payload.latest : [];
  const logs = Array.isArray(payload?.logs) ? payload.logs : [];
  const kpiCards = useMemo(() => {
    return [
      { key: "divisions", title: "الشعب", pill: "ALL", pillClass: "pill", value: safeNum(kpis.total_divisions), sub: "عدد الشعب المسجلة" },
      { key: "month", title: "وثائق هذا الشهر", pill: "Month", pillClass: "pill", value: safeNum(kpis.documents_month), sub: "من بداية الشهر إلى الآن" },
      { key: "today", title: "وثائق اليوم", pill: "Today", pillClass: "pill pill--ok", value: safeNum(kpis.documents_today), sub: "المرفوعة منذ بداية اليوم" },
      { key: "all", title: "مجموع الوثائق", pill: "All", pillClass: "pill", value: safeNum(kpis.total_documents), sub: "جميع الوثائق داخل النظام" },

      { key: "inactiveUsers", title: "المستخدمون غير النشطين", pill: "Inactive", pillClass: "pill pill--bad", value: safeNum(kpis.inactive_users), sub: "حسابات معطلة" },
      { key: "activeUsers", title: "المستخدمون النشطون", pill: "Active", pillClass: "pill pill--ok", value: safeNum(kpis.active_users), sub: "حسابات مفعلة" },
      { key: "judges", title: "القضاة", pill: "ALL", pillClass: "pill", value: safeNum(kpis.total_judges), sub: "عدد القضاة المسجلين" },
      { key: "caseTypes", title: "أنواع القضايا", pill: "Types", pillClass: "pill", value: safeNum(kpis.total_case_types), sub: "الرموز/الأنواع حسب الشعب" },
    ];
  }, [kpis]);

  const logsByAction = useMemo(() => {
    const created = {};
    const updated = {};
    const deleted = {};

    logs
      .filter((l) => l?.entity_type === "document")
      .forEach((l) => {
        if (!l?.entity_id || !l?.action) return;
        const key = String(l.entity_id);
        const entry = {
          actor_name: l.actor_name || (l.employee_id ? `#${l.employee_id}` : "?"),
          created_at: l.created_at,
        };
        if (l.action === "created" && !created[key]) created[key] = entry;
        if (l.action === "updated" && !updated[key]) updated[key] = entry;
        if (l.action === "deleted" && !deleted[key]) deleted[key] = entry;
      });

    return { created, updated, deleted };
  }, [logs]);



  const rows = useMemo(() => {
    return latest.map((d) => {
      const key = String(d.entity_id ?? d.id ?? "");
      const added = d?.added_by || logsByAction.created[key]?.actor_name || "?";
      const updated = logsByAction.updated[key]?.actor_name || "?";
      const deleted = d?.deleted_by || logsByAction.deleted[key]?.actor_name || "?";

      return {
        ...d,
        download_url: d?.download_url || `${API_BASE_URL}/api/documents/${d.id}/download`,
        has_file: d?.has_file ?? true,
        added_by: added,
        updated_by: updated,
        deleted_by: deleted,
      };
    });
  }, [latest, logsByAction]);

  if (loading) {
    return <div className="alert alertInfo card">جاري تحميل لوحة القيادة...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alertError" style={{ marginBottom: 12 }}>
          <strong>خطأ:</strong> {error}
        </div>
        <button className="btn btnSecondary" type="button" onClick={fetchDashboard}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard rtl">
      {/* ================= KPIs ================= */}
      <div className="dashKpis">
        {kpiCards.map((c) => (
          <div key={c.key} className="card kpiCard">
            <div className="kpiTop">
              <div className="kpiTitle">{c.title}</div>
              <span className={c.pillClass}>{c.pill}</span>
            </div>
            <div className="kpiValue">{c.value}</div>
            <div className="kpiSub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ================= Latest table ================= */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="tableTop">
          <div>
            <div className="cardTitle" style={{ margin: 0 }}>{"\u0622\u062e\u0631 \u0627\u0644\u0648\u062b\u0627\u0626\u0642"}</div>
          </div>

          <div className="rowActions">
            <Link className="btn btnSecondary" to="/search">
              الذهاب إلى البحث
            </Link>
            <button className="btn btnSecondary" type="button" onClick={openMissing}>
              {"\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0634\u0627\u063a\u0631\u0629"}
            </button>
            <Link className="btn btnPrimary" to="/add">
              إضافة وثيقة
            </Link>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>{"الشعبة"}</th>
                <th>{"نوع القضية"}</th>
                <th>{"رقم الملف"}</th>
                <th>{"رقم الحكم"}</th>
                <th>{"القاضي"}</th>
                <th>{"الإجراءات"}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>{d.division || "—"}</td>
                  <td style={{ fontWeight: 900 }}>
                    {d.is_deleted
                      ? `${"\u0645\u062d\u0630\u0648\u0641"}${d.type_or_keyword ? ` - ${d.type_or_keyword}` : ""}`
                      : d.type_or_keyword || d.type || d.keyword || "—"}
                  </td>
                  <td>{d.case_number || "—"}</td>
                  <td>{d.judgement_number || "—"}</td>
                  <td>{d.judge_name || "—"}</td>

                  <td>
                    <div className="rowActions">
                      <button className="btn btnSecondary btn--sm" type="button" onClick={() => onShowDetails(d)}>
                        {"عرض التفاصيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: "var(--muted)" }}>
                    لا توجد وثائق.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {detailsOpen && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailsOpen(false);
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
            role="dialog"
            aria-modal="true"
            aria-label="Document details"
            style={{
              width: "min(700px, 100%)",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
              overflow: "hidden",
            }}
          >
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
                  background: "rgba(37,99,235,.12)",
                  color: "#2563eb",
                  fontWeight: 900,
                }}
              >
                i
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{"تفاصيل الوثيقة"}</div>
                <div style={{ color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
                  {"معلومات الوثيقة مع سجل التعديلات"}
                </div>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {detailsLoading && (
                <div className="alert alertInfo">{"جاري تحميل التفاصيل..."}</div>
              )}

              {!detailsLoading && details?.doc && (
                <div className="kv" style={{ marginBottom: 12 }}>
                  <div><span className="k">{"الشعبة"}:</span> {details.doc.division || "\u2014"}</div>
                  <div><span className="k">{"نوع القضية"}:</span> {details.doc.type_or_keyword || details.doc.type || details.doc.keyword || "\u2014"}</div>
                  <div><span className="k">{"رقم الملف"}:</span> {details.doc.case_number || "\u2014"}</div>
                  <div><span className="k">{"رقم الحكم"}:</span> {details.doc.judgement_number || "\u2014"}</div>
                  <div><span className="k">{"القاضي"}:</span> {details.doc.judge_name || "\u2014"}</div>
                </div>
              )}

              {!detailsLoading && details?.logs && (
                <div className="tableWrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{"الإجراء"}</th>
                        <th>{"بواسطة"}</th>
                        <th>{"التاريخ"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["created", "updated", "deleted"].map((action) => {
                        const l = details.logs.find((x) => x?.action === action);
                        const label = action === "created" ? "\u0625\u0636\u0627\u0641\u0629" : action === "updated" ? "\u062a\u0639\u062f\u064a\u0644" : "\u062d\u0630\u0641";
                        const actor = l?.actor_name || (l?.employee_id ? `#${l.employee_id}` : "?");
                        const at = l?.created_at || "\u2014";
                        return (
                          <tr key={action}>
                            <td>{label}</td>
                            <td>{actor}</td>
                            <td>{formatDateTime(at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!detailsLoading && !details?.doc && (
                <div className="alert alertError">{"تعذر تحميل التفاصيل."}</div>
              )}
            </div>

            <div style={{ padding: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {!detailsLoading && details?.doc && !details.doc.is_deleted && (
                <Link className="btn btnPrimary" to={`/documents/${details.doc.id}`}>
                  {"عرض الوثيقة"}
                </Link>
              )}
              <button className="btn btnSecondary" type="button" onClick={() => setDetailsOpen(false)}>
                {"إغلاق"}
              </button>
            </div>
          </div>
        </div>
      )}

      {missingOpen && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMissingOpen(false);
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
            role="dialog"
            aria-modal="true"
            aria-label="Missing judgement numbers"
            style={{
              width: "min(640px, 100%)",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
              overflow: "hidden",
            }}
          >
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
                  background: "rgba(16,185,129,.14)",
                  color: "#059669",
                  fontWeight: 900,
                }}
              >
                #
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {"\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0634\u0627\u063a\u0631\u0629"}
                </div>
                <div style={{ color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
                  {"\u0644\u0627\u0626\u062d\u0629 \u0627\u0644\u0623\u062d\u0643\u0627\u0645 \u063a\u064a\u0631 \u0627\u0644\u0645\u0633\u062c\u0644\u0629"}
                </div>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <div className="rowActions" style={{ justifyContent: "flex-start", gap: 10, marginBottom: 12 }}>
                <div className="field" style={{ maxWidth: 180 }}>
                  <div className="label">{"\u0627\u0644\u0633\u0646\u0629"}</div>
                  <select
                    className="select"
                    value={missingYear}
                    disabled={missingYearsLoading}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMissingYear(v);
                      fetchMissing(v);
                    }}
                  >
                    {!missingYearsLoading && missingYears.length === 0 && (
                      <option value={missingYear || String(new Date().getFullYear())}>
                        {missingYear || String(new Date().getFullYear())}
                      </option>
                    )}
                    {missingYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {missingError && (
                <div className="alert alertError" style={{ marginBottom: 12 }}>
                  <strong>{"\u062e\u0637\u0623:"}</strong> {missingError}
                </div>
              )}

              <div className="tableWrap" style={{ maxHeight: 320, overflowY: "auto", overflowX: "hidden" }}>
                <table className="table" style={{ textAlign: "center" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center" }}>{"\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0646\u0627\u0642\u0635"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingLoading && (
                      <tr>
                        <td style={{ color: "var(--muted)", textAlign: "center" }}>
                          {"\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..."}
                        </td>
                      </tr>
                    )}

                    {!missingLoading &&
                      missingList.map((x) => (
                        <tr key={x}>
                          <td style={{ textAlign: "center" }}>{x}</td>
                        </tr>
                      ))}

                    {!missingLoading && missingList.length === 0 && (
                      <tr>
                        <td style={{ color: "var(--muted)", textAlign: "center" }}>
                          {"\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0631\u0642\u0627\u0645 \u0634\u0627\u063a\u0631\u0629."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btnSecondary" type="button" disabled={!missingList.length} onClick={handleMissingDownload}>
                {"\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0642\u0627\u0626\u0645\u0629"}
              </button>
              <button className="btn btnPrimary" type="button" onClick={() => setMissingOpen(false)}>
                {"\u0625\u063a\u0644\u0627\u0642"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
