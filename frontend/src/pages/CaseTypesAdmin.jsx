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

export default function CaseTypesAdmin() {
  const nav = useNavigate();
  const qp = useQuery();

  const [divisions, setDivisions] = useState([]);
  const [divisionId, setDivisionId] = useState(qp.get("division_id") || "");

  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  const [form, setForm] = useState({ code: "", name: "", is_active: true, sort_order: 0 });
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ division_id: "", code: "", name: "", is_active: true, sort_order: 0 });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function fetchDivisions() {
    const res = await api.get("/admin/divisions");
    const data = res.data?.data || [];
    setDivisions(Array.isArray(data) ? data : []);
  }

  async function fetchCaseTypes() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const params = {};
      if (divisionId) params.division_id = divisionId;
      if (q.trim()) params.q = q.trim();

      const res = await api.get("/admin/case-types", { params });
      const data = res.data?.data || [];
      setRows(Array.isArray(data) ? data : []);

      if ((data?.length || 0) === 0) setInfo("ما كاين حتى نوع قضية فهاد الشعبة دابا.");
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
    // كلما تبدلات الشعبة نجيب القضايا ديالها
    fetchCaseTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  function onChangeDivision(v) {
    setDivisionId(v);
    setEditingId(null);
    setForm((p) => ({ ...p, code: "", name: "" }));
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
        sort_order: Number(form.sort_order || 0),
      });

      setInfo(res.data?.message || "تمت الإضافة.");
      setForm({ code: "", name: "", is_active: true, sort_order: 0 });
      await fetchCaseTypes();
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
      is_active: !!r.is_active,
      sort_order: r.sort_order ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({ division_id: "", code: "", name: "", is_active: true, sort_order: 0 });
  }

  async function saveEdit(id) {
    setError("");
    setInfo("");

    const code = (edit.code || "").trim();
    const name = (edit.name || "").trim();

    if (!/^\d{4}$/.test(code)) return setError("رمز القضية خاصو يكون 4 أرقام (مثال: 2101).");
    if (!name) return setError("اسم القضية ضروري.");

    try {
      setSaving(true);
      const res = await api.patch(`/admin/case-types/${id}`, {
        division_id: Number(edit.division_id),
        code,
        name,
        is_active: !!edit.is_active,
        sort_order: Number(edit.sort_order || 0),
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

  const divisionName = useMemo(() => {
    const d = divisions.find((x) => String(x.id) === String(divisionId));
    return d?.name || "";
  }, [divisions, divisionId]);

  return (
    <div className="caseAdmin">
      <div className="pageHeader">
        <div>
          <h2>إدارة أنواع القضايا</h2>
          <p>اختار الشعبة ثم زيد القضايا ديالها بالرمز (4 أرقام).</p>
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

          <div className="field">
            <div className="label">بحث داخل القضايا</div>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="2101 أو اسم القضية..." />
            <div className="rowActions" style={{ marginTop: 8 }}>
              <button className="btn btnPrimary" type="button" disabled={loading || saving} onClick={fetchCaseTypes}>
                بحث
              </button>
              <button className="btn btnSecondary" type="button" disabled={loading || saving} onClick={() => { setQ(""); fetchCaseTypes(); }}>
                تصفير
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="cardTitle">إضافة نوع قضية</h3>
        <form onSubmit={onAdd} className="gridAdd">
          <div className="field">
            <div className="label">الرمز (4 أرقام)</div>
            <input className="input" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="مثال: 2101" disabled={saving || !divisionId} />
          </div>
          <div className="field">
            <div className="label">الاسم</div>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="مثال: جنحي عادي تأديبي" disabled={saving || !divisionId} />
          </div>
          <div className="field">
            <div className="label">الترتيب</div>
            <input className="input" type="number" min="0" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} disabled={saving || !divisionId} />
          </div>
          <div className="field">
            <div className="label">الحالة</div>
            <label className="check">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} disabled={saving || !divisionId} />
              <span>Active</span>
            </label>
          </div>
          <div className="rowActions">
            <button className="btn btnPrimary" type="submit" disabled={saving || !divisionId}>
              {saving ? "..." : "إضافة"}
            </button>
          </div>
        </form>
        {!divisionId && <div className="help" style={{ marginTop: 8 }}>اختار الشعبة أولا باش تقدر تزيد القضايا.</div>}
      </div>

      {/* List */}
      <div className="card">
        <h3 className="cardTitle">لائحة القضايا</h3>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>الرمز</th>
                <th>الاسم</th>
                <th style={{ width: 120 }}>الحالة</th>
                <th style={{ width: 90 }}>الترتيب</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>جاري التحميل...</td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>لا توجد بيانات.</td>
                </tr>
              )}

              {!loading && rows.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id}>
                    <td>
                      {isEditing ? (
                        <input className="input input--sm" value={edit.code} onChange={(e) => setEdit((p) => ({ ...p, code: e.target.value }))} disabled={saving} />
                      ) : (
                        <b>{r.code}</b>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className="input input--sm" value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} disabled={saving} />
                      ) : (
                        r.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <label className="check">
                          <input type="checkbox" checked={!!edit.is_active} onChange={(e) => setEdit((p) => ({ ...p, is_active: e.target.checked }))} disabled={saving} />
                          <span>{edit.is_active ? "Active" : "Inactive"}</span>
                        </label>
                      ) : (
                        <span className={`pill ${r.is_active ? "pill--ok" : "pill--bad"}`}>{r.is_active ? "Active" : "Inactive"}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className="input input--sm" type="number" min="0" value={edit.sort_order} onChange={(e) => setEdit((p) => ({ ...p, sort_order: e.target.value }))} disabled={saving} />
                      ) : (
                        r.sort_order ?? 0
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
      </div>
    </div>
  );
}
