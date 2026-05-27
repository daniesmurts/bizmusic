"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

/**
 * Two-step password reset — kept on a SINGLE page so the `signIn` object
 * never leaves React memory. Splitting across two routes caused "Signed out"
 * because the pending sign-in attempt (held in the __client cookie) didn't
 * survive the full-page navigation when the proxy cookie-domain wasn't
 * perfectly configured.
 *
 * Step 1: enter email  → signIn.create({ strategy: "reset_password_email_code" })
 * Step 2: enter code + new password → signIn.attemptFirstFactor(...)
 */
export default function ForgotPassword() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  // "email" | "code"
  const [step, setStep] = useState<"email" | "code">("email");

  // Step 1 state
  const [email, setEmail] = useState("");

  // Step 2 state
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* ── Step 1: request reset code ── */
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
    } catch (err) {
      const msg = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      setError(msg ?? "Не удалось отправить письмо. Проверьте email и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify code + set new password ── */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

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
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setDone(true);
        setTimeout(() => { window.location.href = "/dashboard"; }, 2500);
      } else {
        setError("Не удалось сбросить пароль. Попробуйте ещё раз.");
      }
    } catch (err) {
      const msg = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      if (msg?.includes("expired") || msg?.includes("invalid"))
        setError("Код устарел или неверен. Нажмите «Запросить снова» ниже.");
      else
        setError(msg ?? "Ошибка при обновлении пароля.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (done) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-neon/5">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-neon" />
        </div>
        <CardTitle className="text-3xl font-black mb-4 uppercase">Пароль изменён</CardTitle>
        <CardDescription className="text-neutral-400 text-lg mb-8">
          Ваш пароль был успешно обновлён. Перенаправляем в кабинет…
        </CardDescription>
        <Loader2 className="w-8 h-8 animate-spin text-neon mx-auto" />
      </Card>
    );
  }

  /* ── Step 2: code + new password ── */
  if (step === "code") {
    return (
      <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
        <CardHeader className="space-y-4 pt-10 px-8">
          <div className="flex items-center gap-3 text-neon">
            <ShieldCheck className="w-8 h-8" />
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
              Новый <br /><span className="text-neon">пароль</span>
            </CardTitle>
            <CardDescription className="text-neutral-400 font-medium">
              Введите код из письма и установите новый пароль.
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
              <Label htmlFor="code" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Код из письма</Label>
              <Input id="code" type="text" inputMode="numeric" placeholder="123456"
                className="bg-white/5 border-white/10 rounded-2xl py-6 text-center tracking-[0.5em] text-xl font-black focus:border-neon/50 focus:ring-neon/20 transition-all"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Новый пароль</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-2xl py-6 pr-14 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium w-full"
                  value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-2 rounded-xl hover:bg-white/5" disabled={loading}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 px-1">Минимум 8 символов</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Подтвердите пароль</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-2xl py-6 pr-14 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium w-full"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} minLength={8} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neon transition-colors p-2 rounded-xl hover:bg-white/5" disabled={loading}>
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit"
              className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
              disabled={loading || !isLoaded}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Обновить пароль"}
            </Button>

            <p className="text-center text-xs text-neutral-500">
              Нет кода?{" "}
              <button
                type="button"
                className="text-neon hover:underline underline-offset-4 font-black"
                onClick={() => { setStep("email"); setError(null); setCode(""); }}
              >
                Запросить снова
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    );
  }

  /* ── Step 1: email ── */
  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-4 pt-10 px-8">
        <Link href="/login" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors w-fit">
          <ArrowLeft className="w-3 h-3" /> Назад
        </Link>
        <div className="space-y-2">
          <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
            Забыли <br /><span className="text-neon">пароль?</span>
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium">
            Введите ваш email, и мы отправим код для восстановления доступа.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <form onSubmit={handleRequestCode} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Email</Label>
            <Input id="email" type="email" placeholder="name@business.ru"
              className="bg-white/5 border-white/10 rounded-2xl py-6 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
              value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <Button type="submit"
            className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
            disabled={loading || !isLoaded}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Получить код"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
