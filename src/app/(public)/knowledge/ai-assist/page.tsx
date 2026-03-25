import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Zap,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Clock,
  HelpCircle,
  Wand2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiAssistKnowledgePage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in relative">
      {/* Decorative Blur */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Back Button */}
      <Link 
        href="/knowledge"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-12 group font-bold text-[10px] uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Вернуться в базу знаний
      </Link>

      {/* Header */}
      <div className="relative mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon/10 border border-neon/20 text-[10px] font-black uppercase tracking-widest text-neon mb-6">
           <Sparkles className="w-3 h-3" /> Новая функция
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
          Улучшение текста <br />
          <span className="text-neon">с помощью ИИ (AI Assist)</span>
        </h1>
        <p className="text-neutral-400 text-lg sm:text-xl font-medium leading-relaxed italic max-w-2xl">
          Функция «Улучшение с ИИ» помогает быстро создавать качественные тексты для голосовых объявлений и анонсов. 
          Вы пишете черновик, а ИИ предлагает более чёткую и убедительную версию.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-20">
        {/* Как это работает */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-neon" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter m-0">Как это работает</h2>
          </div>
          
          <div className="grid gap-6">
            {[
              {
                step: "01",
                title: "Введите текст",
                desc: "Напишите черновик объявления в поле ввода (до 500 символов)."
              },
              {
                step: "02",
                title: "Нажмите «✨ Улучшить с ИИ»",
                desc: "Система отправит ваш текст на обработку современным языковым моделям."
              },
              {
                step: "03",
                title: "Получите предложение",
                desc: "ИИ вернёт отредактированный вариант. Вы можете принять его, доработать вручную или нажать повторно."
              },
              {
                step: "04",
                title: "Синтезируйте речь",
                desc: "Когда текст готов, запустите генерацию аудио. Это спишет токен или бесплатную квоту."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-colors group">
                <span className="text-neon font-black text-2xl opacity-20 group-hover:opacity-100 transition-opacity leading-none">{item.step}</span>
                <div className="space-y-2">
                  <h4 className="text-white font-black uppercase tracking-tight m-0">{item.title}</h4>
                  <p className="text-neutral-400 text-sm font-medium leading-relaxed m-0">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
              <AlertTriangle className="w-16 h-16" />
            </div>
            <div className="flex gap-4 relative z-10">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <p className="m-0 text-amber-200/80 text-sm font-medium leading-relaxed">
                <strong>Важно:</strong> Улучшение с ИИ не создаёт аудио автоматически. Это отдельный этап подготовки текста. После улучшения вы запускаете синтез речи отдельно.
              </p>
            </div>
          </div>
        </section>

        {/* Стоимость и квоты */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-neon" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter m-0">Стоимость и квоты</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { plan: "Контент", limit: "2", status: "Старт" },
              { plan: "Бизнес", limit: "5", status: "Популярный" },
              { plan: "Бизнес+", limit: "10", status: "Максимум" }
            ].map((p, i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center relative overflow-hidden group hover:border-neon/20 transition-all">
                <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-[0.2em] text-neon opacity-40">{p.status}</span>
                <h4 className="mt-0 text-xl font-black uppercase tracking-tighter mb-6">{p.plan}</h4>
                <p className="m-0 text-neon font-black text-4xl tracking-tighter">{p.limit}</p>
                <p className="mt-2 mb-0 text-[10px] font-bold uppercase tracking-widest opacity-40 leading-tight">бесплатных улучшений <br /> в месяц</p>
              </div>
            ))}
          </div>

          <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <Zap className="w-32 h-32" />
            </div>
            <div className="space-y-6 relative z-10">
               <h4 className="m-0 text-white font-black uppercase tracking-tight flex items-center gap-3">
                 <CreditCard className="w-5 h-5 text-neon" /> Платные токены
               </h4>
               <p className="text-neutral-400 font-medium leading-relaxed max-w-2xl text-sm">
                 Если вы использовали все бесплатные улучшения, каждое следующее стоит 1 токен. Токены не сгорают в конце месяца и действуют, пока не будут израсходованы.
               </p>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                   { t: "5", p: "150 ₽" },
                   { t: "10", p: "280 ₽" },
                   { t: "25", p: "625 ₽" },
                   { t: "50", p: "1 150 ₽" }
                 ].map((tok) => (
                   <div key={tok.t} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                     <p className="text-xs font-black text-neon m-0">{tok.t} токенов</p>
                     <p className="text-lg font-black text-white m-0 tracking-tighter">{tok.p}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* Примеры использования */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-neon" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter m-0">Примеры использования</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center font-black text-neon text-xs">1</div>
                <h4 className="m-0 text-sm font-black uppercase tracking-widest text-white">Бизнес-тариф</h4>
              </div>
              <p className="text-sm font-medium text-neutral-400 leading-relaxed italic m-0">
                У вас 5 бесплатных улучшений. Вы сделали 7 улучшений за месяц: 5 пройдут бесплатно (квота обнулится), 2 последних спишутся по 1 токену.
              </p>
            </div>
            <div className="flex flex-col gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center font-black text-neon text-xs">2</div>
                <h4 className="m-0 text-sm font-black uppercase tracking-widest text-white">Бизнес+</h4>
              </div>
              <p className="text-sm font-medium text-neutral-400 leading-relaxed italic m-0">
                В течение месяца вы сделали 20 улучшений: первые 10 — бесплатно (лимит тарифа), следующие 10 — по 1 токену из купленного пакета.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-neon" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter m-0">Часто задаваемые вопросы</h2>
          </div>

          <div className="space-y-12">
            {[
              {
                q: "Нужно ли платить за улучшение, если я не принимаю предложенный текст?",
                a: "Да, списание происходит в момент нажатия кнопки «✨ Улучшить с ИИ», так как система расходует ресурсы нейросети на обработку вашего запроса."
              },
              {
                q: "Можно ли улучшить текст длиннее 500 символов?",
                a: "ИИ обработает текст любой длины, но для последующего синтеза речи он должен укладываться в 500 символов. Мы рекомендуем писать кратко для лучших результатов."
              },
              {
                q: "Почему иногда улучшение занимает несколько секунд?",
                a: "Время обработки зависит от нагрузки на модели (Groq AI) и сложности вашего текста. Обычно это занимает от 1 до 3 секунд."
              },
              {
                q: "Могу ли я использовать улучшенный текст для других целей?",
                a: "Да, вы можете скопировать полученный текст и использовать его в рассылках, социальных сетях или рекламе."
              }
            ].map((faq, i) => (
              <div key={i} className="group">
                <h4 className="text-white font-black text-lg uppercase tracking-tight mb-4 group-hover:text-neon transition-colors duration-300">
                  {faq.q}
                </h4>
                <p className="text-neutral-500 font-medium leading-relaxed text-sm italic m-0">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="pt-20 border-t border-white/10 flex flex-col items-center text-center space-y-8">
           <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5">
              <Info className="w-8 h-8 text-neutral-500" />
           </div>
           <div className="space-y-2">
             <p className="text-neutral-400 font-bold text-sm tracking-tight m-0">
               Остались вопросы по работе AI Assist?
             </p>
             <p className="text-neon font-black text-xl m-0 tracking-tighter">
               daniel@boadtech.com
             </p>
           </div>
           <Button 
             variant="outline" 
             className="border-white/10 hover:border-neon hover:bg-neon hover:text-black transition-all rounded-2xl h-12 px-8 uppercase tracking-[0.2em] text-[10px] font-black"
             asChild
           >
             <Link href="/dashboard/announcements">
                Попробовать в деле
             </Link>
           </Button>
        </div>
      </div>
    </div>
  );
}

// Reuse some icons if not imported
function Settings(props: React.ComponentProps<typeof Info>) {
  return <Info {...props} />
}
