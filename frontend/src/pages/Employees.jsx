import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function Employees() {
  const [filters, setFilters] = useState({
    q: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const rows = useMemo(() => pageData?.data || [], [pageData]);

  async function fetchEmployees(url = "/employees", params = {}) {
    setError("");
    setInfo("");

    try {
      setLoading(true);
      const res = await api.get(url, { params });
      setPageData(res.data);

      if ((res.data?.data || []).length === 0) {
        setInfo("ما كاين حتى موظف مطابق لهاذ البحث.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء جلب الموظفين.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();

    const params = {};
    const q = filters.q?.trim();
    if (q) params.search = q;

    // إذا backend ديالك كيدعم role filter زيد هاد السطر:
    // if (filters.role) params.role = filters.role;

    fetchEmployees("/employees", params);
  }

  useEffect(() => {
    fetchEmployees("/employees", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = !!pageData?.prev_page_url;
  const canNext = !!pageData?.next_page_url;

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>الموظفون</h2>
          <p>بحث + عرض لائحة الموظفين (Admin فقط).</p>
        </div>

        <div className="rowActions">
          <Link className="btn btnPrimary" to="/employees/add">
            إضافة موظف
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={onSubmit}>
          <div className="grid2">
            <div className="field">
              <div className="label">بحث عام</div>
              <input
                className="input"
                placeholder="اسم / لقب / username / email"
                value={filters.q}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, q: e.target.value }))
                }
              />
            </div>

            <div className="field">
              <div className="label">Role</div>
              <select
                className="select"
                value={filters.role}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="">الكل</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
              <div className="help" style={{ marginTop: 6 }}>
                ملاحظة: Filter ديال role كيحتاج backend يدعمو (اختياري).
              </div>
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "بحث"}
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loading}
              onClick={() => {
                setFilters({ q: "", role: "" });
                fetchEmployees("/employees", {});
              }}
            >
              عرض الكل
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

      <div className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
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
                    <td>
                      {u.full_name ||
                        `${u.first_name || ""} ${u.last_name || ""}`.trim()}
                    </td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>

                    {/* ✅ Status column */}
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
                        title={isActive ? "الحساب مفعل" : "الحساب موقوف"}
                      >
                        {isActive ? "✅ مفعل" : "⛔ موقوف"}
                      </span>
                    </td>

                    <td>
                      <div className="rowActions">
                        <Link
                          className="btn btnSecondary"
                          to={`/employees/${u.id}`}
                        >
                          تعديل
                        </Link>

                        <Link
                          className="btn btnSecondary"
                          to={`/employees/${u.id}#password`}
                        >
                          تغيير كلمة المرور
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
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
              صفحة {pageData.current_page} / {pageData.last_page} — المجموع:{" "}
              {pageData.total}
            </div>

            <div className="rowActions">
              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canPrev || loading}
                onClick={() => fetchEmployees(pageData.prev_page_url, {})}
              >
                السابق
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canNext || loading}
                onClick={() => fetchEmployees(pageData.next_page_url, {})}
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
