"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { del, keys } from "idb-keyval";

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function clearAudioCache() {
  try {
    const allKeys = await keys();
    const trackKeys = allKeys.filter((k) => typeof k === "string" && (k as string).startsWith("track-"));
    await Promise.all(trackKeys.map((k) => del(k)));
  } catch {
    // IDB unavailable — ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      setRole(data?.role ?? null);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Only refetch role when user identity changes (not on every token refresh)
        if (currentUser.id !== lastUserIdRef.current) {
          lastUserIdRef.current = currentUser.id;
          fetchRole(currentUser.id);
        }
      } else {
        lastUserIdRef.current = null;
        setRole(null);
      }

      setLoading(false);

      if (event === "SIGNED_IN") {
        try {
          localStorage.removeItem("featured-tracks-played");
        } catch {
          // localStorage unavailable
        }
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        clearAudioCache();
        router.refresh();
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    try {
      // Invalidate the session server-side first (revokes refresh token globally)
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Network failure — fall through to client-side sign-out
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
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
