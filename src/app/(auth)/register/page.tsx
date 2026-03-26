"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Phone, ShieldCheck, UserCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { translateAuthError } from "@/utils/auth-errors";

export default function Register() {
  const enablePhoneVerification = process.env.NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneUcallerId, setPhoneUcallerId] = useState<number | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<string | null>(null);
  const [phoneInitLoading, setPhoneInitLoading] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [userType, setUserType] = useState<"BUSINESS" | "CREATOR">("BUSINESS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) {
      return `7${digits.slice(1)}`;
    }
    return digits;
  };

  const resetPhoneVerificationState = () => {
    setPhoneVerified(false);
    setPhoneUcallerId(null);
    setPhoneCode("");
    setPhoneVerificationMessage(null);
  };

  const handleStartPhoneVerification = async () => {
    setPhoneVerificationMessage(null);
    const normalized = normalizePhone(phone);
    if (!/^7\d{10}$/.test(normalized)) {
      setPhoneVerificationMessage("Введите номер в формате +7XXXXXXXXXX");
      return;
    }

    setPhoneInitLoading(true);
    try {
      const response = await fetch("/api/auth/phone/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, client: email || undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setPhoneVerificationMessage(result.error || "Не удалось инициализировать звонок");
        return;
      }

      setPhoneUcallerId(result.data.ucallerId);
      setPhoneVerified(false);
      setPhoneVerificationMessage("Мы звоним вам. Введите последние 4 цифры номера входящего звонка.");
    } catch {
      setPhoneVerificationMessage("Ошибка сети при запросе звонка. Попробуйте еще раз.");
    } finally {
      setPhoneInitLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneUcallerId) {
      setPhoneVerificationMessage("Сначала запросите звонок для подтверждения.");
      return;
    }

    if (!/^\d{4}$/.test(phoneCode)) {
      setPhoneVerificationMessage("Введите 4 цифры кода.");
      return;
    }

    setPhoneVerifyLoading(true);
    try {
      const response = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ucallerId: phoneUcallerId, code: phoneCode }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setPhoneVerificationMessage(result.error || "Не удалось проверить код");
        return;
      }

      if (result.data.verified) {
        setPhoneVerified(true);
        setPhoneVerificationMessage("Телефон успешно подтвержден.");
      } else {
        setPhoneVerified(false);
        setPhoneVerificationMessage(result.data.message || "Подтверждение не завершено.");
      }
    } catch {
      setPhoneVerificationMessage("Ошибка сети при проверке кода. Попробуйте еще раз.");
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Пожалуйста, примите условия использования и политику конфиденциальности");
      return;
    }

    if (enablePhoneVerification && !phoneVerified) {
      setError("Подтвердите номер телефона перед регистрацией.");
      return;
    }

    setLoading(true);
    setError(null);

    const signUpMeta: Record<string, unknown> = {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      phone,
      user_type: userType,
    };

    if (enablePhoneVerification && phoneVerified) {
      signUpMeta.phone_verified = true;
      signUpMeta.phone_verified_at = new Date().toISOString();
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: signUpMeta,
      },
    });

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      setLoading(false);
      return;
    }

    // Safety: if project config accidentally auto-confirms email, do not keep user logged in right after signup.
    if (signUpData?.session) {
      await supabase.auth.signOut();
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-neon" />
        </div>
        <CardTitle className="text-3xl font-black mb-4 uppercase">Подтвердите Email</CardTitle>
        <CardDescription className="text-neutral-400 text-lg mb-8">
          Мы отправили ссылку для подтверждения на <strong>{email}</strong>. 
          Пожалуйста, проверьте почту, чтобы активировать аккаунт.
        </CardDescription>
        <Button 
          className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-6 rounded-full"
          onClick={() => router.push("/login")}
        >
          Вернуться ко входу
        </Button>
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-4 pt-10 px-8">
        <div className="space-y-2">
          <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
            Создать <br /><span className="text-neon">аккаунт</span>
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium">
            Начните легально использовать музыку в вашем заведении уже сегодня.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <form onSubmit={handleRegister} className="space-y-6">
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
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Пароль</Label>
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
                minLength={6}
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
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Телефон</Label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 000-00-00"
                className="bg-white/5 border-white/10 rounded-2xl py-6 pl-12 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  resetPhoneVerificationState();
                }}
                required
                disabled={loading}
              />
            </div>
          </div>

          {enablePhoneVerification && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Подтверждение телефона
              </p>
              {phoneVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neon">
                  <ShieldCheck className="w-3.5 h-3.5" /> Подтвержден
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Не подтвержден</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handleStartPhoneVerification}
                disabled={loading || phoneInitLoading || phoneVerifyLoading || !phone}
                className="sm:flex-1 h-11 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
              >
                {phoneInitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Позвонить для кода"}
              </Button>

              <div className="flex gap-2 sm:flex-1">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="4 цифры"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-11 text-center tracking-[0.35em] font-black rounded-xl bg-white/5 border-white/10"
                  disabled={loading || !phoneUcallerId || phoneVerifyLoading}
                />
                <Button
                  type="button"
                  onClick={handleVerifyPhoneCode}
                  disabled={loading || !phoneUcallerId || phoneCode.length !== 4 || phoneVerifyLoading}
                  className="h-11 rounded-xl bg-neon/20 text-neon border border-neon/30 hover:bg-neon/30"
                >
                  {phoneVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Проверить"}
                </Button>
              </div>
            </div>

            {phoneVerificationMessage && (
              <p className={`text-xs font-bold ${phoneVerified ? "text-neon" : "text-neutral-400"}`}>
                {phoneVerificationMessage}
              </p>
            )}
          </div>
          )}
 
          <div className="space-y-2">
            <Label htmlFor="userType" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Кто вы?</Label>
            <div className="relative group">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors pointer-events-none" />
              <select
                id="userType"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon/50 focus:outline-none focus:ring-2 focus:ring-neon/20 transition-all text-lg font-medium appearance-none text-white cursor-pointer"
                value={userType}
                onChange={(e) => setUserType(e.target.value as "BUSINESS" | "CREATOR")}
                disabled={loading}
                required
              >
                <option value="BUSINESS" className="bg-neutral-900 text-white">Бизнес (Кафе, Ресторан, Офис)</option>
                <option value="CREATOR" className="bg-neutral-900 text-white">Создатель контента (YouTube, VK)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox 
              id="terms" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1 border-white/20 data-[state=checked]:bg-neon data-[state=checked]:text-black"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-xs font-bold leading-relaxed text-neutral-400 cursor-pointer select-none"
              >
                Я соглашаюсь с{" "}
                <Link href="/legal/public-offer" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Публичной офертой</Link>,{" "}
                <Link href="/legal/terms" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Пользовательским соглашением</Link>,{" "}
                <Link href="/legal/privacy" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Политикой конфиденциальности</Link>,{" "}
                <Link href="/legal/data-processing" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Согласием на обработку персональных данных</Link>,{" "}
                <Link href="/legal/advertising-consent" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Согласием на рекламную рассылку</Link>
                {" "}и{" "}
                <Link href="/legal/cookies" target="_blank" className="text-neon hover:underline underline-offset-4 font-black">Политикой использования Cookie</Link>
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-neon text-black hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
            disabled={loading || !agreed || (enablePhoneVerification && !phoneVerified)}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Зарегистрироваться"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="bg-white/5 border-t border-white/5 px-8 py-6 justify-center">
        <p className="text-neutral-400 text-sm font-bold">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-neon hover:underline underline-offset-4 font-black">
            Войти
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
