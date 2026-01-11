import React, { useContext, useState } from "react";
import api from "../api.js";
import { AuthContext } from "../auth/AuthContext.jsx";

export default function ChangePassword() {
  const { user } = useContext(AuthContext);

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function validate() {
    if (!current) return "كلمة المرور الحالية مطلوبة.";
    if (!password) return "كلمة المرور الجديدة مطلوبة.";
    if (password.length < 6) return "يجب أن تكون كلمة المرور الجديدة على الأقل 6 أحرف.";
    if (password !== confirm) return "تأكيد كلمة المرور غير مطابق.";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const v = validate();
    if (v) return setErr(v);

    try {
      setLoading(true);

      try {
        const res = await api.patch("/auth/change-password", {
          current_password: current,
          password,
          password_confirmation: confirm,
        });
        setMsg(res.data?.message || "✅ تم تغيير كلمة المرور.");
        setCurrent("");
        setPassword("");
        setConfirm("");
        return;
      } catch (e1) {}

      if (!user?.id) throw new Error("user id missing");

      const res2 = await api.patch(`/employees/${user.id}/password`, {
        current_password: current,
        password,
        password_confirmation: confirm,
      });

      setMsg(res2.data?.message || "✅ تم تغيير كلمة المرور.");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "فشل تغيير كلمة المرور.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>تغيير كلمة المرور</h2>
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
        <form onSubmit={submit} className="form" style={{ maxWidth: 520 }}>
          <div className="field">
            <div className="label">كلمة المرور الحالية</div>
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">كلمة المرور الجديدة</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">تأكيد كلمة المرور</div>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>

          <button className="btn btnPrimary" disabled={loading}>
            {loading ? "جاري التغيير..." : "تغيير"}
          </button>
        </form>
      </div>
    </div>
  );
}
