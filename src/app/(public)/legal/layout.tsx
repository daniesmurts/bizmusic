"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldCheck, Scale, Cookie, ChevronRight, Home, FileText, UserCheck, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const legalLinks = [
  { name: "Публичная оферта", href: "/legal/public-offer", icon: FileText },
  { name: "Пользовательское соглашение", href: "/legal/terms", icon: Scale },
  { name: "Политика конфиденциальности", href: "/legal/privacy", icon: ShieldCheck },
  { name: "Согласие на обработку ПД", href: "/legal/data-processing", icon: UserCheck },
  { name: "Согласие на рассылку", href: "/legal/advertising-consent", icon: Mail },
  { name: "Использование Cookie", href: "/legal/cookies", icon: Cookie },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neon selection:text-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-[300px_1fr] gap-16">
        {/* Sidebar Navigation */}
        <aside className="space-y-8">
          <div className="space-y-4">
             <Link href="/" className="flex items-center gap-2 text-neutral-500 hover:text-neon transition-colors group">
               <Home className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">На главную</span>
             </Link>
             <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Правовая <br /><span className="text-neon">информация</span></h1>
          </div>

          <nav className="flex flex-col gap-2">
            {legalLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group",
                    isActive 
                      ? "bg-neon/10 border-neon/20 text-neon shadow-[0_0_20px_rgba(92,243,135,0.05)]" 
                      : "border-white/5 text-neutral-400 hover:border-white/10 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={cn("w-5 h-5", isActive ? "text-neon" : "text-neutral-600 group-hover:text-white")} />
                    <span className="text-xs font-black uppercase tracking-widest">{link.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-8 glass-dark border border-white/10 rounded-[2rem] space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Правовой статус</h4>
             <p className="text-xs text-neutral-400 leading-relaxed font-medium">
               Используя сервис, вы соглашаетесь с условиями публичной оферты и политикой обработки персональных данных в соответствии с 152-ФЗ.
             </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-16 lg:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 bg-neon/5 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 prose prose-invert prose-neutral max-w-none 
            prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black
            prose-p:text-neutral-400 prose-p:leading-relaxed prose-p:text-lg
            prose-strong:text-white prose-strong:font-black
            prose-li:text-neutral-400
            prose-hr:border-white/5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
