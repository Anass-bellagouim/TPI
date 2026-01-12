// src/auth/RequireAuth.jsx
import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function RequireAuth({ children }) {
  const ctx = useContext(AuthContext) || {};
  const { isLoading, isAuthenticated } = ctx;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 24, textAlign: "center" }}>
        جاري التحميل...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ? children : <Outlet />;
}
