// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api, { getToken, setToken as persistToken, clearToken } from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);

  // Crucial: loading state so Guards don't redirect during startup
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(async () => {
    try {
      // attempt server logout; even if it fails, we still clear local session
      await api.post("/auth/logout");
    } catch (_) {
      // ignore
    } finally {
      clearToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    // Called only when token exists
    const res = await api.get("/auth/me");
    // Depending on backend shape: either res.data.user or res.data
    const me = res.data?.user ?? res.data;
    return me;
  }, []);

  // Startup: if token exists -> validate it by calling /auth/me
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setAuthError(null);

      const storedToken = getToken();
      if (!storedToken) {
        // no token => not authenticated, but finished loading
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // sync state token with storage
      if (isMounted) setToken(storedToken);

      try {
        const me = await fetchMe();

        // Optional: check is_active in UI too
        if (me?.is_active === false) {
          // account disabled => clear session
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
        // If /me fails with 401, api interceptor already cleared token.
        // Here we just reflect state accordingly.
        if (isMounted) {
          setUser(null);
          setToken(getToken()); // might be null if interceptor cleared it
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

      // Persist token first
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

      // useful if you want manual refresh after profile update
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
