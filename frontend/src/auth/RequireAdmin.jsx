// src/auth/RequireAdmin.jsx
import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx"; // ✅ هنا الإصلاح

export default function RequireAdmin({ children }) {
  const ctx = useContext(AuthContext) || {};
  const { user, isLoading, isAuthenticated } = ctx;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 20, textAlign: "center" }}>
        جارٍ التحقق من الصلاحيات...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = String(user?.role || "").toLowerCase();
  if (role !== "admin") {
    return <Navigate to="/search" replace state={{ from: location.pathname }} />;
  }

  return children ? children : <Outlet />;
}
