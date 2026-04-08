"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token'i localStorage'dan yukle
  useEffect(() => {
    const savedToken = localStorage.getItem("shifahub_token");
    const savedRefresh = localStorage.getItem("shifahub_refresh");

    if (savedToken) {
      setToken(savedToken);
      authApi
        .me(savedToken)
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // Token gecersiz, refresh dene
          if (savedRefresh) {
            authApi
              .refresh(savedRefresh)
              .then((res) => {
                setToken(res.data.accessToken);
                localStorage.setItem("shifahub_token", res.data.accessToken);
                localStorage.setItem("shifahub_refresh", res.data.refreshToken);
                return authApi.me(res.data.accessToken);
              })
              .then((res) => setUser(res.data))
              .catch(() => {
                logout();
              });
          } else {
            logout();
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.data.user);
    setToken(res.data.accessToken);
    localStorage.setItem("shifahub_token", res.data.accessToken);
    localStorage.setItem("shifahub_refresh", res.data.refreshToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("shifahub_token");
    localStorage.removeItem("shifahub_refresh");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
