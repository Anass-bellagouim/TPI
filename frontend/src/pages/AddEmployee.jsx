// src/pages/AddEmployee.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";

function sanitizeUsername(raw) {
  if (!raw) return "";
  let v = raw.trim().toLowerCase();
  v = v.replace(/@.*$/, ""); // لو كتب email بالغلط
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

export default function AddEmployee() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    role: "user",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const usernamePreview = useMemo(
    () => sanitizeUsername(form.username),
    [form.username]
  );

  function validate() {
    if (!form.first_name.trim()) return "الاسم (first_name) مطلوب.";
    if (!form.last_name.trim()) return "النسب (last_name) مطلوب.";
    if (!form.username.trim()) return "username مطلوب.";
    if (!sanitizeUsername(form.username.trim()))
      return "username غير صالح. استعمل غير حروف/أرقام/_/-";

    // ✅ password optional: إذا خليه خاوي => backend يقدر يدير default 123456
    if (form.password) {
      if (form.password.length < 6)
        return "كلمة المرور خاصها تكون على الأقل 6 حروف.";
      if (form.password !== form.password_confirmation)
        return "تأكيد كلمة المرور غير مطابق.";
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
      username: sanitizeUsername(form.username),
      role: form.role,
      // ✅ ما كنصيفطوش email نهائياً
      // ✅ password optional
      ...(form.password
        ? {
            password: form.password,
            password_confirmation: form.password_confirmation,
          }
        : {}),
    };

    try {
      setLoading(true);
      await api.post("/admin/employees", payload);

      setMsg("✅ تم إنشاء الموظف بنجاح.");
      setTimeout(() => nav("/employees"), 600);
    } catch (e2) {
      const apiMsg = e2?.response?.data?.message;
      const apiErrors = formatLaravelErrors(e2?.response?.data?.errors);
      setErr(
        apiErrors
          ? `${apiMsg || "فشل إنشاء الموظف."} — ${apiErrors}`
          : apiMsg || "فشل إنشاء الموظف."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>إضافة موظف</h2>
          <p>إنشاء حساب جديد (Admin فقط).</p>
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
        <form onSubmit={submit} className="form">
          <div className="grid2">
            <div className="field">
              <div className="label">الاسم (first_name)</div>
              <input
                className="input"
                value={form.first_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, first_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="field">
              <div className="label">النسب (last_name)</div>
              <input
                className="input"
                value={form.last_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, last_name: e.target.value }))
                }
                required
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
                placeholder="مثال: anass_aitbelagouim"
                required
              />
              <div className="help">
                مسموح غير: حروف/أرقام/_/-{" "}
                {form.username &&
                usernamePreview !== form.username.trim().toLowerCase() ? (
                  <>
                    — سيتم حفظه كـ: <b>{usernamePreview || "(فارغ)"}</b>
                  </>
                ) : null}
              </div>
            </div>

            <div className="field">
              <div className="label">Role</div>
              <select
                className="select"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <div className="help">⚠️ admin عندو صلاحيات كاملة.</div>
            </div>

            <div className="field">
              <div className="label">كلمة المرور (اختياري)</div>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder='إلا خليتيها خاوية → default "123456"'
              />
            </div>

            <div className="field">
              <div className="label">تأكيد كلمة المرور</div>
              <input
                className="input"
                type="password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    password_confirmation: e.target.value,
                  }))
                }
                disabled={!form.password}
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إنشاء"}
            </button>
          </div>

          <div className="help" style={{ marginTop: 10 }}>
            ملاحظة: البريد الإلكتروني محيد نهائياً للموظفين (user). كلمة المرور إذا خلياتها
            فارغة غادي تكون <b>123456</b>.
          </div>
        </form>
      </div>
    </div>
  );
}
