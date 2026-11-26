"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { del, keys } from "idb-keyval";

export interface AuthUser {
  id: string;
  email?: string | null;
}

type AuthContextType = {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function clearAudioCache() {
  try {
    const allKeys = await keys();
    const trackKeys = allKeys.filter(
      (k) => typeof k === "string" && (k as string).startsWith("track-")
    );
    await Promise.all(trackKeys.map((k) => del(k)));
  } catch {
    // IDB unavailable — ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      const data = (await res.json()) as { user: AuthUser | null; role: string | null };
      setUser(data.user);
      setRole(data.role);
    } catch {
      // Offline (PWA): keep whatever we had.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = async () => {
    await clearAudioCache();
    try {
      localStorage.removeItem("featured-tracks-played");
    } catch {
      // ignore
    }
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setUser(null);
    setRole(null);
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
