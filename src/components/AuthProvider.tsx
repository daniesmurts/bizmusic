"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { del, keys } from "idb-keyval";

// Slim user shape replacing the Supabase User type — keeps existing call sites working
export interface AuthUser {
  id: string;
  email?: string | null;
}

type AuthContextType = {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
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
  const { userId, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (userId && userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      const clerkRole = clerkUser?.publicMetadata?.role as string | undefined;
      if (clerkRole) {
        setRole(clerkRole);
      } else {
        fetch("/api/user/role")
          .then((r) => r.json())
          .then((d) => setRole(d.role ?? null))
          .catch(() => setRole(null));
      }
    }

    if (!userId) {
      lastUserIdRef.current = null;
      setRole(null);
    }
  }, [userId, isLoaded, clerkUser]);

  const signOut = async () => {
    await clearAudioCache();
    try {
      localStorage.removeItem("featured-tracks-played");
    } catch {
      // ignore
    }
    await clerkSignOut();
    router.push("/");
  };

  const user: AuthUser | null = userId
    ? {
        id: userId,
        email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, role, loading: !isLoaded, signOut }}>
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
