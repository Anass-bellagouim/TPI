// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, {
  getToken,
  setToken as persistToken,
  clearToken,
} from "../api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchMe = useCallback(async () => {
    const res = await api.get("/auth/me");
    // backend ديالك كيرجع user كـ object مباشرة
    return res.data?.user ?? res.data;
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

  // ✅ On app load: read token + fetch /me
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setAuthError(null);

      const storedToken = getToken();

      // ✅ no token => not logged in
      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // keep token in state
      if (isMounted) setToken(storedToken);

      try {
        const me = await fetchMe();

        if (me?.is_active === false) {
          // account disabled => force logout
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
        const status = err?.response?.status;

        // ✅ فقط إلا كان 401/419 (token خاسر فعلاً) نمسحو
        if (status === 401 || status === 419) {
          clearToken();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }

        if (isMounted) {
          setAuthError(status ? `HTTP_${status}` : "ME_FAILED");
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
      const res = await api.post("/auth/login", {
        identifier: (identifier || "").trim(),
        password, // ما نديروش trim هنا
      });

      const newToken = res.data?.token;
      const loggedUser = res.data?.user;

      if (!newToken || !loggedUser) {
        throw new Error("Invalid login response");
      }

      // ✅ persist token in localStorage
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

  const refreshMe = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 419) {
        clearToken();
        setToken(null);
        setUser(null);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      authError,
      isAuthenticated: !!token && !!user,

      login,
      logout,
      refreshMe,
    }),
    [token, user, isLoading, authError, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
