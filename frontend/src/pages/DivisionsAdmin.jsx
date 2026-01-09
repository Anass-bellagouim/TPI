import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

export default function DivisionsAdmin() {
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({ name: "", is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ name: "", is_active: true });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function fetchDivisions() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const res = await api.get("/admin/divisions");
      const data = res.data?.data || res.data || [];
      setRows(Array.isArray(data) ? data : []);
      if ((data?.length || 0) === 0) setInfo("ما كايناش شعب دابا. زيد أول شعبة من الفورم.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء جلب الشعب.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDivisions();
  }, []);

  const filtered = useMemo(() => {
    const qq = norm(q);
    if (!qq) return rows;
    return rows.filter((r) => norm(r.name).includes(qq));
  }, [rows, q]);

  async function onAdd(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const name = form.name.trim();
    if (!name) return setError("اسم الشعبة ضروري.");

    try {
      setSaving(true);
      const res = await api.post("/admin/divisions", {
        name,
        is_active: !!form.is_active,
      });

      setInfo(res.data?.message || "تمت إضافة الشعبة.");
      setForm({ name: "", is_active: true });
      await fetchDivisions();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "وقع خطأ أثناء إضافة الشعبة.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEdit({ name: row.name || "", is_active: !!row.is_active });
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ name: "", is_active: true });
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const name = edit.name.trim();
    if (!name) return setError("اسم الشعبة ضروري.");

    try {
      setSaving(true);
      const res = await api.patch(`/admin/divisions/${id}`, {
        name,
        is_active: !!edit.is_active,
      });
      setInfo(res.data?.message || "تم تحديث الشعبة.");
      cancelEdit();
      await fetchDivisions();
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

  async function removeDivision(id) {
    setError("");
    setInfo("");

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد الشعبة؟");
    if (!ok) return;

    try {
      setSaving(true);
      const res = await api.delete(`/admin/divisions/${id}`);
      setInfo(res.data?.message || "تم حذف الشعبة.");
      await fetchDivisions();
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
    try {
      setSaving(true);
      const res = await api.patch(`/admin/divisions/${row.id}`, {
        name: row.name,
        is_active: !row.is_active,
      });
      setInfo(res.data?.message || "تم التحديث.");
      await fetchDivisions();
    } catch (e) {
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
    <div className="divAdmin">
      <div className="pageHeader">
        <div>
          <h2>إدارة الشعب</h2>
          <p>إضافة / تعديل / تعطيل الشعب + الدخول لإدارة القضايا ديال كل شعبة. (Admin فقط)</p>
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

      {/* ✅ Add form (TOP) */}
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
              <span>مفعّلة (Active)</span>
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

      {/* ✅ List (BOTTOM) */}
      <div className="card">
        <div className="listTop">
          <div>
            <h3 className="cardTitle">لائحة الشعب</h3>
            <div className="help">المجموع: {rows.length}</div>
          </div>

          <div className="searchBox">
            <input className="input input--sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." />
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
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

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => {
                  const isEditing = editingId === r.id;

                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input input--sm"
                            value={edit.name}
                            onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                            disabled={saving}
                          />
                        ) : (
                          <>
                            <div className="nameCell">{r.name}</div>
                            <div className="help">sort_order: {r.sort_order ?? 0}</div>
                          </>
                        )}
                      </td>

                      {/* ✅ Status pill clickable (toggle) */}
                      <td>
                        {isEditing ? (
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={!!edit.is_active}
                              onChange={(e) => setEdit((p) => ({ ...p, is_active: e.target.checked }))}
                              disabled={saving}
                            />
                            <span>{edit.is_active ? "Active" : "Inactive"}</span>
                          </label>
                        ) : (
                          <button
                            type="button"
                            className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}
                            onClick={() => quickToggle(r)}
                            disabled={saving}
                            title={r.is_active ? "اضغط لتعطيل الشعبة" : "اضغط لتفعيل الشعبة"}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: saving ? "not-allowed" : "pointer",
                              padding: 0,
                            }}
                          >
                            {r.is_active ? "Active" : "Inactive"}
                          </button>
                        )}
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

                              <button
                                className="btn btnSecondary btn--sm"
                                type="button"
                                disabled={saving}
                                onClick={() => nav(`/case-types?division_id=${r.id}`)}
                              >
                                إدارة القضايا
                              </button>

                              <button className="btn btnDanger btn--sm" type="button" disabled={saving} onClick={() => removeDivision(r.id)}>
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

        <div className="help" style={{ marginTop: 10 }}>
          ملاحظة: التفعيل/التعطيل كيدار من زر الحالة (Active/Inactive).
        </div>
      </div>
    </div>
  );
}
