// src/pages/EmployeeDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api.js";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    role: "user",
  });

  const busy = loading || loadingToggle || loadingReset || loadingDelete;

  const fullName = useMemo(() => {
    const fn = employee?.first_name || "";
    const ln = employee?.last_name || "";
    const built = `${fn} ${ln}`.trim();
    return employee?.full_name || built || employee?.username || "";
  }, [employee]);

  function clearMsgs() {
    setError("");
    setInfo("");
  }

  async function fetchEmployee() {
    clearMsgs();
    try {
      setLoading(true);

      // ✅ مهم: endpoint الصحيح
      const res = await api.get(`/admin/employees/${id}`);
      const u = res.data?.data || res.data;

      setEmployee(u);
      setForm({
        first_name: u?.first_name || "",
        last_name: u?.last_name || "",
        username: u?.username || "",
        role: u?.role || "user",
      });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setEmployee(null);
        setError("الموظف غير موجود (404).");
      } else {
        setError(e?.response?.data?.message || "وقع خطأ أثناء جلب بيانات الموظف.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onUpdate(e) {
    e.preventDefault();
    clearMsgs();

    try {
      setLoading(true);

      const payload = {
        first_name: form.first_name?.trim() || "",
        last_name: form.last_name?.trim() || "",
        username: form.username?.trim() || "",
        role: form.role || "user",
        // ❌ ما كنصيفطوش email
      };

      const res = await api.patch(`/admin/employees/${id}`, payload);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo("تم تحديث معلومات الموظف بنجاح.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e?.response?.data?.message || "وقع خطأ أثناء تحديث معلومات الموظف.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    clearMsgs();
    if (!employee) return;

    const ok = window.confirm(
      employee.is_active
        ? "واش متأكد بغيتي توقف هاد الحساب؟ (غادي مايبقاش يقدر يدخول)"
        : "واش متأكد بغيتي تفعّل هاد الحساب؟"
    );
    if (!ok) return;

    try {
      setLoadingToggle(true);

      // ✅ endpoint الصحيح
      const res = await api.patch(`/admin/employees/${id}/toggle-active`);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo(res.data?.message || "تم تحديث حالة الحساب (وتم سحب التوكنز).");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تغيير حالة الحساب.");
    } finally {
      setLoadingToggle(false);
    }
  }

  async function resetPasswordDefault() {
    clearMsgs();
    if (!employee) return;

    const ok = window.confirm(
      'واش متأكد بغيتي ترجع كلمة المرور الافتراضية "123456"؟ (غادي يتحيدو جميع sessions ديال الموظف)'
    );
    if (!ok) return;

    try {
      setLoadingReset(true);

      // ✅ endpoint الصحيح
      const res = await api.patch(`/admin/employees/${id}/password`);
      setInfo(
        res.data?.message ||
          'تمت إعادة تعيين كلمة المرور إلى "123456" وتم سحب التوكنز القديمة بنجاح.'
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e?.response?.data?.message || "وقع خطأ أثناء إعادة تعيين كلمة المرور.");
    } finally {
      setLoadingReset(false);
    }
  }

  async function onDelete() {
    clearMsgs();

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد الموظف نهائياً؟");
    if (!ok) return;

    try {
      setLoadingDelete(true);

      // ✅ endpoint الصحيح
      await api.delete(`/admin/employees/${id}`);
      navigate("/employees", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || "وقع خطأ أثناء حذف الموظف.");
    } finally {
      setLoadingDelete(false);
    }
  }

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>تعديل موظف</h2>
          <p style={{ marginTop: 6 }}>
            {loading && !employee ? "..." : employee ? `الموظف: ${fullName}` : "—"}
          </p>
        </div>

        <div className="rowActions">
          <Link className="btn btnSecondary" to="/employees">
            رجوع للائحة
          </Link>

          <button
            className="btn btnSecondary"
            type="button"
            onClick={fetchEmployee}
            disabled={busy}
            title="إعادة تحميل"
          >
            {busy ? "..." : "إعادة تحميل"}
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

      {!employee && !loading && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>الموظف غير موجود</div>
          <div className="help" style={{ marginBottom: 12 }}>
            ممكن يكون تحذف أو الرابط غير صحيح.
          </div>
          <Link className="btn btnPrimary" to="/employees">
            رجوع للائحة الموظفين
          </Link>
        </div>
      )}

      {employee && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="rowActions" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>حالة الحساب</div>

              {employee.is_active ? (
                <div>
                  <span style={{ fontWeight: 600 }}>✅ مفعل</span>
                  <div className="help" style={{ marginTop: 6 }}>
                    الموظف يقدر يدير login عادي.
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontWeight: 600 }}>⛔ موقوف</span>
                  <div className="help" style={{ marginTop: 6 }}>
                    الموظف ما يقدرش يدير login حتى تفعّلو.
                  </div>
                </div>
              )}
            </div>

            <div className="rowActions">
              <button
                className={`btn ${employee.is_active ? "btnDanger" : "btnPrimary"}`}
                type="button"
                onClick={toggleActive}
                disabled={busy}
                title="توقيف/تفعيل الحساب (مع سحب التوكنز)"
              >
                {loadingToggle ? "..." : employee.is_active ? "إيقاف الحساب" : "تفعيل الحساب"}
              </button>
            </div>
          </div>
        </div>
      )}

      {employee && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>معلومات الموظف</div>

          <form onSubmit={onUpdate}>
            <div className="grid2">
              <div className="field">
                <div className="label">الاسم الشخصي</div>
                <input
                  className="input"
                  value={form.first_name}
                  onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                  disabled={busy}
                />
              </div>

              <div className="field">
                <div className="label">الاسم العائلي</div>
                <input
                  className="input"
                  value={form.last_name}
                  onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                  disabled={busy}
                />
              </div>

              <div className="field">
                <div className="label">Username</div>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  disabled={busy}
                />
              </div>

              <div className="field">
                <div className="label">Role</div>
                <select
                  className="select"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  disabled={busy}
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <div className="help" style={{ marginTop: 6 }}>
                  ملاحظة: email محيد نهائياً من الواجهة.
                </div>
              </div>
            </div>

            <div className="rowActions" style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" type="submit" disabled={busy}>
                {loading ? "..." : "حفظ التعديلات"}
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                onClick={resetPasswordDefault}
                disabled={busy}
                title='Reset password to "123456" + revoke tokens'
              >
                {loadingReset ? "..." : "Reset Password (123456)"}
              </button>

              <button
                className="btn btnDanger"
                type="button"
                onClick={onDelete}
                disabled={busy}
                style={{ marginInlineStart: "auto" }}
                title="حذف الموظف"
              >
                {loadingDelete ? "..." : "حذف"}
              </button>
            </div>

            <div className="help" style={{ marginTop: 10 }}>
              ملاحظة: Reset Password كيرجع كلمة المرور لـ <strong>123456</strong> وكيحيد جميع التوكنز.
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
