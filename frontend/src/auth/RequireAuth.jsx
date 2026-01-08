import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  const loc = useLocation();

  if (loading) {
    return (
      <div className="card">
        <div className="alert alertInfo">جاري التحقق من تسجيل الدخول...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
