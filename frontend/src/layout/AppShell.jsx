import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.jsx";

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

export default function AppShell() {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  const user = auth?.user || null;

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // ✅ Close menu with ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const displayName = useMemo(() => {
    if (!user) return "غير مسجل";
    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.full_name || user.username || user.email || "مستخدم";
  }, [user]);

  async function onLogout() {
    setOpen(false);
    try {
      await auth?.logout?.();
    } finally {
      nav("/login", { replace: true });
    }
  }

  return (
    <div className="shell rtl">
      <header className="navbar">
        <div className="navbar__inner">
          {/* RIGHT: logo + title */}
          <div
            className="brand"
            role="button"
            tabIndex={0}
            onClick={() => nav("/search")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") nav("/search");
            }}
            title="الرجوع إلى البحث"
          >
            <img className="logo" src="/img/Logo.png" alt="وزارة العدل" loading="eager" />
            <div className="brand__titles">
              <h1>المحكمة الابتدائية المغربية</h1>
              <p>نظام إدارة الوثائق</p>
            </div>
          </div>

          {/* LEFT: user dropdown */}
          <div className="userBox" ref={menuRef}>
            <button
              className="userBtn"
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open ? "true" : "false"}
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

            {open && (
              <div className="menu" role="menu">
                {!user && (
                  <button
                    className="menuItem"
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      nav("/login");
                    }}
                  >
                    تسجيل الدخول
                  </button>
                )}

                {!!user && (
                  <>
                    <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/search"))}>
                      بحث عن وثيقة
                    </button>

                    <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/add"))}>
                      إضافة وثيقة
                    </button>

                    {user?.role === "admin" && (
                      <>
                        <div className="menuSep" />
                        <div className="menuTitle">لوحة الإدارة</div>

                        <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/employees"))}>
                          بحث عن موظف
                        </button>

                        <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/employees/add"))}>
                          إضافة موظف
                        </button>

                        <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/divisions"))}>
                          إدارة الشعب
                        </button>

                        <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/case-types"))}>
                          إدارة القضايا (الرموز)
                        </button>

                        <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/judges"))}>
                          إدارة القضاة
                        </button>
                      </>
                    )}

                    <div className="menuSep" />

                    <button className="menuItem" type="button" onClick={() => (setOpen(false), nav("/change-password"))}>
                      تغيير كلمة المرور
                    </button>

                    <button className="menuItem danger" type="button" onClick={onLogout}>
                      تسجيل الخروج
                    </button>
                  </>
                )}
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
