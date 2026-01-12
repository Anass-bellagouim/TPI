// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api, { getToken, setToken as persistToken, clearToken } from "../api";

export const AuthContext = createContext(null);

/* =========================
   Provider
   ========================= */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchMe = useCallback(async () => {
    const res = await api.get("/auth/me");
    const me = res.data?.user ?? res.data;
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // ignore
    } finally {
      clearToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setAuthError(null);

      const storedToken = getToken();
      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) setToken(storedToken);

      try {
        const me = await fetchMe();

        if (me?.is_active === false) {
          clearToken();
          if (isMounted) {
            setToken(null);
            setUser(null);
            setAuthError("ACCOUNT_DISABLED");
          }
        } else {
          if (isMounted) setUser(me);
        }
      } catch (err) {
        // إذا /auth/me فشلت → خرج المستخدم
        clearToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
          setAuthError(err?.response?.status ? `HTTP_${err.response.status}` : "ME_FAILED");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchMe]);

  const login = useCallback(async ({ identifier, password }) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await api.post("/auth/login", { identifier, password });
      const newToken = res.data?.token;
      const loggedUser = res.data?.user;

      if (!newToken || !loggedUser) {
        throw new Error("Invalid login response");
      }

      persistToken(newToken);
      setToken(newToken);
      setUser(loggedUser);

      return { user: loggedUser, token: newToken };
    } catch (err) {
      setAuthError(err?.response?.status ? `HTTP_${err.response.status}` : "LOGIN_FAILED");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      authError,
      isAuthenticated: !!token && !!user,

      login,
      logout,

      refreshMe: async () => {
        setIsLoading(true);
        setAuthError(null);
        try {
          const me = await fetchMe();
          setUser(me);
          return me;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [token, user, isLoading, authError, login, logout, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* =========================
   Guards (RequireAuth / RequireAdmin)
   ========================= */

export function RequireAuth({ children }) {
  const ctx = useContext(AuthContext) || {};
  const { isLoading, isAuthenticated } = ctx;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 24, textAlign: "center" }}>
        جاري التحميل...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ? children : <Outlet />;
}

export function RequireAdmin({ children }) {
  const ctx = useContext(AuthContext) || {};
  const { user, isLoading, isAuthenticated } = ctx;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 20, textAlign: "center" }}>
        جارٍ التحقق من الصلاحيات...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = String(user?.role || "").toLowerCase();
  if (role !== "admin") {
    return <Navigate to="/search" replace state={{ from: location.pathname }} />;
  }

  return children ? children : <Outlet />;
}
