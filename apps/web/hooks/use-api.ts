"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";

// Production'da proxy uzerinden (mixed content onleme)
const API_URL = typeof window !== "undefined" && window.location.protocol === "https:"
  ? "/api/proxy"
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

export function useApi<T = unknown>(endpoint: string, options?: { skip?: boolean }) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || options?.skip) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Bir hata olustu");
      }
    } catch {
      setError("Sunucuya baglanilamadi");
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, options?.skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useApiMutation<T = unknown>() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (endpoint: string, body: unknown, method = "POST"): Promise<T | null> => {
      if (!token) return null;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.success) {
          return json.data as T;
        } else {
          setError(json.error || "Islem basarisiz");
          return null;
        }
      } catch {
        setError("Sunucuya baglanilamadi");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { mutate, loading, error };
}
