import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAdmin() {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // ⏳ مازال كيتحمّل user (مثلاً بعد refresh)
  if (isLoading) {
    return (
      <div style={{ padding: 20 }}>
        التحقق من الصلاحيات...
      </div>
    );
  }

  // 🔐 ما مسجّلش الدخول
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // 🚫 مسجّل ولكن ماشي admin
  if (user.role !== "admin") {
    return <Navigate to="/search" replace />;
  }

  // ✅ Admin → دخّل للصفحة
  return <Outlet />;
}
