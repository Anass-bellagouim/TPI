import React, { useContext, useMemo, useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.jsx";

export default function AppShell() {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const [open, setOpen] = useState(false);

  // سُدّ المينو ملي كتبدّل الصفحة
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) => `navlink ${isActive ? "navlink--active" : ""}`;

  const displayName = useMemo(() => {
    if (!user) return "غير مسجل";
    return user.full_name || user.username || user.email;
  }, [user]);

  async function onLogout() {
    setOpen(false);
    await auth?.logout?.();
    nav("/login", { replace: true });
  }

  return (
    <div className="shell rtl">
      <header className="navbar">
        <div className="navbar__inner">
          {/* RIGHT: logo + title */}
          <div className="brand" role="button" tabIndex={0} onClick={() => nav("/search")}>
            <div className="brand__badge">م</div>
            <div className="brand__titles">
              <h1>نظام إدارة وثائق المحكمة الابتدائية المغربية</h1>
              <p>رفع الوثائق • استخراج النص • البحث • عرض التفاصيل</p>
            </div>
          </div>

          {/* CENTER: quick links */}
          <nav className="navlinks">
            <NavLink to="/search" className={linkClass}>
              الوثائق
            </NavLink>
            <NavLink to="/add" className={linkClass}>
              إضافة وثيقة
            </NavLink>

            {/* admin only */}
            {user?.role === "admin" && (
              <NavLink to="/employees" className={linkClass}>
                الموظفون
              </NavLink>
            )}
          </nav>

          {/* LEFT: user dropdown */}
          <div className="userBox">
            <button
              className="userBtn"
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open ? "true" : "false"}
            >
              <div className="userAvatar" aria-hidden="true">
                {(displayName?.[0] || "U").toUpperCase()}
              </div>
              <div className="userMeta">
                <div className="userName">{displayName}</div>
                <div className="userRole">{user?.role || "guest"}</div>
              </div>
              <span className="chev" aria-hidden="true">
                ▾
              </span>
            </button>

            {open && (
              <div className="menu" role="menu" onMouseLeave={() => setOpen(false)}>
                <button
                  className="menuItem"
                  onClick={() => {
                    setOpen(false);
                    nav("/search");
                  }}
                >
                  الوثائق (بحث متقدم)
                </button>

                <button
                  className="menuItem"
                  onClick={() => {
                    setOpen(false);
                    nav("/add");
                  }}
                >
                  إضافة وثيقة
                </button>

                {user?.role === "admin" && (
                  <>
                    <div className="menuSep" />
                    <button
                      className="menuItem"
                      onClick={() => {
                        setOpen(false);
                        nav("/employees");
                      }}
                    >
                      الموظفون (بحث + لائحة)
                    </button>
                    <button
                      className="menuItem"
                      onClick={() => {
                        setOpen(false);
                        nav("/employees/add");
                      }}
                    >
                      إضافة موظف
                    </button>
                  </>
                )}

                <div className="menuSep" />

                <button
                  className="menuItem"
                  onClick={() => {
                    setOpen(false);
                    nav("/change-password");
                  }}
                >
                  تغيير كلمة المرور
                </button>

                <button className="menuItem danger" onClick={onLogout}>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ✅ هنا هو المهم: pages غادي يخرجو عبر Outlet */}
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
