import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@shifahub/shared";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (s: { user: SessionUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setHydrated: () => void;
  clear: () => void;
}

/** Client auth state, persisted to localStorage. Server state lives in react-query. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setHydrated: () => set({ hasHydrated: true }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "shifahub-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
