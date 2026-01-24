 import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE_URL } from "../api";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function Dashboard() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const logsByEntityId = useMemo(() => {
    const map = {};
    logs
      .filter((l) => l?.entity_type === "document" && l?.action === "created")
      .forEach((l) => {
        if (!l?.entity_id) return;
        map[String(l.entity_id)] = {
          actor_name: l.actor_name || (l.user_id ? `#${l.user_id}` : "?"),
          created_at: l.created_at,
        };
      });
    return map;
  }, [logs]);

  const rows = useMemo(() => {
    return latest.map((d) => {
      const log = logsByEntityId[String(d.id)];
      return {
        ...d,
        download_url: d?.download_url || `${API_BASE_URL}/api/documents/${d.id}/download`,
        has_file: d?.has_file ?? true,
        added_by: log?.actor_name || "?",
        added_at: log?.created_at || d?.created_at || null,
      };
    });
  }, [latest, logsByEntityId]);

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
            <div className="cardTitle" style={{ margin: 0 }}>
              آخر الوثائق المضافة
            </div>
          </div>

          <div className="rowActions">
            <Link className="btn btnSecondary" to="/search">
              الذهاب إلى البحث
            </Link>
            <Link className="btn btnPrimary" to="/add">
              إضافة وثيقة
            </Link>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>الشعبة</th>
                <th>نوع القضية</th>
                <th>رقم الملف</th>
                <th>رقم الحكم</th>
                <th>القاضي</th>
                <th>أضيفة بوساطة</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>{d.division || "—"}</td>
                  <td style={{ fontWeight: 900 }}>{d.type_or_keyword || d.type || d.keyword || "—"}</td>
                  <td>{d.case_number || "—"}</td>
                  <td>{d.judgement_number || "—"}</td>
                  <td>{d.judge_name || "—"}</td>
                  <td>{d.added_by || "?"}</td>
                  <td>{formatDateTime(d.added_at)}</td>

                  <td>
                    <div className="rowActions">
                      <Link className="btn btnSecondary btn--sm" to={`/documents/${d.id}`}>
                        عرض
                      </Link>

                      {d.has_file && d.download_url && (
                        <a className="btn btnSecondary btn--sm" href={d.download_url}>
                          تحميل
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--muted)" }}>
                    لا توجد وثائق.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
