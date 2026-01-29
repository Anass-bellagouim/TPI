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
    return full || user.full_name || user.empname || user.email || "مستخدم";
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
  // ✅ Desktop center nav dropdowns
  // -----------------------------
  const [openGroup, setOpenGroup] = useState("");
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
  // ✅ Desktop user menu
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

  // -----------------------------
  // ✅ MOBILE DRAWER MENU (كلشي فيه)
  // -----------------------------
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerGroup, setDrawerGroup] = useState(""); // docs | employees | admin | account | ""
  const drawerRef = useRef(null);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerGroup("");
  };

  // Fix: navigate first then close after tick
  const goFromDrawer = (to) => {
    nav(to);
    requestAnimationFrame(() => {
      setTimeout(() => closeDrawer(), 30);
    });
  };

  // close drawer on route change (extra safety)
  useEffect(() => {
    if (!drawerOpen) return;
    requestAnimationFrame(() => setTimeout(() => closeDrawer(), 30));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ESC closes drawer too
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeDrawer();
    }
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Prevent scroll when drawer open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

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
              <h1>المحكمة الابتدائية بالعيون</h1>
              <p>نظام إدارة الوثائق وأرشفة الملفات</p>
            </div>
          </div>
          <div>

          
          {/* ✅ Center nav (Desktop only via CSS) */}
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

              {/* لوحة القيادة (زر مستقل) */}
              {isAdmin && (
                <div className="navGroup">
                  <button
                    type="button"
                    className={`navGroupBtn ${isActive("/dashboard", { exact: true }) ? "active" : ""}`}
                    onClick={() => go("/dashboard")}
                  >
                    لوحة القيادة
                  </button>
                </div>
              )}

              {/* الإدارة */}
              {isAdmin && (
                <div className={`navGroup ${openGroup === "admin" ? "isOpen" : ""}`}>
                  <button
                    type="button"
                    className={`navGroupBtn ${
                      isActive("/divisions") || isActive("/case-types") || isActive("/judges") ? "active" : ""
                    }`}
                    onClick={() => setOpenGroup((v) => (v === "admin" ? "" : "admin"))}
                    aria-haspopup="menu"
                    aria-expanded={openGroup === "admin" ? "true" : "false"}
                  >
                    الإدارة <Caret open={openGroup === "admin"} />
                  </button>

                  {openGroup === "admin" && (
                    <div className="navDrop" role="menu">
                      <button className={`navDropItem ${isActive("/divisions") ? "active" : ""}`} type="button" onClick={() => go("/divisions")}>
                        إدارة الشعب
                      </button>

                      <button className={`navDropItem ${isActive("/case-types") ? "active" : ""}`} type="button" onClick={() => go("/case-types")}>
                        إدارة القضايا
                      </button>

                      <button className={`navDropItem ${isActive("/judges") ? "active" : ""}`} type="button" onClick={() => go("/judges")}>
                        إدارة القضاة
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}
        </div>

          {/* ✅ Left: Desktop user menu (hidden on mobile via CSS) */}
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

          {/* ✅ Burger (mobile only via CSS) */}
          {user && (
            <button
              type="button"
              className={"burgerBtn" + (drawerOpen ? " isOpen" : "")}
              aria-label="فتح القائمة"
              aria-expanded={drawerOpen ? "true" : "false"}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              <span className="burgerIcon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ✅ Overlay (mobile drawer) */}
      <div className={"navOverlay" + (drawerOpen ? " isOpen" : "")} onClick={closeDrawer} />

      {/* ✅ Drawer */}
      <aside
        className={"navDrawer" + (drawerOpen ? " isOpen" : "")}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="القائمة"
      >
        <div className="navDrawer__head">
          <div className="drawerUser">
            <div className="drawerUser__avatar">{String(displayName || "U").slice(0, 1)}</div>
            <div className="drawerUser__meta">
              <div className="drawerUser__name">{displayName}</div>
              <div className="drawerUser__role">{user?.role || "—"}</div>
            </div>
          </div>

          <button className="drawerClose" type="button" onClick={closeDrawer} aria-label="إغلاق">
            ✕
          </button>
        </div>

        <div className="navDrawer__body">
          {/* Account group: profile/settings/change-pass/logout */}
          <div className="drawerGroup">
            <button
              type="button"
              className="drawerGroupBtn"
              onClick={() => setDrawerGroup((v) => (v === "account" ? "" : "account"))}
              aria-expanded={drawerGroup === "account" ? "true" : "false"}
            >
              <span>الحساب</span>
              <span className="drawerCaret">{drawerGroup === "account" ? "▴" : "▾"}</span>
            </button>

            {drawerGroup === "account" && (
              <div className="drawerGroupItems">
                <button
                  type="button"
                  className={"drawerItem" + (isActive("/change-password", { exact: true }) ? " active" : "")}
                  onClick={() => goFromDrawer("/change-password")}
                >
                  تغيير كلمة المرور
                </button>

                <button type="button" className="drawerItem danger" onClick={async () => { await onLogout(); closeDrawer(); }}>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>

          <div className="drawerSep" />

          {/* Docs */}
          <div className="drawerGroup">
            <button
              type="button"
              className="drawerGroupBtn"
              onClick={() => setDrawerGroup((v) => (v === "docs" ? "" : "docs"))}
              aria-expanded={drawerGroup === "docs" ? "true" : "false"}
            >
              <span>الوثائق</span>
              <span className="drawerCaret">{drawerGroup === "docs" ? "▴" : "▾"}</span>
            </button>

            {drawerGroup === "docs" && (
              <div className="drawerGroupItems">
                <button type="button" className={"drawerItem" + (isActive("/search", { exact: true }) ? " active" : "")} onClick={() => goFromDrawer("/search")}>
                  البحث عن وثيقة
                </button>

                <button type="button" className={"drawerItem" + (isActive("/add", { exact: true }) ? " active" : "")} onClick={() => goFromDrawer("/add")}>
                  إضافة وثيقة
                </button>
              </div>
            )}
          </div>

          {/* Employees */}
          {isAdmin && (
            <div className="drawerGroup">
              <button
                type="button"
                className="drawerGroupBtn"
                onClick={() => setDrawerGroup((v) => (v === "employees" ? "" : "employees"))}
                aria-expanded={drawerGroup === "employees" ? "true" : "false"}
              >
                <span>الموظفون</span>
                <span className="drawerCaret">{drawerGroup === "employees" ? "▴" : "▾"}</span>
              </button>

              {drawerGroup === "employees" && (
                <div className="drawerGroupItems">
                  <button type="button" className={"drawerItem" + (isActive("/employees", { exact: true }) ? " active" : "")} onClick={() => goFromDrawer("/employees")}>
                    البحث عن موظف
                  </button>

                  <button type="button" className={"drawerItem" + (isActive("/employees/add", { exact: true }) ? " active" : "")} onClick={() => goFromDrawer("/employees/add")}>
                    إضافة موظف
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin */}
          {isAdmin && (
            <div className="drawerGroup">
              <button
                type="button"
                className="drawerGroupBtn"
                onClick={() => setDrawerGroup((v) => (v === "admin" ? "" : "admin"))}
                aria-expanded={drawerGroup === "admin" ? "true" : "false"}
              >
                <span>الإدارة</span>
                <span className="drawerCaret">{drawerGroup === "admin" ? "▴" : "▾"}</span>
              </button>

              {drawerGroup === "admin" && (
                <div className="drawerGroupItems">
                  <button type="button" className={"drawerItem" + (isActive("/divisions") ? " active" : "")} onClick={() => goFromDrawer("/divisions")}>
                    إدارة الشعب
                  </button>

                  <button type="button" className={"drawerItem" + (isActive("/case-types") ? " active" : "")} onClick={() => goFromDrawer("/case-types")}>
                    إدارة القضايا
                  </button>

                  <button type="button" className={"drawerItem" + (isActive("/judges") ? " active" : "")} onClick={() => goFromDrawer("/judges")}>
                    إدارة القضاة
                  </button>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="drawerGroup">
              <button
                type="button"
                className={"drawerGroupBtn" + (isActive("/dashboard", { exact: true }) ? " active" : "")}
                onClick={() => goFromDrawer("/dashboard")}
              >
                <span>لوحة القيادة</span>
              </button>
            </div>
          )}

        </div>
      </aside>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
