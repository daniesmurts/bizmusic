import { 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  FileCheck,
  Music,
  Download
} from "lucide-react";
import { getLicenseByIdAction } from "@/lib/actions/licenses";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Верификация Лицензии - Бизнес Музыка",
  description: "Официальная проверка подлинности музыкальной лицензии.",
};

interface PageProps {
  params: Promise<{
    licenseId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerificationPage({ params }: PageProps) {
  const { licenseId } = await params;
  const result = await getLicenseByIdAction(licenseId);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-xl border border-red-100 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-balance">
            Лицензия не найдена
          </h1>
          <p className="text-slate-500">
            Данный QR-код недействителен или срок действия лицензии истёк.
          </p>
          <Button className="w-full bg-slate-900 text-white rounded-xl h-12 font-bold" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    );
  }

  const license = result.data;
  const isExpired = new Date(license.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center rotate-3">
             <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-slate-900">
            Бизнес <span className="text-emerald-600">Музыка</span>
          </span>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 overflow-hidden border border-emerald-50">
          <div className={isExpired ? "bg-red-500 p-8 text-center" : "bg-emerald-500 p-8 text-center"}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              {isExpired ? (
                <ShieldAlert className="w-10 h-10 text-white" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-balance leading-tight">
              {isExpired ? "Срок действия истёк" : "Лицензия подтверждена"}
            </h1>
            <p className="text-white/80 font-medium">Официальная цифровая верификация</p>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Лицензиат</p>
                 <div className="flex items-center gap-2">
                   <Building2 className="w-5 h-5 text-slate-300" />
                   <p className="text-lg font-bold text-slate-900 leading-tight">{license.business.legalName}</p>
                 </div>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ИНН Организации</p>
                 <p className="text-lg font-bold text-slate-900">{license.business.inn}</p>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Номер лицензии</p>
                 <div className="flex items-center gap-2">
                   <FileCheck className="w-5 h-5 text-slate-300" />
                   <p className="text-lg font-bold text-slate-900">{license.licenseNumber}</p>
                 </div>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Действительна до</p>
                 <div className="flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-slate-300" />
                   <p className="text-lg font-bold text-slate-900">
                     {new Date(license.expiresAt).toLocaleDateString("ru-RU")}
                   </p>
                 </div>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Этот сертификат подтверждает право пользователя на публичное исполнение музыкальных произведений без выплаты вознаграждений в РАО и ВОИС.
                </p>
              </div>

              <Button className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 rounded-2xl font-bold gap-3 shrink-0" asChild>
                <a href={license.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5" />
                  Скачать PDF
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-center text-[10px] text-slate-400 uppercase font-black tracking-widest">
          © {new Date().getFullYear()} ООО "Бизнес Музыка" • Система верификации лицензий
        </p>
      </div>
    </div>
  );
}
