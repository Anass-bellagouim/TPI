import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [email, setEmail] = useState(params.get("email") || "");
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");

    if (!email.trim()) return setErr("البريد مطلوب.");
    if (!token.trim()) return setErr("Token مطلوب.");
    if (!password) return setErr("كلمة المرور مطلوبة.");
    if (password !== passwordConfirmation) return setErr("تأكيد كلمة المرور غير مطابق.");

    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setMsg(res.data.message || "تم التغيير.");
      setTimeout(() => nav("/login"), 700);
    } catch (ex) {
      setErr(ex?.response?.data?.message || "فشل إعادة التعيين.");
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard" style={{ maxWidth: 520 }}>
        <h2>إعادة تعيين كلمة المرور</h2>
        {msg && <div className="alert alertSuccess">{msg}</div>}
        {err && <div className="alert alertError">{err}</div>}

        <form onSubmit={submit} className="form">
          <div className="field">
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Token</div>
            <input className="input" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">كلمة المرور الجديدة</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">تأكيد كلمة المرور</div>
            <input className="input" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
          </div>

          <button type="submit" className="btn btnPrimary">تغيير</button>
        </form>
      </div>
    </div>
  );
}
