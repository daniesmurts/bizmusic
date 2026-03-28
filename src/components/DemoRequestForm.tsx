"use client";
 
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Target, 
  MessageSquare 
} from "lucide-react";
import { createDemoRequestAction } from "@/lib/actions/demo-requests";
import { cn } from "@/lib/utils";
 
const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Некорректный email адрес"),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().min(1, "Пожалуйста, выберите сферу интереса"),
  message: z.string().optional(),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: "Необходимо принять условия использования",
  }),
});
 
type FormValues = z.infer<typeof formSchema>;
 
export function DemoRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interest: "General",
      consentAccepted: false as any,
    },
  });
 
  const consentAccepted = watch("consentAccepted");
 
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createDemoRequestAction(data);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Произошла ошибка");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  if (success) {
    return (
      <div className="glass-dark border border-neon/20 rounded-[2.5rem] p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto border border-neon/30">
          <CheckCircle2 className="w-10 h-10 text-neon" />
        </div>
        <h3 className="text-3xl font-black uppercase text-white tracking-tight">Заявка принята!</h3>
        <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
          Спасибо за интерес к Бизнес Музыке. Наш менеджер свяжется с вами в ближайшее время для согласования времени демо.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setSuccess(false)}
          className="border-white/10 text-white rounded-2xl px-8 h-12 font-black uppercase tracking-widest hover:bg-white/5"
        >
          Отправить еще одну
        </Button>
      </div>
    );
  }
 
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Как вас зовут?</Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
            <Input
              {...register("name")}
              placeholder="Иван Иванов"
              className={cn(
                "bg-white/5 border-white/10 rounded-2xl py-6 pl-12 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium",
                errors.name && "border-red-500/50"
              )}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs font-bold ml-1">{errors.name.message}</p>}
        </div>
 
        {/* Email */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Рабочий Email</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
            <Input
              {...register("email")}
              type="email"
              placeholder="ivan@company.ru"
              className={cn(
                "bg-white/5 border-white/10 rounded-2xl py-6 pl-12 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium",
                errors.email && "border-red-500/50"
              )}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs font-bold ml-1">{errors.email.message}</p>}
        </div>
 
        {/* Phone */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Телефон</Label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
            <Input
              {...register("phone")}
              placeholder="+7 (999) 000-00-00"
              className="bg-white/5 border-white/10 rounded-2xl py-6 pl-12 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
            />
          </div>
        </div>
 
        {/* Company */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Компания</Label>
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
            <Input
              {...register("company")}
              placeholder="ООО 'Ромашка'"
              className="bg-white/5 border-white/10 rounded-2xl py-6 pl-12 focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
            />
          </div>
        </div>
      </div>
 
      {/* Interest */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Что вас интересует?</Label>
        <div className="relative group">
          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors pointer-events-none" />
          <select
            {...register("interest")}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon/50 focus:outline-none focus:ring-2 focus:ring-neon/20 transition-all text-lg font-medium appearance-none text-white cursor-pointer"
          >
            <option value="General" className="bg-neutral-900 text-white">Общий обзор платформы</option>
            <option value="Announcements" className="bg-neutral-900 text-white">Голосовые анонсы (AI)</option>
            <option value="Music" className="bg-neutral-900 text-white">Музыкальное вещание и плейлисты</option>
            <option value="Workflow" className="bg-neutral-900 text-white">Интеграция и автоматизация</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
 
      {/* Message */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Ваш комментарий (опционально)</Label>
        <div className="relative group">
          <MessageSquare className="absolute left-4 top-6 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
          <Textarea
            {...register("message")}
            placeholder="Опишите ваши задачи..."
            className="bg-white/5 border-white/10 rounded-[2rem] py-5 pl-12 min-h-[120px] focus:border-neon/50 focus:ring-neon/20 transition-all text-lg font-medium"
          />
        </div>
      </div>
 
      {/* Consent */}
      <div className="flex items-start space-x-3 pt-2">
        <Checkbox 
          id="demo-consent" 
          checked={consentAccepted}
          onCheckedChange={(checked) => setValue("consentAccepted", checked === true)}
          className="mt-1 border-white/20 data-[state=checked]:bg-neon data-[state=checked]:text-black"
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="demo-consent"
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
      {errors.consentAccepted && <p className="text-red-500 text-xs font-bold ml-1">{errors.consentAccepted.message}</p>}
 
      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full bg-neon text-black hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase py-7 text-lg rounded-2xl shadow-lg shadow-neon/20 transition-all"
        disabled={isSubmitting || !consentAccepted}
      >
        {isSubmitting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          "Получить доступ к демо"
        )}
      </Button>
    </form>
  );
}
