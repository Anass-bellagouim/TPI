// src/pages/DivisionsAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

const PER_PAGE_KEY = "divisions_per_page";

function readPerPage() {
  const v = Number(localStorage.getItem(PER_PAGE_KEY));
  if ([10, 25, 50, 100].includes(v)) return v;
  return 10;
}

export default function DivisionsAdmin() {
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({ name: "", is_active: true });

  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ name: "" });

  const [editingIsActive, setEditingIsActive] = useState(true);

  const [perPage, setPerPage] = useState(readPerPage());
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ✅ confirm modal (delete)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);

  async function fetchDivisions() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const res = await api.get("/admin/divisions");
      const data = res.data?.data || res.data || [];
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      if ((arr?.length || 0) === 0) setInfo("لا توجد شعب حاليًا. أضف أول شعبة من النموذج.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء جلب الشعب.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    localStorage.setItem(PER_PAGE_KEY, String(perPage));
    setPage(1);
  }, [perPage]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const filtered = useMemo(() => {
    const qq = norm(q);
    if (!qq) return rows;
    return rows.filter((r) => norm(r.name).includes(qq));
  }, [rows, q]);

  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), lastPage);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
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

    const name = form.name.trim();
    if (!name) return setError("اسم الشعبة مطلوب.");

    try {
      setSaving(true);
      const res = await api.post("/admin/divisions", {
        name,
        is_active: !!form.is_active,
      });

      setInfo(res.data?.message || "تمت إضافة الشعبة.");
      setForm({ name: "", is_active: true });
      await fetchDivisions();
      setPage(1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء إضافة الشعبة.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEdit({ name: row.name || "" });
    setEditingIsActive(!!row.is_active);
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ name: "" });
    setEditingIsActive(true);
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const name = edit.name.trim();
    if (!name) return setError("اسم الشعبة مطلوب.");

    const currentRow = rows.find((r) => r.id === id);
    const latestIsActive = currentRow ? !!currentRow.is_active : !!editingIsActive;

    try {
      setSaving(true);

      const res = await api.patch(`/admin/divisions/${id}`, {
        name,
        is_active: latestIsActive,
      });

      setInfo(res.data?.message || "تم تحديث الشعبة.");
      cancelEdit();
      await fetchDivisions();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء التحديث.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ✅ بدل window.confirm: كنفتح modal
  function askRemoveDivision(row) {
    setError("");
    setInfo("");
    setConfirmRow(row);
    setConfirmOpen(true);
  }

  // ✅ نفس منطق الحذف الحقيقي
  async function doRemoveDivision() {
    if (!confirmRow) return;

    setError("");
    setInfo("");

    try {
      setSaving(true);
      const res = await api.delete(`/admin/divisions/${confirmRow.id}`);
      setInfo(res.data?.message || "تم حذف الشعبة.");
      await fetchDivisions();
      setPage(1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء الحذف.";
      setError(msg);
    } finally {
      setSaving(false);
      setConfirmOpen(false);
      setConfirmRow(null);
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
      const res = await api.patch(`/admin/divisions/${row.id}`, {
        name: row.name,
        is_active: nextActive,
      });
      setInfo(res.data?.message || "تم التحديث.");
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: row.is_active } : r)));
      if (editingId === row.id) setEditingIsActive(!!row.is_active);

      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "حدث خطأ أثناء التفعيل/التعطيل.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="divAdmin">
      <div className="pageHeader">
        <div>
          <h2>إدارة الشعب</h2>
        </div>
        <div className="headerActions">
          <button className="btn btnSecondary" type="button" onClick={fetchDivisions} disabled={loading || saving}>
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

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="cardTitle">إضافة شعبة جديدة</h3>
        <form onSubmit={onAdd}>
          <div className="field">
            <div className="label">اسم الشعبة</div>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="مثال: شعبة الجنح العادية"
              disabled={saving}
            />
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <label className="check">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                disabled={saving}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={saving}>
              {saving ? "..." : "إضافة"}
            </button>
            <button className="btn btnSecondary" type="button" disabled={saving} onClick={() => setForm({ name: "", is_active: true })}>
              مسح
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="listTop" style={{ alignItems: "center" }}>
          <div>
            <h3 className="cardTitle">لائحة الشعب</h3>
            <div className="help">
              المجموع: {total} — صفحة {safePage}/{lastPage}
            </div>
          </div>

          <div className="searchBox" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="input input--sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." />

            <div className="field" style={{ minWidth: 40 }}>
              <select className="select select--sm" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} disabled={loading || saving}>
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
                <th>الشعبة</th>
                <th style={{ width: 120 }}>الحالة</th>
                <th style={{ width: 280 }}>Actions</th>
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
                          <input className="input input--sm" value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} disabled={saving} />
                        ) : (
                          <>
                            <div className="nameCell">{r.name}</div>
                          </>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}
                          onClick={() => quickToggle(r)}
                          disabled={saving}
                          title={r.is_active ? "اضغط لتعطيل الشعبة" : "اضغط لتفعيل الشعبة"}
                          style={{ background: "transparent", border: "none", cursor: saving ? "not-allowed" : "pointer", padding: 0 }}
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

                              <button className="btn btnSecondary btn--sm" type="button" disabled={saving} onClick={() => nav(`/case-types?division_id=${r.id}`)}>
                                إدارة القضايا
                              </button>

                              <button className="btn btnDanger btn--sm" type="button" disabled={saving} onClick={() => askRemoveDivision(r)}>
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
          <div className="rowActions">
            <button className="btn btnSecondary" type="button" disabled={!canPrev || loading || saving} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              السابق
            </button>

            <button className="btn btnSecondary" type="button" disabled={!canNext || loading || saving} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
              التالي
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="حذف الشعبة نهائيًا"
        message={`هل أنت متأكد أنك تريد حذف الشعبة: "${confirmRow?.name || ""}"؟ هذه العملية نهائية.`}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        loading={saving}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmRow(null);
        }}
        onConfirm={doRemoveDivision}
      />
    </div>
  );
}
