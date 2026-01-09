import React, { useEffect, useMemo, useState } from "react";
import api from "../api.js";

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

export default function JudgesAdmin() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({ full_name: "", is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ full_name: "", is_active: true });

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
      setRows(Array.isArray(data) ? data : []);
      if ((data?.length || 0) === 0) setInfo("ما كايناش قضاة دابا. زيد أول قاضي من الفورم.");
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

  const filtered = useMemo(() => {
    const qq = norm(q);
    if (!qq) return rows;
    return rows.filter((r) => norm(r.full_name).includes(qq));
  }, [rows, q]);

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
    setEdit({ full_name: row.full_name || "", is_active: !!row.is_active });
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ full_name: "", is_active: true });
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const full_name = edit.full_name.trim();
    if (!full_name) return setError("اسم القاضي ضروري.");

    try {
      setSaving(true);
      const res = await api.patch(`/admin/judges/${id}`, {
        full_name,
        is_active: !!edit.is_active,
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
      const res = await api.patch(`/admin/judges/${row.id}`, {
        full_name: row.full_name,
        is_active: !row.is_active,
      });

      setInfo(res.data?.message || "تم التحديث.");
      await fetchJudges();
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

      <div className="grid2" style={{ alignItems: "start" }}>
        {/* Add */}
        <div className="card">
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

        {/* List */}
        <div className="card">
          <div className="listTop">
            <div>
              <h3 className="cardTitle">لائحة القضاة</h3>
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
                              value={edit.full_name}
                              onChange={(e) => setEdit((p) => ({ ...p, full_name: e.target.value }))}
                              disabled={saving}
                            />
                          ) : (
                            <div className="nameCell">{r.full_name}</div>
                          )}
                        </td>

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
                            <span className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}>
                              {r.is_active ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="rowActions">
                            {isEditing ? (
                              <>
                                <button
                                  className="btn btnPrimary btn--sm"
                                  type="button"
                                  disabled={saving}
                                  onClick={() => saveEdit(r.id)}
                                >
                                  {saving ? "..." : "حفظ"}
                                </button>

                                <button
                                  className="btn btnSecondary btn--sm"
                                  type="button"
                                  disabled={saving}
                                  onClick={cancelEdit}
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btnSecondary btn--sm"
                                  type="button"
                                  disabled={saving}
                                  onClick={() => startEdit(r)}
                                >
                                  تعديل
                                </button>

                                <button
                                  className="btn btnSecondary btn--sm"
                                  type="button"
                                  disabled={saving}
                                  onClick={() => quickToggle(r)}
                                >
                                  {r.is_active ? "تعطيل" : "تفعيل"}
                                </button>

                                <button
                                  className="btn btnDanger btn--sm"
                                  type="button"
                                  disabled={saving}
                                  onClick={() => removeJudge(r.id)}
                                >
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
            ملاحظة: التعطيل كيدير is_active=0 وكيخلي القاضي ما يبانش فـ lookups (إلا active=1).
          </div>
        </div>
      </div>
    </div>
  );
}
