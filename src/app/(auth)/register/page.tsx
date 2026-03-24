"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Phone, UserCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"BUSINESS" | "CREATOR">("BUSINESS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Пожалуйста, примите условия использования и политику конфиденциальности");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          phone,
          user_type: userType,
        }
      },
    });

    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "Пользователь уже зарегистрирован" : signUpError.message);
      setLoading(false);
      return;
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
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-white/5 border-white/10 rounded-2xl py-6 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
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
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
 
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
            disabled={loading || !agreed}
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
