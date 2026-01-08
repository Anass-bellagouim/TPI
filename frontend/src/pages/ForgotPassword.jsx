import React, { useState } from "react";
import api from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");

    if (!email.trim()) return setErr("البريد الإلكتروني مطلوب.");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setMsg(res.data.message || "تم الإرسال.");
    } catch (ex) {
      setErr(ex?.response?.data?.message || "فشل الإرسال.");
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h2>نسيت كلمة المرور</h2>
        {msg && <div className="alert alertSuccess">{msg}</div>}
        {err && <div className="alert alertError">{err}</div>}

        <form onSubmit={submit} className="form">
          <div className="field">
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button type="submit" className="btn btnPrimary">إرسال</button>
        </form>
      </div>
    </div>
  );
}
