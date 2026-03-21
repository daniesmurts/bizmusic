"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
