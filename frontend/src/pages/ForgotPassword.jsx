import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState("check"); // check | user | admin
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const handleCheck = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password/check", {
        identifier: identifier.trim(),
      });

      if (!res.data?.exists) {
        setErr("المستخدم غير موجود");
        return;
      }

      if (res.data.role === "user") {
        setStep("user");
        return;
      }

      if (res.data.role === "admin") {
        setEmail(res.data.email || "");
        setStep("admin");
        return;
      }

      setErr("رد غير متوقع من الخادم");
    } catch (e) {
      setErr(e?.response?.data?.message || "حدث خطأ أثناء التحقق");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setMsg("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
    } catch (e) {
      if (e?.response?.status === 403) {
        setErr("هذه الخدمة متاحة للإدارة فقط");
      } else if (e?.response?.status === 429) {
        setErr("يرجى الانتظار قبل إعادة المحاولة");
      } else {
        setErr(e?.response?.data?.message || "فشل إرسال البريد الإلكتروني");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h2>نسيت كلمة المرور</h2>

        {step === "check" && (
          <form onSubmit={handleCheck} className="form">
            <div className="field">
              <div className="label">اسم المستخدم</div>
              <input
                className="input"
                placeholder="مثال: admin"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "..." : "تحقق"}
            </button>
          </form>
        )}

        {step === "user" && (
          <div className="alert alertInfo">
            استرجاع كلمة المرور عبر البريد الإلكتروني غير متاح للموظفين.
            <br />
            يرجى التواصل مع الإدارة لإعادة تعيين كلمة المرور (الافتراضية:{" "}
            <strong>123456</strong>)
          </div>
        )}

        {step === "admin" && (
          <form onSubmit={handleSend} className="form">
            <div className="field">
              <div className="label">بريد الإدارة الإلكتروني</div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "..." : "إرسال الرابط"}
            </button>
          </form>
        )}

        {err && <div className="alert alertError">{err}</div>}
        {msg && <div className="alert alertSuccess">{msg}</div>}

        <div className="help" style={{ marginTop: 10 }}>
          <Link to="/login">الرجوع إلى تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
