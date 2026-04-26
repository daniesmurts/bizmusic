"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { translateAuthError } from "@/utils/auth-errors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      console.error("Login Error Details:", {
        message: loginError.message,
        status: loginError.status,
        name: loginError.name
      });

      setError(translateAuthError(loginError.message));
      setLoading(false);
      return;
    }

    // Route based on role: partners have a completely separate dashboard
    let destination = "/dashboard";
    if (authData.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role === "PARTNER" || authData.user.user_metadata?.is_partner === true) {
        destination = "/dashboard/affiliate";
      }
    }

    // Force a hard navigation so cookies are correctly sent to the Next.js server components
    window.location.href = destination;
  };

  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-4 pt-10 px-8">
        <div className="space-y-2">
          <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
            С <br /><span className="text-neon">возвращением</span>
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium">
            Войдите в систему для управления музыкальным оформлением.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@business.ru"
              className="bg-white/5 border-white/10 rounded-2xl py-6 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-neutral-500">Пароль</Label>
              <Link href="/forgot-password" data-id="forgot-password-link" className="text-xs font-black uppercase tracking-widest text-neon/60 hover:text-neon transition-colors font-black">
                Забыли?
              </Link>
            </div>
            <div className="relative group/pass">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 rounded-2xl py-6 pr-14 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-3 rounded-xl hover:bg-white/5 z-10 touch-manipulation"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Войти в кабинет"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="bg-white/5 border-t border-white/5 px-8 py-6 justify-center">
        <p className="text-neutral-400 text-sm font-bold">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-neon hover:underline underline-offset-4 font-black">
            Зарегистрироваться
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
