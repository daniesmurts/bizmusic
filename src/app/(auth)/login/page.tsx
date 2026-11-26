"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { loginAction, resendVerificationAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

const NOTICES: Record<string, { tone: "ok" | "error"; text: string }> = {
  verify_link_invalid: { tone: "error", text: "Ссылка подтверждения недействительна или устарела. Войдите, чтобы получить новую." },
  partner: { tone: "ok", text: "Аккаунт партнёра создан. Подтвердите email по ссылке из письма, затем войдите." },
};

// Only same-origin relative paths, to avoid open redirects.
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("notice") ?? (params.get("registered") === "partner" ? "partner" : null);
    if (key && NOTICES[key]) setNotice(NOTICES[key]);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    try {
      const result = await loginAction({ email, password });
      if (result.success) {
        const next = safeNext(new URLSearchParams(window.location.search).get("next"));
        window.location.href = next ?? (result.data.role === "PARTNER" ? "/dashboard/affiliate" : "/dashboard");
        return;
      }
      setError(result.error);
      if (result.code === "EMAIL_NOT_VERIFIED") setNeedsVerification(true);
    } catch {
      setError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendState("sending");
    const result = await resendVerificationAction(email).catch(() => null);
    if (result && !result.success) {
      setError(result.error);
      setResendState("idle");
      return;
    }
    setResendState("sent");
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
          {notice && (
            <div className={`${notice.tone === "ok" ? "bg-neon/10 border-neon/20 text-neon" : "bg-red-500/10 border-red-500/20 text-red-500"} border p-4 rounded-2xl flex items-start gap-3 text-sm font-bold`}>
              {notice.tone === "ok" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <span className="leading-relaxed break-words">{notice.text}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">
                {error}
                {error.startsWith("Неверный email") && (
                  <>
                    {" "}
                    <a href="/forgot-password" className="underline underline-offset-2 hover:text-red-300 transition-colors">
                      Сбросьте пароль
                    </a>
                    , если вы не помните его.
                  </>
                )}
              </span>
            </div>
          )}

          {needsVerification && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-neutral-300 space-y-3">
              {resendState === "sent" ? (
                <p className="text-neon">Письмо отправлено на {email}. Проверьте почту и папку «Спам».</p>
              ) : (
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === "sending"}
                  className="w-full h-11 rounded-xl bg-neon/20 text-neon border border-neon/30 hover:bg-neon/30"
                >
                  {resendState === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить письмо ещё раз"}
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
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
              <Link href="/forgot-password" className="text-xs font-black uppercase tracking-widest text-neon/60 hover:text-neon transition-colors">
                Забыли?
              </Link>
            </div>
            <div className="relative group/pass">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-3 rounded-xl hover:bg-white/5 z-10 touch-manipulation"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Войти в кабинет"}
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
