import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.jsx";

export default function Login() {
  const nav = useNavigate();
  const auth = useContext(AuthContext);

  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await auth.login(identifier, password);
      nav("/search", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h2>تسجيل الدخول</h2>
        {err && <div className="alert alertError">{err}</div>}

        <form onSubmit={submit} className="form">
          <div className="field">
            <div className="label">Email أو Username</div>
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

          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "..." : "دخول"}
          </button>

          <div className="help">
            <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
