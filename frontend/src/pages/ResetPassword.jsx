import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api.js";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);
  const email = useMemo(() => params.get("email") || "", [params]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const canSubmit =
    token &&
    email &&
    password.length >= 6 &&
    passwordConfirmation.length >= 6 &&
    password === passwordConfirmation;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!token || !email) {
      setErr("الرابط غير صالح: token أو email ناقص");
      return;
    }

    if (password !== passwordConfirmation) {
      setErr("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setOk("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
      setTimeout(() => nav("/login", { replace: true }), 800);
    } catch (ex) {
      const status = ex?.response?.status;
      const msg =
        ex?.response?.data?.message ||
        (status === 422
          ? "المعطيات غير صحيحة (تأكد من كلمة المرور أو صلاحية الرابط)"
          : status === 403
          ? "هذه العملية متاحة للإدارة فقط"
          : "حدث خطأ أثناء إعادة تعيين كلمة المرور");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h2>إعادة تعيين كلمة المرور</h2>

        <div className="help" style={{ marginBottom: 10, opacity: 0.9 }}>
          <div>
            <strong>البريد الإلكتروني:</strong> {email || "—"}
          </div>
          <div>
            <strong>الرمز (Token):</strong> {token ? `${token.slice(0, 12)}...` : "—"}
          </div>
        </div>

        {err && <div className="alert alertError">{err}</div>}
        {ok && <div className="alert alertSuccess">{ok}</div>}

        <form onSubmit={submit} className="form">
          <div className="field">
            <div className="label">كلمة المرور الجديدة</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div className="field">
            <div className="label">تأكيد كلمة المرور</div>
            <input
              className="input"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button className="btn btnPrimary" type="submit" disabled={!canSubmit || loading}>
            {loading ? "..." : "تأكيد"}
          </button>

          <div className="help" style={{ marginTop: 10 }}>
            <Link to="/login">الرجوع إلى تسجيل الدخول</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
