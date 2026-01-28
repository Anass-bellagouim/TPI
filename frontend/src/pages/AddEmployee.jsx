import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";

function sanitizeUsername(raw) {
  if (!raw) return "";
  let v = raw.trim().toLowerCase();
  v = v.replace(/@.*$/, "");
  v = v.replace(/[^a-z0-9_-]/g, "_");
  v = v.replace(/_+/g, "_");
  v = v.replace(/^_+|_+$/g, "");
  return v;
}

function formatLaravelErrors(errorsObj) {
  if (!errorsObj || typeof errorsObj !== "object") return "";
  const lines = [];
  for (const key of Object.keys(errorsObj)) {
    const arr = errorsObj[key];
    if (Array.isArray(arr)) {
      for (const msg of arr) lines.push(`${key}: ${msg}`);
    }
  }
  return lines.join(" | ");
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  empname: "",
  role: "employee",
  email: "",
  password: "",
  password_confirmation: "",
};

export default function AddEmployee() {
  const nav = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [formKey, setFormKey] = useState(1);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const isAdmin = form.role === "admin";

  const usernamePreview = useMemo(() => sanitizeUsername(form.empname), [form.empname]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setErr("");
    setMsg("");
    setFormKey((k) => k + 1);
  }

  useEffect(() => {
    resetForm();
  }, []);

  useEffect(() => {
    if (!isAdmin && form.email) {
      setForm((p) => ({ ...p, email: "" }));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!form.password && form.password_confirmation) {
      setForm((p) => ({ ...p, password_confirmation: "" }));
    }
  }, [form.password]);

  function validate() {
    if (!form.first_name.trim()) return "الاسم مطلوب.";
    if (!form.last_name.trim()) return "النسب مطلوب.";
    if (!form.empname.trim()) return "اسم المستخدم مطلوب.";
    if (!sanitizeUsername(form.empname.trim())) return "اسم المستخدم غير صالح. استعمل فقط حروفًا/أرقامًا/_/-";

    if (isAdmin) {
      if (!form.email.trim()) return "البريد الإلكتروني مطلوب للمسؤول.";
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!ok) return "البريد الإلكتروني غير صالح.";
    }

    if (form.password) {
      if (form.password.length < 6) return "يجب أن تكون كلمة المرور على الأقل 6 أحرف.";
      if (form.password !== form.password_confirmation) return "تأكيد كلمة المرور غير مطابق.";
    }

    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const v = validate();
    if (v) return setErr(v);

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      empname: sanitizeUsername(form.empname),
      role: form.role,
      ...(isAdmin ? { email: form.email.trim() } : {}),
      ...(form.password ? { password: form.password, password_confirmation: form.password_confirmation } : {}),
    };

    try {
      setLoading(true);
      await api.post("/admin/employees", payload);

      setMsg("✅ تم إنشاء الموظف بنجاح.");
      resetForm();
      setTimeout(() => nav("/employees"), 600);
    } catch (e2) {
      const apiMsg = e2?.response?.data?.message;
      const apiErrors = formatLaravelErrors(e2?.response?.data?.errors);
      setErr(apiErrors ? `${apiMsg || "فشل إنشاء الموظف."} — ${apiErrors}` : apiMsg || "فشل إنشاء الموظف.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>إضافة موظف</h2>
        </div>
        <div className="rowActions">
          <Link className="btn btnSecondary" to="/employees">
            رجوع
          </Link>
        </div>
      </div>

      {msg && (
        <div className="alert alertSuccess card" style={{ marginBottom: 14 }}>
          {msg}
        </div>
      )}
      {err && (
        <div className="alert alertError card" style={{ marginBottom: 14 }}>
          <strong>خطأ:</strong> {err}
        </div>
      )}

      <div className="card">
        <form key={formKey} onSubmit={submit} className="form">
          <div className="grid2">
            <div className="field">
              <div className="label">الاسم</div>
              <input
                className="input"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                required
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">النسب</div>
              <input
                className="input"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                required
                disabled={loading}
              />
            </div>

            <div className="field">
              <div className="label">اسم المستخدم</div>
              <input
                className="input"
                value={form.empname}
                onChange={(e) => setForm((p) => ({ ...p, empname: e.target.value }))}
                placeholder="مثال: ahmed"
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="field">
              <div className="label">الدور</div>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                disabled={loading}
              >
                <option value="employee">employee</option>
                <option value="admin">admin</option>
              </select>
            </div>

            {isAdmin && (
              <div className="field">
                <div className="label">Email (للمسؤول فقط)</div>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                  autoComplete="off"
                />
                <div className="help">مطلوب للمسؤول لكي تعمل إعادة تعيين كلمة المرور.</div>
              </div>
            )}

            <div className="field">
              <div className="label">كلمة المرور</div>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder='إذا تركتها فارغة → الافتراضي'
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <div className="label">تأكيد كلمة المرور</div>
              <input
                className="input"
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                disabled={loading || !form.password}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إنشاء"}
            </button>
            <button className="btn btnSecondary" type="button" disabled={loading} onClick={resetForm}>
              مسح
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
