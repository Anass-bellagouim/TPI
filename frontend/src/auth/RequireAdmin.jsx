import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAdmin() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div style={{ padding: 20 }}>التحقق من الصلاحيات...</div>;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/search" replace />;
  }

  return <Outlet />;
}
