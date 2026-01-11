import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAuth() {
  const ctx = useContext(AuthContext) || {};
  const { user, isLoading } = ctx;
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: 20 }}>جارٍ التحقق من الجلسة...</div>;
  }

  // ✅ السطر الأهم: الاعتماد فقط على وجود المستخدم (user)
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
