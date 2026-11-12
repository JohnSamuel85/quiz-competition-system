"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, fetchWithAuth } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  guestDemoLogin: (role: "scholar" | "admin") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("biblequiz_token");
    if (savedToken) {
      setToken(savedToken);
      fetchWithAuth("/api/auth/me", { headers: { Authorization: `Bearer ${savedToken}` } })
        .then((userData: User) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("biblequiz_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
    localStorage.setItem("biblequiz_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    const res = await fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
    localStorage.setItem("biblequiz_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const guestDemoLogin = async (role: "scholar" | "admin") => {
    const username = role === "admin" ? "admin" : "scholar";
    const password = role === "admin" ? "AdminPass2026!" : "ScholarPass2026!";
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem("biblequiz_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = await fetchWithAuth("/api/auth/me");
      setUser(userData);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        guestDemoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
