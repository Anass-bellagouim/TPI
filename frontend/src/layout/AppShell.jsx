import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

function UserIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.26 4.26 0 0 0 12 12Zm0 2c-4.14 0-7.5 2.2-7.5 4.9A1.1 1.1 0 0 0 5.6 20h12.8a1.1 1.1 0 0 0 1.1-1.1C19.5 16.2 16.14 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Caret({ open }) {
  return (
    <span className={`navCaret ${open ? "isOpen" : ""}`} aria-hidden="true">
      ▾
    </span>
  );
}

export default function AppShell() {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  const user = auth?.user || null;
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const pathname = location.pathname;

  const displayName = useMemo(() => {
    if (!user) return "غير مسجل";
    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.full_name || user.username || user.email || "مستخدم";
  }, [user]);

  const isActive = (path, { exact = false } = {}) => {
    if (!path) return false;
    if (exact) return pathname === path;
    if (pathname === path) return true;
    return pathname.startsWith(path + "/");
  };

  const go = (to) => nav(to);

  async function onLogout() {
    try {
      await auth?.logout?.();
    } finally {
      nav("/login", { replace: true });
    }
  }

  // -----------------------------
  // ✅ Center nav dropdowns (CLICK only)
  // -----------------------------
  const [openGroup, setOpenGroup] = useState(""); // "docs" | "employees" | "admin" | ""
  const centerRef = useRef(null);

  useEffect(() => {
    setOpenGroup("");
  }, [location.pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (!centerRef.current) return;
      if (!centerRef.current.contains(e.target)) setOpenGroup("");
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpenGroup("");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // -----------------------------
  // ✅ User menu (CLICK only ✅)
  // -----------------------------
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => setUserOpen(false), [location.pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (!userOpen) return;
      if (!userRef.current) return;
      if (!userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userOpen]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setUserOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="shell rtl">
      <header className="navbar">
        <div className="navbar__inner navbar__inner--centered">
          {/* ✅ Right: Brand */}
          <div
            className="brand"
            role="button"
            tabIndex={0}
            onClick={() => nav(isAdmin ? "/dashboard" : "/search")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") nav(isAdmin ? "/dashboard" : "/search");
            }}
            title="العودة"
          >
            <img className="logo" src="/img/Logo.png" alt="وزارة العدل" loading="eager" />
            <div className="brand__titles">
              <h1>المحكمة الابتدائية المغربية</h1>
              <p>نظام إدارة الوثائق</p>
            </div>
          </div>

          {/* ✅ Center nav */}
          {user && (
            <nav className="navCenter" ref={centerRef} aria-label="Main navigation">
              {/* الوثائق */}
              <div className={`navGroup ${openGroup === "docs" ? "isOpen" : ""}`}>
                <button
                  type="button"
                  className={`navGroupBtn ${isActive("/search") || isActive("/add") ? "active" : ""}`}
                  onClick={() => setOpenGroup((v) => (v === "docs" ? "" : "docs"))}
                  aria-haspopup="menu"
                  aria-expanded={openGroup === "docs" ? "true" : "false"}
                >
                  الوثائق <Caret open={openGroup === "docs"} />
                </button>

                {openGroup === "docs" && (
                  <div className="navDrop" role="menu">
                    <button
                      className={`navDropItem ${isActive("/search", { exact: true }) ? "active" : ""}`}
                      type="button"
                      onClick={() => go("/search")}
                      role="menuitem"
                    >
                      البحث عن وثيقة
                    </button>

                    <button
                      className={`navDropItem ${isActive("/add", { exact: true }) ? "active" : ""}`}
                      type="button"
                      onClick={() => go("/add")}
                      role="menuitem"
                    >
                      إضافة وثيقة
                    </button>
                  </div>
                )}
              </div>

              {/* الموظفون */}
              {isAdmin && (
                <div className={`navGroup ${openGroup === "employees" ? "isOpen" : ""}`}>
                  <button
                    type="button"
                    className={`navGroupBtn ${isActive("/employees") ? "active" : ""}`}
                    onClick={() => setOpenGroup((v) => (v === "employees" ? "" : "employees"))}
                    aria-haspopup="menu"
                    aria-expanded={openGroup === "employees" ? "true" : "false"}
                  >
                    الموظفون <Caret open={openGroup === "employees"} />
                  </button>

                  {openGroup === "employees" && (
                    <div className="navDrop" role="menu">
                      <button
                        className={`navDropItem ${isActive("/employees", { exact: true }) ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/employees")}
                        role="menuitem"
                      >
                        البحث عن موظف
                      </button>

                      <button
                        className={`navDropItem ${isActive("/employees/add", { exact: true }) ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/employees/add")}
                        role="menuitem"
                      >
                        إضافة موظف
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* لوحة الإدارة */}
              {isAdmin && (
                <div className={`navGroup ${openGroup === "admin" ? "isOpen" : ""}`}>
                  <button
                    type="button"
                    className={`navGroupBtn ${
                      isActive("/dashboard") || isActive("/divisions") || isActive("/case-types") || isActive("/judges")
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setOpenGroup((v) => (v === "admin" ? "" : "admin"))}
                    aria-haspopup="menu"
                    aria-expanded={openGroup === "admin" ? "true" : "false"}
                  >
                    لوحة الإدارة <Caret open={openGroup === "admin"} />
                  </button>

                  {openGroup === "admin" && (
                    <div className="navDrop" role="menu">
                      <button
                        className={`navDropItem ${isActive("/dashboard", { exact: true }) ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/dashboard")}
                        role="menuitem"
                      >
                        لوحة القيادة
                      </button>

                      <div className="navDropSep" />

                      <button
                        className={`navDropItem ${isActive("/divisions") ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/divisions")}
                        role="menuitem"
                      >
                        إدارة الشعب
                      </button>

                      <button
                        className={`navDropItem ${isActive("/case-types") ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/case-types")}
                        role="menuitem"
                      >
                        إدارة القضايا
                      </button>

                      <button
                        className={`navDropItem ${isActive("/judges") ? "active" : ""}`}
                        type="button"
                        onClick={() => go("/judges")}
                        role="menuitem"
                      >
                        إدارة القضاة
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}

          {/* ✅ Left: User menu (CLICK only ✅) */}
          <div className="userBox" ref={userRef}>
            <button
              className="userBtn"
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userOpen ? "true" : "false"}
            >
              <div className="userAvatar" aria-hidden="true">
                <UserIcon className="userAvatar__icon" />
              </div>

              <div className="userMeta">
                <div className="userName">{displayName}</div>
                <div className="userRole">{user ? user.role : "guest"}</div>
              </div>

              <span className="chev" aria-hidden="true">
                ▾
              </span>
            </button>

            {userOpen && user && (
              <div className="menu" role="menu">
                <button
                  className={`menuItem ${isActive("/change-password", { exact: true }) ? "active" : ""}`}
                  type="button"
                  onClick={() => go("/change-password")}
                >
                  تغيير كلمة المرور
                </button>

                <div className="menuSep" />

                <button className="menuItem danger" type="button" onClick={onLogout}>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
