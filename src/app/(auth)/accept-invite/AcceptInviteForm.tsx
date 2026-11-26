"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction } from "@/lib/actions/auth";

export function AcceptInviteForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await acceptInviteAction({ token, password });
      if (result.success) {
        window.location.href = "/dashboard";
        return;
      }
      setError(result.error);
    } catch {
      setError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.");
    }
    setLoading(false);
  };

  const inputClass =
    "bg-white/5 border-white/10 rounded-2xl py-6 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed break-words">{error}</span>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Пароль</Label>
        <Input id="password" type="password" autoComplete="new-password" minLength={8} required disabled={loading}
          className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-neutral-500 px-1">Минимум 8 символов</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-neutral-500 px-1">Повторите пароль</Label>
        <Input id="confirm" type="password" autoComplete="new-password" minLength={8} required disabled={loading}
          className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <label htmlFor="agreed" className="flex items-start gap-3 text-xs font-bold leading-relaxed text-neutral-400 cursor-pointer">
        <input id="agreed" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-neon" />
        <span>
          Я соглашаюсь с{" "}
          <Link href="/legal/terms" target="_blank" className="text-neon hover:underline">Пользовательским соглашением</Link>{" "}и{" "}
          <Link href="/legal/privacy" target="_blank" className="text-neon hover:underline">Политикой конфиденциальности</Link>
        </span>
      </label>
      <Button type="submit" disabled={loading || !agreed}
        className="w-full bg-neon text-black hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Задать пароль и войти"}
      </Button>
    </form>
  );
}
