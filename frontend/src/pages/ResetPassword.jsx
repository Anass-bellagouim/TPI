// src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api.js";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const token = useMemo(() => (params.get("token") || "").trim(), [params]);
  const email = useMemo(() => (params.get("email") || "").trim(), [params]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const cleanPassword = password; // خليه كيف هو (ما نديروش trim أثناء الكتابة)
  const cleanConfirmation = passwordConfirmation;

  const canSubmit =
    token &&
    email &&
    cleanPassword.length >= 8 &&
    cleanConfirmation.length >= 8 &&
    cleanPassword === cleanConfirmation;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!token || !email) {
      setErr("الرابط غير صالح: token أو email ناقص");
      return;
    }

    // ✅ نحيد غير المسافات فالبداية والنهاية وقت الإرسال
    const p1 = cleanPassword.trim();
    const p2 = cleanConfirmation.trim();

    if (p1.length < 8) {
      setErr("كلمة المرور خاصها تكون 8 أحرف أو أكثر");
      return;
    }

    if (p1 !== p2) {
      setErr("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token.trim(),
        email: email.trim(),
        password: p1,
        password_confirmation: p2,
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
          : status === 429
          ? "يرجى الانتظار قبل إعادة المحاولة"
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
            <strong>Token:</strong> {token ? `${token.slice(0, 12)}...` : "—"}
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
              minLength={8}
              placeholder="8 أحرف على الأقل"
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
              minLength={8}
              placeholder="أعد كتابة كلمة المرور"
            />
          </div>

          <button
            className="btn btnPrimary"
            type="submit"
            disabled={!canSubmit || loading}
          >
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
