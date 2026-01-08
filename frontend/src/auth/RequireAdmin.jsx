import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAdmin({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="card">
        <div className="alert alertInfo">جاري التحقق من الصلاحيات...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin")
    return (
      <div className="card">
        <div className="alert alertError">لا تملك صلاحية الدخول لهذه الصفحة.</div>
      </div>
    );

  return children;
}
