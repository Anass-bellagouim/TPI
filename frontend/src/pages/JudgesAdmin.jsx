import React, { useEffect, useMemo, useState } from "react";
import api from "../api.js";

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

const PER_PAGE_KEY = "judges_per_page";
function readPerPage() {
  const v = Number(localStorage.getItem(PER_PAGE_KEY));
  if ([10, 25, 50, 100].includes(v)) return v;
  return 10;
}

export default function JudgesAdmin() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({ full_name: "", is_active: true });

  const [editingId, setEditingId] = useState(null);
  // ✅ edit: الاسم فقط
  const [edit, setEdit] = useState({ full_name: "" });
  // ✅ نخزنو is_active ديال row اللي كيتعدل
  const [editingIsActive, setEditingIsActive] = useState(true);

  // ✅ perPage + page (client-side)
  const [perPage, setPerPage] = useState(readPerPage());
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function fetchJudges() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const res = await api.get("/admin/judges");
      const data = res.data?.data || res.data || [];
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      if ((arr?.length || 0) === 0) setInfo("ما كايناش قضاة دابا. زيد أول قاضي من الفورم.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء جلب القضاة.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJudges();
  }, []);

  // ✅ حفظ perPage
  useEffect(() => {
    localStorage.setItem(PER_PAGE_KEY, String(perPage));
    setPage(1);
  }, [perPage]);

  // ✅ أي بحث جديد رجع للصفحة 1
  useEffect(() => {
    setPage(1);
  }, [q]);

  const filtered = useMemo(() => {
    const qq = norm(q);
    if (!qq) return rows;
    return rows.filter((r) => norm(r.full_name).includes(qq));
  }, [rows, q]);

  // ✅ Client-side pagination
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), lastPage);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage, perPage]);

  const canPrev = safePage > 1;
  const canNext = safePage < lastPage;

  async function onAdd(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const full_name = form.full_name.trim();
    if (!full_name) return setError("اسم القاضي ضروري.");

    try {
      setSaving(true);
      const res = await api.post("/admin/judges", {
        full_name,
        is_active: !!form.is_active,
      });

      setInfo(res.data?.message || "تمت إضافة القاضي.");
      setForm({ full_name: "", is_active: true });
      await fetchJudges();
      setPage(1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء إضافة القاضي.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEdit({ full_name: row.full_name || "" });
    setEditingIsActive(!!row.is_active);
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ full_name: "" });
    setEditingIsActive(true);
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const full_name = edit.full_name.trim();
    if (!full_name) return setError("اسم القاضي ضروري.");

    // ✅ خذ آخر is_active من rows (باش ما يرجّعش الحالة للقديم)
    const currentRow = rows.find((r) => r.id === id);
    const latestIsActive = currentRow ? !!currentRow.is_active : !!editingIsActive;

    try {
      setSaving(true);
      const res = await api.patch(`/admin/judges/${id}`, {
        full_name,
        is_active: latestIsActive,
      });

      setInfo(res.data?.message || "تم تحديث القاضي.");
      cancelEdit();
      await fetchJudges();
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

  async function removeJudge(id) {
    setError("");
    setInfo("");

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد القاضي؟");
    if (!ok) return;

    try {
      setSaving(true);
      const res = await api.delete(`/admin/judges/${id}`);
      setInfo(res.data?.message || "تم حذف القاضي.");
      await fetchJudges();
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

    // ✅ Optimistic UI
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: nextActive } : r)));

    if (editingId === row.id) setEditingIsActive(nextActive);

    try {
      setSaving(true);
      const res = await api.patch(`/admin/judges/${row.id}`, {
        full_name: row.full_name,
        is_active: nextActive,
      });
      setInfo(res.data?.message || "تم التحديث.");
    } catch (e) {
      // rollback
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

  return (
    <div className="judgesAdmin">
      <div className="pageHeader">
        <div>
          <h2>إدارة القضاة</h2>
          <p>إضافة / تعديل / تعطيل القضاة. (Admin فقط)</p>
        </div>

        <div className="headerActions">
          <button className="btn btnSecondary" type="button" onClick={fetchJudges} disabled={loading || saving}>
            تحديث
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

      {/* ✅ Add (TOP) */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="cardTitle">إضافة قاضي جديد</h3>

        <form onSubmit={onAdd}>
          <div className="field">
            <div className="label">اسم القاضي</div>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="مثال: القاضي محمد..."
              disabled={saving}
            />
            <div className="help">خاص الاسم يكون unique.</div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <label className="check">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                disabled={saving}
              />
              <span>مفعّل (Active)</span>
            </label>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={saving}>
              {saving ? "..." : "إضافة"}
            </button>
            <button
              className="btn btnSecondary"
              type="button"
              disabled={saving}
              onClick={() => setForm({ full_name: "", is_active: true })}
            >
              مسح
            </button>
          </div>
        </form>
      </div>

      {/* ✅ List (BOTTOM) */}
      <div className="card">
        {/* ✅ listTop: search + perPage فوق الجدول */}
        <div className="listTop" style={{ alignItems: "center" }}>
          <div>
            <h3 className="cardTitle">لائحة القضاة</h3>
            <div className="help">
              المجموع: {total} — صفحة {safePage}/{lastPage}
            </div>
          </div>

          <div className="searchBox" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="input input--sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." />

            <div className="field" style={{ minWidth: 40 }}>
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
                <th style={{ width: 70 }}>#</th>
                <th>الاسم</th>
                <th style={{ width: 120 }}>الحالة</th>
                <th style={{ width: 230 }}>Actions</th>
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
                      <td>{r.id}</td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input input--sm"
                            value={edit.full_name}
                            onChange={(e) => setEdit((p) => ({ ...p, full_name: e.target.value }))}
                            disabled={saving}
                          />
                        ) : (
                          <div className="nameCell">{r.full_name}</div>
                        )}
                      </td>

                      {/* ✅ Status: ديما زر toggle */}
                      <td>
                        <button
                          type="button"
                          className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}
                          onClick={() => quickToggle(r)}
                          disabled={saving}
                          title={r.is_active ? "اضغط لتعطيل القاضي" : "اضغط لتفعيل القاضي"}
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

                              <button className="btn btnDanger btn--sm" type="button" disabled={saving} onClick={() => removeJudge(r.id)}>
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

        {/* ✅ pager local */}
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
          ملاحظة: التعطيل كيدير is_active=0 وكيخلي القاضي ما يبانش فـ lookups (إلا active=1).
        </div>
      </div>
    </div>
  );
}
