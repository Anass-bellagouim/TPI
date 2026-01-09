import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./layout/AppShell.jsx";

import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import SearchDocuments from "./pages/SearchDocuments.jsx";
import AddDocument from "./pages/AddDocument.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

import Employees from "./pages/Employees.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import EmployeeDetails from "./pages/EmployeeDetails.jsx";

// ✅ Admin pages
import DivisionsAdmin from "./pages/DivisionsAdmin.jsx";
import CaseTypesAdmin from "./pages/CaseTypesAdmin.jsx";
import JudgesAdmin from "./pages/JudgesAdmin.jsx";

import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import RequireAdmin from "./auth/RequireAdmin.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ✅ PUBLIC (no AppShell) */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ✅ APP (with AppShell) */}
        <Route element={<AppShell />}>
          {/* Root */}
          <Route path="/" element={<Navigate to="/search" replace />} />

          {/* ✅ Authenticated */}
          <Route element={<RequireAuth />}>
            <Route path="/search" element={<SearchDocuments />} />
            <Route path="/add" element={<AddDocument />} />
            <Route path="/documents/:id" element={<DocumentDetails />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* ✅ Admin only */}
            <Route element={<RequireAdmin />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/add" element={<AddEmployee />} />
              <Route path="/employees/:id" element={<EmployeeDetails />} />

              {/* ✅ Lookups Admin */}
              <Route path="/divisions" element={<DivisionsAdmin />} />
              <Route path="/case-types" element={<CaseTypesAdmin />} />
              <Route path="/judges" element={<JudgesAdmin />} />
            </Route>
          </Route>

          {/* Fallback داخل AppShell */}
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Route>

        {/* Fallback عام: أي مسار خارج AppShell يرجعو للـ /search */}
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </AuthProvider>
  );
}
