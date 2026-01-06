import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./layout/AppShell.jsx";
import AddDocument from "./pages/AddDocument.jsx";
import SearchDocuments from "./pages/SearchDocuments.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/add" element={<AddDocument />} />
        <Route path="/search" element={<SearchDocuments />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </AppShell>
  );
}
