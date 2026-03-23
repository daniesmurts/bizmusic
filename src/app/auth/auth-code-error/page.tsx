import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in shadow-2xl shadow-red-500/5">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-black mb-4 uppercase">Ошибка авторизации</CardTitle>
          <CardContent className="p-0">
            <CardDescription className="text-neutral-400 text-lg mb-8">
              Ссылка недействительна или срок её действия истёк. Пожалуйста, попробуйте снова.
            </CardDescription>
            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="w-full bg-neon text-black hover:scale-105 font-black uppercase py-6 rounded-full transition-all"
              >
                <Link href="/login">Войти</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full text-neutral-400 hover:text-white font-black uppercase py-6 rounded-full"
              >
                <Link href="/forgot-password">Сбросить пароль</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
