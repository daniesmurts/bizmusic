"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInviteMode = searchParams.get("mode") === "invite";
  const nextPath = searchParams.get("next") || "/dashboard";

  // Verify recovery session exists (set by Supabase via the email link hash fragment)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && !sessionChecked)) {
        setSessionReady(true);
      }
      setSessionChecked(true);
    });

    // Also check if there's already an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setSessionChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, sessionChecked]);

  // Clean up redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    
    redirectTimerRef.current = setTimeout(() => {
      router.push(nextPath);
    }, 3000);
  };

  // Loading state while checking session
  if (!sessionChecked) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-neon/5">
        <Loader2 className="w-8 h-8 animate-spin text-neon mx-auto mb-4" />
        <CardDescription className="text-neutral-400 text-lg">
          Проверяем ссылку...
        </CardDescription>
      </Card>
    );
  }

  // No valid recovery session
  if (!sessionReady) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-neon/5">
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <CardTitle className="text-3xl font-black mb-4 uppercase">Ссылка недействительна</CardTitle>
        <CardDescription className="text-neutral-400 text-lg mb-8">
          {isInviteMode
            ? "Ссылка-приглашение истекла или недействительна. Попросите владельца бизнеса отправить новое приглашение."
            : "Ссылка для сброса пароля истекла или недействительна. Пожалуйста, запросите новую."}
        </CardDescription>
        <Button 
          asChild
          className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-6 rounded-full transition-all"
        >
          <Link href={isInviteMode ? "/login" : "/forgot-password"}>
            {isInviteMode ? "Перейти ко входу" : "Запросить новую ссылку"}
          </Link>
        </Button>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-neon/5">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-neon" />
        </div>
        <CardTitle className="text-3xl font-black mb-4 uppercase">
          {isInviteMode ? "Доступ активирован" : "Пароль изменен"}
        </CardTitle>
        <CardDescription className="text-neutral-400 text-lg mb-8">
          {isInviteMode
            ? "Ваш пароль установлен. Сейчас вы будете перенаправлены в рабочий кабинет филиала..."
            : "Ваш пароль был успешно обновлен. Сейчас вы будете перенаправлены в кабинет..."}
        </CardDescription>
        <Loader2 className="w-8 h-8 animate-spin text-neon mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-4 pt-10 px-8">
        <div className="flex items-center gap-3 text-neon">
          <ShieldCheck className="w-8 h-8" />
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
            {isInviteMode ? (
              <>Активация <br /><span className="text-neon">доступа</span></>
            ) : (
              <>Новый <br /><span className="text-neon">пароль</span></>
            )}
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium">
            {isInviteMode
              ? "Задайте пароль для входа в кабинет менеджера филиала."
              : "Установите безопасный пароль для доступа к вашему аккаунту."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Новый пароль</Label>
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
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-2 rounded-xl hover:bg-white/5"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 px-1">Минимум 8 символов</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Подтвердите пароль</Label>
            <div className="relative group/pass">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 rounded-2xl py-6 pr-14 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-2 rounded-xl hover:bg-white/5"
                disabled={loading}
              >
                {showConfirmPassword ? (
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
              "Обновить пароль"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
