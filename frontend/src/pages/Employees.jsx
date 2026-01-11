import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

const PER_PAGE_KEY = "employees_per_page";

function readPerPage() {
  const v = Number(localStorage.getItem(PER_PAGE_KEY));
  if ([10, 25, 50, 100].includes(v)) return v;
  return 10;
}

export default function Employees() {
  const [q, setQ] = useState("");
  const [perPage, setPerPage] = useState(readPerPage());

  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const lastParamsRef = useRef({ per_page: perPage });

  const rows = useMemo(() => pageData?.data || [], [pageData]);

  const params = useMemo(() => {
    const p = { per_page: perPage };
    const qq = q.trim();
    if (qq) p.search = qq;
    return p;
  }, [q, perPage]);

  async function fetchEmployees(url = "/admin/employees", p = params) {
    setError("");
    setInfo("");
    try {
      setLoading(true);

      lastParamsRef.current = p;

      const res = await api.get(url, { params: p });
      setPageData(res.data);

      if ((res.data?.data || []).length === 0) {
        setInfo("لا يوجد أي موظف مطابق لهذا البحث.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء جلب الموظفين.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees("/admin/employees", params);
  }, []);

  useEffect(() => {
    localStorage.setItem(PER_PAGE_KEY, String(perPage));
    fetchEmployees("/admin/employees", params);
  }, [perPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEmployees("/admin/employees", params);
    }, 350);

    return () => clearTimeout(t);
  }, [q]);

  const canPrev = !!pageData?.prev_page_url;
  const canNext = !!pageData?.next_page_url;

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>البحث عن موظف</h2>
        </div>

        <div className="rowActions">
          <Link className="btn btnPrimary" to="/employees/add">
            إضافة موظف
          </Link>
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
        <div
          className="listTop"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 12,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 260 }}>
            <div style={{ position: "relative" }}>
              <input
                className="input input--sm"
                placeholder="الاسم / اللقب / اسم المستخدم"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: 34 }}
              />

              {!!q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  title="مسح"
                  aria-label="مسح"
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    color: "var(--muted)",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
            <div className="help" style={{ marginBottom: 6 }}>
              المجموع: {pageData?.total ?? 0}
            </div>

            <div className="field" style={{ minWidth: 40 }}>
              <select
                className="select select--sm"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>الاسم الكامل</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((u) => {
                const isActive = u?.is_active === true || u?.is_active === 1;

                return (
                  <tr key={u.id} style={{ opacity: isActive ? 1 : 0.75 }}>
                    <td>{u.id}</td>

                    <td>{u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}</td>

                    <td>{u.username || "—"}</td>
                    <td>{u.role || "user"}</td>

                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 12,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {isActive ? "✅ مفعّل" : "⛔ موقوف"}
                      </span>
                    </td>

                    <td>
                      <div className="rowActions">
                        <Link className="btn btnSecondary" to={`/employees/${u.id}`}>
                          تعديل
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    جاري التحميل...
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
                onClick={() => fetchEmployees(pageData.prev_page_url, lastParamsRef.current)}
              >
                السابق
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canNext || loading}
                onClick={() => fetchEmployees(pageData.next_page_url, lastParamsRef.current)}
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
