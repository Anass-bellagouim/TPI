import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api.js";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    role: "user",
  });

  const [pwd, setPwd] = useState({
    password: "",
    password_confirmation: "",
  });

  const fullName = useMemo(() => {
    const fn = employee?.first_name || "";
    const ln = employee?.last_name || "";
    const built = `${fn} ${ln}`.trim();
    return employee?.full_name || built || employee?.username || "";
  }, [employee]);

  async function fetchEmployee() {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      const res = await api.get(`/employees/${id}`);
      const u = res.data?.data || res.data;

      setEmployee(u);
      setForm({
        first_name: u?.first_name || "",
        last_name: u?.last_name || "",
        username: u?.username || "",
        email: u?.email || "",
        role: u?.role || "user",
      });
    } catch (e) {
      setError(e?.response?.data?.message || "وقع خطأ أثناء جلب بيانات الموظف.");
    } finally {
      setLoading(false);
    }
  }

  async function onUpdate(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      setLoading(true);

      const payload = {
        first_name: form.first_name?.trim() || "",
        last_name: form.last_name?.trim() || "",
        username: form.username?.trim() || "",
        email: form.email?.trim() || "",
        role: form.role || "user",
      };

      const res = await api.patch(`/employees/${id}`, payload);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo("تم تحديث معلومات الموظف بنجاح.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e?.response?.data?.message || "وقع خطأ أثناء تحديث معلومات الموظف."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    setError("");
    setInfo("");

    if (!employee) return;

    const ok = window.confirm(
      employee.is_active
        ? "واش متأكد بغيتي توقف هاد الحساب؟ (غادي مايبقاش يقدر يدخول)"
        : "واش متأكد بغيتي تفعّل هاد الحساب؟"
    );
    if (!ok) return;

    try {
      setLoadingToggle(true);
      const res = await api.patch(`/employees/${id}/toggle-active`);
      const updated = res.data?.data || res.data;

      setEmployee(updated);
      setInfo(res.data?.message || "تم تحديث حالة الحساب.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e?.response?.data?.message || "فشل تغيير حالة الحساب.");
    } finally {
      setLoadingToggle(false);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!pwd.password || pwd.password.length < 6) {
      setError("كلمة المرور خاصها تكون 6 حروف على الأقل.");
      return;
    }
    if (pwd.password !== pwd.password_confirmation) {
      setError("تأكيد كلمة المرور ما مطابقاش.");
      return;
    }

    try {
      setLoadingPwd(true);

      await api.patch(`/employees/${id}/password`, {
        password: pwd.password,
        password_confirmation: pwd.password_confirmation,
      });

      setPwd({ password: "", password_confirmation: "" });
      setInfo("تم تغيير كلمة المرور بنجاح وتم سحب التوكنز القديمة.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e?.response?.data?.message || "وقع خطأ أثناء تغيير كلمة المرور."
      );
    } finally {
      setLoadingPwd(false);
    }
  }

  async function onDelete() {
    setError("");
    setInfo("");

    const ok = window.confirm("واش متأكد بغيتي تحذف هاد الموظف نهائياً؟");
    if (!ok) return;

    try {
      setLoadingDelete(true);
      await api.delete(`/employees/${id}`);
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

  // إذا جا من link فيه #password
  useEffect(() => {
    if (window.location.hash === "#password") {
      setTimeout(() => {
        const el = document.getElementById("password");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, []);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>تعديل موظف</h2>
          <p style={{ marginTop: 6 }}>
            {loading && !employee ? "..." : `الموظف: ${fullName}`}
          </p>
        </div>

        <div className="rowActions">
          <Link className="btn btnSecondary" to="/employees">
            رجوع للائحة
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

      {/* Status Card */}
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
                disabled={loadingToggle}
                title="توقيف/تفعيل الحساب"
              >
                {loadingToggle
                  ? "..."
                  : employee.is_active
                  ? "إيقاف الحساب"
                  : "تفعيل الحساب"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 10, fontWeight: 700 }}>معلومات الموظف</div>

        <form onSubmit={onUpdate}>
          <div className="grid2">
            <div className="field">
              <div className="label">الاسم الشخصي</div>
              <input
                className="input"
                value={form.first_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, first_name: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">الاسم العائلي</div>
              <input
                className="input"
                value={form.last_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, last_name: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">Username</div>
              <input
                className="input"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">Role</div>
              <select
                className="select"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
                disabled={loading}
              >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "حفظ التعديلات"}
            </button>

            <Link className="btn btnSecondary" to={`/employees/${id}#password`}>
              تغيير كلمة المرور
            </Link>

            <button
              className="btn btnDanger"
              type="button"
              onClick={onDelete}
              disabled={loadingDelete || loading}
              style={{ marginInlineStart: "auto" }}
              title="حذف الموظف"
            >
              {loadingDelete ? "..." : "حذف"}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="card" id="password">
        <div style={{ marginBottom: 10, fontWeight: 700 }}>تغيير كلمة المرور</div>

        <form onSubmit={onResetPassword}>
          <div className="grid2">
            <div className="field">
              <div className="label">كلمة المرور الجديدة</div>
              <input
                className="input"
                type="password"
                value={pwd.password}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, password: e.target.value }))
                }
                disabled={loadingPwd}
              />
            </div>

            <div className="field">
              <div className="label">تأكيد كلمة المرور</div>
              <input
                className="input"
                type="password"
                value={pwd.password_confirmation}
                onChange={(e) =>
                  setPwd((p) => ({
                    ...p,
                    password_confirmation: e.target.value,
                  }))
                }
                disabled={loadingPwd}
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loadingPwd}>
              {loadingPwd ? "..." : "تغيير كلمة المرور"}
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loadingPwd}
              onClick={() => setPwd({ password: "", password_confirmation: "" })}
            >
              مسح
            </button>
          </div>

          <div className="help" style={{ marginTop: 10 }}>
            ملاحظة: تغيير كلمة المرور كيسحب التوكنز القديمة باش الموظف يعاود يسجّل الدخول.
          </div>
        </form>
      </div>
    </div>
  );
}
