import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./layout/AppShell.jsx";

import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import AddDocument from "./pages/AddDocument.jsx";
import SearchDocuments from "./pages/SearchDocuments.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";

import Employees from "./pages/Employees.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import EmployeeDetails from "./pages/EmployeeDetails.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import RequireAdmin from "./auth/RequireAdmin.jsx";

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Any logged in user */}
          <Route
            path="/search"
            element={
              <RequireAuth>
                <SearchDocuments />
              </RequireAuth>
            }
          />
          <Route
            path="/add"
            element={
              <RequireAuth>
                <AddDocument />
              </RequireAuth>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <RequireAuth>
                <DocumentDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ChangePassword />
              </RequireAuth>
            }
          />

          {/* Admin only (Always wrap RequireAdmin inside RequireAuth) */}
          <Route
            path="/employees"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <Employees />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/add"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AddEmployee />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <EmployeeDetails />
                </RequireAdmin>
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  );
}
