// src/pages/EmployeeDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

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
    email: "",
  });

  const busy = loading || loadingToggle || loadingReset || loadingDelete;

  const fullName = useMemo(() => {
    const fn = employee?.first_name || "";
    const ln = employee?.last_name || "";
    const built = `${fn} ${ln}`.trim();
    return employee?.full_name || built || employee?.username || "";
  }, [employee]);

  const isAdmin = String(form.role || "").toLowerCase() === "admin";

  // ✅ Confirm modal state (toggle/reset/delete)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "toggle" | "reset" | "delete"

  function clearMsgs() {
    setError("");
    setInfo("");
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmAction(null);
  }

  async function fetchEmployee() {
    clearMsgs();
    try {
      setLoading(true);

      const res = await api.get(`/admin/employees/${id}`);
      const u = res.data?.data || res.data;

      setEmployee(u);
      setForm({
        first_name: u?.first_name || "",
        last_name: u?.last_name || "",
        username: u?.username || "",
        role: u?.role || "user",
        email: u?.email || "",
      });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setEmployee(null);
        setError("الموظف غير موجود (404).");
      } else {
        setError(e?.response?.data?.message || "حدث خطأ أثناء جلب بيانات الموظف.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ✅ إذا تبدّل الدور إلى user، نحيد البريد من state باش ما يبقاش يتصيفط
  useEffect(() => {
    if (!isAdmin && form.email) {
      setForm((p) => ({ ...p, email: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function validateEmail(v) {
    const s = String(v || "").trim();
    if (!s) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
        ...(isAdmin ? { email: form.email?.trim() || "" } : {}),
      };

      if (isAdmin && payload.email && !validateEmail(payload.email)) {
        setError("البريد الإلكتروني غير صالح.");
        return;
      }

      const res = await api.patch(`/admin/employees/${id}`, payload);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo("تم تحديث معلومات الموظف بنجاح.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e?.response?.data?.message || "حدث خطأ أثناء تحديث معلومات الموظف.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Open confirm for actions
  function askToggle() {
    clearMsgs();
    if (!employee) return;
    setConfirmAction("toggle");
    setConfirmOpen(true);
  }

  function askReset() {
    clearMsgs();
    if (!employee) return;
    setConfirmAction("reset");
    setConfirmOpen(true);
  }

  function askDelete() {
    clearMsgs();
    setConfirmAction("delete");
    setConfirmOpen(true);
  }

  async function doToggle() {
    clearMsgs();
    if (!employee) return;

    try {
      setLoadingToggle(true);
      const res = await api.patch(`/admin/employees/${id}/toggle-active`);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo(res.data?.message || "تم تحديث حالة الحساب (وتم سحب الرموز).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeConfirm();
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تغيير حالة الحساب.");
    } finally {
      setLoadingToggle(false);
    }
  }

  async function doResetPasswordDefault() {
    clearMsgs();
    if (!employee) return;

    try {
      setLoadingReset(true);
      const res = await api.patch(`/admin/employees/${id}/password`);
      setInfo(res.data?.message || 'تمت إعادة تعيين كلمة المرور وتم سحب الرموز القديمة بنجاح.');
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeConfirm();
    } catch (e) {
      setError(e?.response?.data?.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور.");
    } finally {
      setLoadingReset(false);
    }
  }

  async function doDelete() {
    clearMsgs();
    try {
      setLoadingDelete(true);
      await api.delete(`/admin/employees/${id}`);
      navigate("/employees", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || "حدث خطأ أثناء حذف الموظف.");
    } finally {
      setLoadingDelete(false);
      closeConfirm();
    }
  }

  const confirmConfig = useMemo(() => {
    const isBusy = loadingToggle || loadingReset || loadingDelete;

    if (confirmAction === "toggle") {
      const isActive = !!employee?.is_active;

      return {
        open: confirmOpen,
        danger: isActive, 
        title: isActive ? "توقيف الحساب" : "تفعيل الحساب",
        message: isActive
          ? "هل أنت متأكد أنك تريد توقيف هذا الحساب؟ لن يتمكن الموظف من تسجيل الدخول وسيتم سحب الجلسات/الرموز."
          : "هل أنت متأكد أنك تريد تفعيل هذا الحساب؟ سيتمكن الموظف من تسجيل الدخول من جديد.",
        confirmText: isActive ? "نعم، أوقف" : "نعم، فعّل",
        cancelText: "إلغاء",
        loading: loadingToggle,
        onConfirm: doToggle,
        onCancel: isBusy ? undefined : closeConfirm,
      };
    }

    if (confirmAction === "reset") {
      return {
        open: confirmOpen,
        danger: true,
        title: 'إعادة تعيين كلمة المرور',
        message:
          'هل أنت متأكد أنك تريد إعادة تعيين كلمة المرور ؟ سيتم إنهاء جميع الجلسات وسحب الرموز.',
        confirmText: 'نعم، أعد التعيين',
        cancelText: "إلغاء",
        loading: loadingReset,
        onConfirm: doResetPasswordDefault,
        onCancel: isBusy ? undefined : closeConfirm,
      };
    }

    if (confirmAction === "delete") {
      return {
        open: confirmOpen,
        danger: true,
        title: "حذف الموظف نهائيًا",
        message: "هل أنت متأكد أنك تريد حذف هذا الموظف؟ هذه العملية نهائية ولا يمكن التراجع عنها.",
        confirmText: "نعم، احذف",
        cancelText: "إلغاء",
        loading: loadingDelete,
        onConfirm: doDelete,
        onCancel: isBusy ? undefined : closeConfirm,
      };
    }

    return {
      open: false,
      danger: true,
      title: "",
      message: "",
      confirmText: "تأكيد",
      cancelText: "إلغاء",
      loading: false,
      onConfirm: () => {},
      onCancel: closeConfirm,
    };
  }, [confirmAction, confirmOpen, employee, loadingToggle, loadingReset, loadingDelete]);

  useEffect(() => {
    fetchEmployee();
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
            رجوع إلى اللائحة
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
            قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </div>
          <Link className="btn btnPrimary" to="/employees">
            رجوع إلى لائحة الموظفين
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
                  <span style={{ fontWeight: 600 }}>✅ مفعّل</span>
                  <div className="help" style={{ marginTop: 6 }}>
                    يمكن للموظف تسجيل الدخول بشكل طبيعي.
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontWeight: 600 }}>⛔ موقوف</span>
                  <div className="help" style={{ marginTop: 6 }}>
                    لا يمكن للموظف تسجيل الدخول حتى يتم تفعيل الحساب.
                  </div>
                </div>
              )}
            </div>

            <div className="rowActions">
              <button
                className={`btn ${employee.is_active ? "btnDanger" : "btnPrimary"}`}
                type="button"
                onClick={askToggle}
                disabled={busy}
                title="إيقاف/تفعيل الحساب (مع سحب الرموز)"
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
                <div className="label">اسم المستخدم</div>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  disabled={busy}
                />
              </div>

              <div className="field">
                <div className="label">الدور</div>
                <select
                  className="select"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  disabled={busy}
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
              </div>

              {isAdmin && (
                <div className="field">
                  <div className="label">البريد الإلكتروني</div>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={busy}
                    autoComplete="off"
                    placeholder="admin@example.com"
                  />
                </div>
              )}
            </div>

            <div className="rowActions" style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" type="submit" disabled={busy}>
                {loading ? "..." : "حفظ التعديلات"}
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                onClick={askReset}
                disabled={busy}
                title='Reset password + revoke tokens'
              >
                {loadingReset ? "..." : 'Reset Password'}
              </button>

              <button
                className="btn btnDanger"
                type="button"
                onClick={askDelete}
                disabled={busy}
                style={{ marginInlineStart: "auto" }}
                title="حذف الموظف"
              >
                {loadingDelete ? "..." : "حذف"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirmConfig.open}
        danger={confirmConfig.danger}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        loading={confirmConfig.loading}
        onCancel={confirmConfig.onCancel || closeConfirm}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
}
