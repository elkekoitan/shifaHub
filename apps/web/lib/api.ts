// ShifaHub API Client

// Production'da proxy uzerinden, development'ta direkt backend
const API_URL = typeof window !== "undefined" && window.location.protocol === "https:"
  ? "/api/proxy"  // HTTPS frontend -> proxy -> HTTP backend
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API Error: ${res.status}`);
  }

  return data as T;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api<{
      success: boolean;
      data: {
        user: { id: string; email: string; role: string; firstName: string; lastName: string };
        accessToken: string;
        refreshToken: string;
      };
    }>("/api/auth/login", { method: "POST", body: { email, password } }),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api("/api/auth/register", { method: "POST", body: data }),

  me: (token: string) =>
    api<{ success: boolean; data: { id: string; email: string; role: string; firstName: string; lastName: string } }>(
      "/api/auth/me",
      { token },
    ),

  refresh: (refreshToken: string) =>
    api<{ success: boolean; data: { accessToken: string; refreshToken: string } }>("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),
};
