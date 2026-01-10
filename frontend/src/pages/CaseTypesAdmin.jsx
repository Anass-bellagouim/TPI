import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api.js";

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const PER_PAGE_KEY = "case_types_per_page";
function readPerPage() {
  const v = Number(localStorage.getItem(PER_PAGE_KEY));
  if ([10, 25, 50, 100].includes(v)) return v;
  return 10;
}

export default function CaseTypesAdmin() {
  const nav = useNavigate();
  const qp = useQuery();

  const [divisions, setDivisions] = useState([]);
  const [divisionId, setDivisionId] = useState(qp.get("division_id") || "");

  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  const [form, setForm] = useState({ code: "", name: "", is_active: true });

  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ division_id: "", code: "", name: "" });
  const [editingIsActive, setEditingIsActive] = useState(true);

  const [perPage, setPerPage] = useState(readPerPage());
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function fetchDivisions() {
    const res = await api.get("/admin/divisions");
    const data = res.data?.data || res.data || [];
    setDivisions(Array.isArray(data) ? data : []);
  }

  // ✅ جلب case types غير ملي كتبدّل division (ولا refresh)
  async function fetchCaseTypes() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const params = {};
      if (divisionId) params.division_id = divisionId;

      const res = await api.get("/admin/case-types", { params });
      const data = res.data?.data || res.data || [];
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);

      if ((arr?.length || 0) === 0) setInfo("ما كاين حتى نوع قضية فهاد الشعبة دابا.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء جلب أنواع القضايا.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDivisions().catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    setQ(""); // ✅ منين كتبدّل الشعبة نفرّغ البحث تلقائياً
    fetchCaseTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  useEffect(() => {
    localStorage.setItem(PER_PAGE_KEY, String(perPage));
    setPage(1);
  }, [perPage]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  function onChangeDivision(v) {
    setDivisionId(v);

    setEditingId(null);
    setEdit({ division_id: "", code: "", name: "" });
    setEditingIsActive(true);
    setForm({ code: "", name: "", is_active: true });

    nav(`/case-types${v ? `?division_id=${v}` : ""}`, { replace: true });
  }

  async function onAdd(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!divisionId) return setError("اختار الشعبة أولا.");
    const code = form.code.trim();
    const name = form.name.trim();

    if (!/^\d{4}$/.test(code)) return setError("رمز القضية خاصو يكون 4 أرقام (مثال: 2101).");
    if (!name) return setError("اسم القضية ضروري.");

    try {
      setSaving(true);
      const res = await api.post("/admin/case-types", {
        division_id: Number(divisionId),
        code,
        name,
        is_active: !!form.is_active,
      });

      setInfo(res.data?.message || "تمت الإضافة.");
      setForm({ code: "", name: "", is_active: true });
      await fetchCaseTypes();
      setPage(1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء الإضافة.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEdit({
      division_id: r.division_id,
      code: r.code || "",
      name: r.name || "",
    });
    setEditingIsActive(!!r.is_active);
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ division_id: "", code: "", name: "" });
    setEditingIsActive(true);
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const code = (edit.code || "").trim();
    const name = (edit.name || "").trim();

    if (!/^\d{4}$/.test(code)) return setError("رمز القضية خاصو يكون 4 أرقام (مثال: 2101).");
    if (!name) return setError("اسم القضية ضروري.");

    const currentRow = rows.find((r) => r.id === id);
    const latestIsActive = currentRow ? !!currentRow.is_active : !!editingIsActive;

    try {
      setSaving(true);
      const res = await api.patch(`/admin/case-types/${id}`, {
        division_id: Number(edit.division_id),
        code,
        name,
        is_active: latestIsActive,
      });

      setInfo(res.data?.message || "تم التحديث.");
      cancelEdit();
      await fetchCaseTypes();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء التحديث.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id) {
    setError("");
    setInfo("");

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد نوع القضية؟");
    if (!ok) return;

    try {
      setSaving(true);
      const res = await api.delete(`/admin/case-types/${id}`);
      setInfo(res.data?.message || "تم الحذف.");
      await fetchCaseTypes();
      setPage(1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء الحذف.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function quickToggle(row) {
    setError("");
    setInfo("");

    const nextActive = !row.is_active;

    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: nextActive } : r)));
    if (editingId === row.id) setEditingIsActive(nextActive);

    try {
      setSaving(true);
      const res = await api.patch(`/admin/case-types/${row.id}`, {
        division_id: Number(row.division_id),
        code: String(row.code || "").trim(),
        name: String(row.name || "").trim(),
        is_active: nextActive,
      });
      setInfo(res.data?.message || "تم التحديث.");
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !!row.is_active } : r)));
      if (editingId === row.id) setEditingIsActive(!!row.is_active);

      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء التفعيل/التعطيل.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const divisionName = useMemo(() => {
    const d = divisions.find((x) => String(x.id) === String(divisionId));
    return d?.name || "";
  }, [divisions, divisionId]);

  // ✅ sort local (display)
  const sortedRows = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : [];
    arr.sort((a, b) => String(a?.code || "").localeCompare(String(b?.code || "")));
    return arr;
  }, [rows]);

  // ✅ LIVE FILTER (client-side) بلا API وبلا buttons
  const displayRows = useMemo(() => {
    const qq = norm(q);
    if (!qq) return sortedRows;
    return sortedRows.filter((r) => {
      const code = norm(r.code);
      const name = norm(r.name);
      return code.includes(qq) || name.includes(qq);
    });
  }, [sortedRows, q]);

  // ✅ pagination على displayRows
  const total = displayRows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), lastPage);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return displayRows.slice(start, start + perPage);
  }, [displayRows, safePage, perPage]);

  const canPrev = safePage > 1;
  const canNext = safePage < lastPage;

  return (
    <div className="caseAdmin">
      <div className="pageHeader">
        <div>
          <h2>إدارة أنواع القضايا</h2>
          <p>اختار الشعبة ثم زيد القضايا ديالها بالرمز (4 أرقام) + حالة Active/Inactive.</p>
        </div>

        <div className="headerActions">
          <button className="btn btnSecondary" type="button" disabled={loading || saving} onClick={fetchCaseTypes}>
            تحديث
          </button>
          <button className="btn btnSecondary" type="button" onClick={() => nav("/divisions")}>
            رجوع للشعب
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

      {/* اختيار الشعبة */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="gridTop">
          <div className="field">
            <div className="label">الشعبة</div>
            <select className="select" value={divisionId} onChange={(e) => onChangeDivision(e.target.value)} disabled={saving}>
              <option value="">— اختر الشعبة —</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="help">الشعبة الحالية: {divisionName || "—"}</div>
          </div>

          <div className="help" style={{ alignSelf: "end" }}>
            نصيحة: الرمز خاصو يكون <b>4 أرقام</b> (مثال: 2101)
          </div>
        </div>
      </div>

      {/* Add */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="cardTitle">إضافة نوع قضية</h3>

        <form onSubmit={onAdd} className="gridAdd">
          <div className="field">
            <div className="label">الرمز (4 أرقام)</div>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="مثال: 2101"
              disabled={saving || !divisionId}
            />
          </div>

          <div className="field">
            <div className="label">الاسم</div>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="مثال: جنحي عادي تأديبي"
              disabled={saving || !divisionId}
            />
          </div>

          <div className="field">
            <div className="label">الحالة</div>
            <label className="check">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                disabled={saving || !divisionId}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="rowActions" style={{ alignItems: "end" }}>
            <button className="btn btnPrimary" type="submit" disabled={saving || !divisionId}>
              {saving ? "..." : "إضافة"}
            </button>
          </div>
        </form>

        {!divisionId && <div className="help" style={{ marginTop: 8 }}>اختار الشعبة أولا باش تقدر تزيد القضايا.</div>}
      </div>

      {/* List */}
      <div className="card">
        <div className="listTop" style={{ alignItems: "center" }}>
          <div>
            <h3 className="cardTitle" style={{ marginBottom: 2 }}>
              لائحة القضايا
            </h3>
            <div className="help">
              المجموع: {total} — صفحة {safePage}/{lastPage}
            </div>
          </div>

          {/* ✅ LIVE SEARCH + perPage (بلا buttons) */}
          <div className="searchBox" style={{ minWidth: 360, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                className="input input--sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="كتب باش يفلتر (بالرمز أو الاسم)..."
                disabled={saving}
                style={{ paddingLeft: 34 }}
              />

              {/* ✅ clear داخل input (ماشي زر تصفير) */}
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

            <div className="field" style={{ minWidth: 90 }}>
              <select
                className="select select--sm"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                disabled={loading || saving}
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
                <th style={{ width: 90 }}>الرمز</th>
                <th>الاسم</th>
                <th style={{ width: 140 }}>الحالة</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              )}

              {!loading && pagedRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}

              {!loading &&
                pagedRows.map((r) => {
                  const isEditing = editingId === r.id;

                  return (
                    <tr key={r.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--sm"
                            value={edit.code}
                            onChange={(e) => setEdit((p) => ({ ...p, code: e.target.value }))}
                            disabled={saving}
                          />
                        ) : (
                          <b>{r.code}</b>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input input--sm"
                            value={edit.name}
                            onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                            disabled={saving}
                          />
                        ) : (
                          r.name
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}
                          onClick={() => quickToggle(r)}
                          disabled={saving}
                          title={r.is_active ? "اضغط لتعطيل نوع القضية" : "اضغط لتفعيل نوع القضية"}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: saving ? "not-allowed" : "pointer",
                            padding: 0,
                          }}
                        >
                          {r.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td>
                        <div className="rowActions">
                          {isEditing ? (
                            <>
                              <button className="btn btnPrimary btn--sm" type="button" disabled={saving} onClick={() => saveEdit(r.id)}>
                                {saving ? "..." : "حفظ"}
                              </button>
                              <button className="btn btnSecondary btn--sm" type="button" disabled={saving} onClick={cancelEdit}>
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn btnSecondary btn--sm" type="button" disabled={saving} onClick={() => startEdit(r)}>
                                تعديل
                              </button>
                              <button className="btn btnDanger btn--sm" type="button" disabled={saving} onClick={() => removeRow(r.id)}>
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="pager" style={{ marginTop: 12 }}>
          <div className="help">
            عرض {pagedRows.length} من {total} — per page: <b>{perPage}</b>
          </div>

          <div className="rowActions">
            <button
              className="btn btnSecondary"
              type="button"
              disabled={!canPrev || loading || saving}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={!canNext || loading || saving}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              التالي
            </button>
          </div>
        </div>

        <div className="help" style={{ marginTop: 10 }}>
          ملاحظة: تقدر تبدّل الحالة Active/Inactive حتى وانت فـ تعديل. Inactive ما كيبانش فـ lookups ديال المستخدمين.
        </div>
      </div>
    </div>
  );
}
