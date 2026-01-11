import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAdmin() {
  const ctx = useContext(AuthContext) || {};
  const { user, isLoading } = ctx;
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: 20 }}>جارٍ التحقق من الصلاحيات...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = String(user.role || "").toLowerCase();
  if (role !== "admin") {
    return <Navigate to="/search" replace />;
  }

  return <Outlet />;
}
