"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

const INACTIVITY_KEY = "shifahub_last_activity";
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
const INACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

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

function updateLastActivity() {
  localStorage.setItem(INACTIVITY_KEY, Date.now().toString());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const logoutRef = useRef<() => void>(() => {});

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("shifahub_token");
    localStorage.removeItem("shifahub_refresh");
    localStorage.removeItem(INACTIVITY_KEY);
  }, []);

  // Keep logoutRef in sync so the interval callback always has the latest logout
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Token'i localStorage'dan yukle
  useEffect(() => {
    // Check stale activity on initial load
    const lastActivity = localStorage.getItem(INACTIVITY_KEY);
    if (lastActivity && Date.now() - Number(lastActivity) > INACTIVITY_TIMEOUT) {
      logout();
      router.push("/giris");
      setIsLoading(false);
      return;
    }

    const savedToken = localStorage.getItem("shifahub_token");
    const savedRefresh = localStorage.getItem("shifahub_refresh");

    if (savedToken) {
      setToken(savedToken);
      updateLastActivity();
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

  // Inactivity timeout: track user activity and check every 60 seconds
  useEffect(() => {
    if (!user) return;

    // Track user activity
    const handleActivity = () => updateLastActivity();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Set initial activity timestamp
    updateLastActivity();

    // Periodic check for timeout
    const intervalId = setInterval(() => {
      const lastActivity = localStorage.getItem(INACTIVITY_KEY);
      if (lastActivity && Date.now() - Number(lastActivity) > INACTIVITY_TIMEOUT) {
        logoutRef.current();
        router.push("/giris");
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(intervalId);
    };
  }, [user, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.data.user);
    setToken(res.data.accessToken);
    localStorage.setItem("shifahub_token", res.data.accessToken);
    localStorage.setItem("shifahub_refresh", res.data.refreshToken);
    updateLastActivity();
    // Browser push notification izni iste
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
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
