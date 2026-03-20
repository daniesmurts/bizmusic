"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

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
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
      
      setLoading(false);
      
      if (event === "SIGNED_IN") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        router.refresh();
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
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
