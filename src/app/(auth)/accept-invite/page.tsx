import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInviteEmailAction } from "@/lib/actions/auth";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const email = await getInviteEmailAction(token);

  if (!email) {
    return (
      <Card className="glass-dark border-white/10 text-white p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-14 h-14 text-red-500" />
        </div>
        <CardTitle className="text-2xl font-black mb-4 uppercase">Приглашение недействительно</CardTitle>
        <CardDescription className="text-neutral-400 mb-8">
          Ссылка устарела или уже использована. Попросите владельца бизнеса отправить приглашение заново.
        </CardDescription>
        <Link href="/login" className="text-neon hover:underline underline-offset-4 font-black">Перейти ко входу</Link>
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/10 text-white overflow-hidden animate-fade-in shadow-2xl shadow-neon/5">
      <CardHeader className="space-y-2 pt-10 px-8">
        <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
          Принять <br /><span className="text-neon">приглашение</span>
        </CardTitle>
        <CardDescription className="text-neutral-400 font-medium">
          Задайте пароль для входа как <strong className="text-white">{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pt-4 pb-10">
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  );
}
