import React, { createContext, useEffect, useState } from "react";
import api from "../api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function loadMe() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(identifier, password) {
    const res = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, booting, setUser, loadMe, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
