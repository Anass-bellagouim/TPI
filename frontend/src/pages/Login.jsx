import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx"; // ✅ هنا هو الإصلاح

export default function Login() {
  const nav = useNavigate();
  const auth = useContext(AuthContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { user } = await auth.login({ identifier, password });

      const role = String(user?.role || "").toLowerCase();
      const to = role === "admin" ? "/dashboard" : "/search";

      nav(to, { replace: true });
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ||
        (ex?.response?.status === 401 ? "بيانات الدخول غير صحيحة" : "فشل تسجيل الدخول");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authLayout">
        <div className="authVisual">
          <img src="img/Logo.png" alt="محكمة" />
          <div className="authVisualOverlay">
            <h3>المحكمة الابتدائية</h3>
            <p>نظام تسيير الوثائق القضائية</p>
          </div>
        </div>

        <div className="card authCard authCard--login">
          <h2>تسجيل الدخول</h2>

          {err && <div className="alert alertError">{err}</div>}

          <form onSubmit={submit} className="form">
            <div className="field">
              <div className="label">اسم المستخدم أو البريد الإلكتروني</div>
              <input
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <div className="label">كلمة المرور</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button className="btn btnPrimary" type="submit" disabled={loading || auth?.isLoading}>
              {loading || auth?.isLoading ? "..." : "دخول"}
            </button>

            <div className="help authLinks">
              <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
