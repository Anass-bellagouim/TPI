import React from "react";
import { NavLink } from "react-router-dom";

export default function AppShell({ children }) {
  const linkClass = ({ isActive }) =>
    `navlink ${isActive ? "navlink--active" : ""}`;

  return (
    <div className="shell rtl">
      <header className="navbar">
        <div className="navbar__inner">
          <div className="brand">
            <div className="brand__badge">م</div>
            <div className="brand__titles">
              <h1>نظام إدارة وثائق المحكمة الابتدائية المغربية</h1>
              <p>رفع الوثائق • استخراج النص • البحث • عرض التفاصيل</p>
            </div>
          </div>

          <nav className="navlinks">
            <NavLink to="/search" className={linkClass}>
              البحث
            </NavLink>
            <NavLink to="/add" className={linkClass}>
              إضافة وثيقة
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
