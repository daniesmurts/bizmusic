"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-neon/5">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-neon" />
        </div>
        <CardTitle className="text-3xl font-black mb-4 uppercase">Ссылка отправлена</CardTitle>
        <CardDescription className="text-neutral-400 text-lg mb-8">
          Мы отправили инструкции по сбросу пароля на <strong>{email}</strong>. 
          Пожалуйста, проверьте почту.
        </CardDescription>
        <Button 
          asChild
          className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-6 rounded-full transition-all"
        >
          <Link href="/login">Вернуться ко входу</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-4 pt-10 px-8">
        <Link 
          href="/login" 
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors w-fit"
        >
          <ArrowLeft className="w-3 h-3" /> Назад
        </Link>
        <div className="space-y-2">
          <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
            Забыли <br /><span className="text-neon">пароль?</span>
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium">
            Введите ваш email, и мы отправим ссылку для восстановления доступа.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <form onSubmit={handleResetRequest} className="space-y-6">
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

          <Button 
            type="submit" 
            className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Сбросить пароль"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
