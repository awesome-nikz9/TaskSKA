"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authStore, seedDemoData, type User } from "./store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; needsMfa?: boolean; user?: User; error?: string };
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => ({ ok: false }),
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(() => {
    // Seed demo data on first load
    seedDemoData();
    const u = authStore.getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((email: string, password: string) => {
    const result = authStore.login(email, password);
    if (result.ok && !result.needsMfa) {
      setUser(authStore.getCurrentUser());
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authStore.logout();
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
