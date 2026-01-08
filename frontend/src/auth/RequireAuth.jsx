import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAuth() {
  const { user, token, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: 20 }}>جاري التحقق من الجلسة...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
