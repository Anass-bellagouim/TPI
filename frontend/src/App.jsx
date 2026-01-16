import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import AppShell from "./layout/AppShell.jsx";

import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import SearchDocuments from "./pages/SearchDocuments.jsx";
import AddDocument from "./pages/AddDocument.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

import Employees from "./pages/Employees.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import EmployeeDetails from "./pages/EmployeeDetails.jsx";

import DivisionsAdmin from "./pages/DivisionsAdmin.jsx";
import CaseTypesAdmin from "./pages/CaseTypesAdmin.jsx";
import JudgesAdmin from "./pages/JudgesAdmin.jsx";

import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import RequireAdmin from "./auth/RequireAdmin.jsx";

function HomeRedirect() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext) || {};
  const location = useLocation();

  const to = useMemo(() => {
    if (!isAuthenticated) return "/login";
    const role = String(user?.role || "").toLowerCase();
    return role === "admin" ? "/dashboard" : "/search";
  }, [isAuthenticated, user]);

  if (isLoading) return null;

  return <Navigate to={to} replace state={{ from: location.pathname }} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ===== PUBLIC ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ===== APP (AUTH) ===== */}
        <Route element={<AppShell />}>
          {/* أول دخول */}
          <Route
            index
            element={
              <RequireAuth>
                <HomeRedirect />
              </RequireAuth>
            }
          />

          <Route element={<RequireAuth />}>
            {/* USER */}
            <Route path="search" element={<SearchDocuments />} />
            <Route path="add" element={<AddDocument />} />
            <Route path="documents/:id" element={<DocumentDetails />} />
            <Route path="change-password" element={<ChangePassword />} />

            {/* ADMIN */}
            <Route element={<RequireAdmin />}>
              <Route path="dashboard" element={<Dashboard />} />

              <Route path="employees" element={<Employees />} />
              <Route path="employees/add" element={<AddEmployee />} />
              <Route path="employees/:id" element={<EmployeeDetails />} />

              <Route path="divisions" element={<DivisionsAdmin />} />
              <Route path="case-types" element={<CaseTypesAdmin />} />
              <Route path="judges" element={<JudgesAdmin />} />
            </Route>
          </Route>

          {/* fallback داخل AppShell */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <HomeRedirect />
              </RequireAuth>
            }
          />
        </Route>

        {/* fallback عام */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
