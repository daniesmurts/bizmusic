"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  Landmark,
  MapPin,
  Loader2,
  ShieldCheck,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { LocationInput } from "@/components/LocationInput";
import { getBusinessDetailsAction } from "@/lib/actions/dashboard";
import { submitContractAction, retryLicenseGenerationAction } from "@/lib/actions/licenses";
import { getLegalAcceptanceEventsAction } from "@/lib/actions/legal-acceptance-events";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ExistingLicense {
  id: string;
  pdfUrl: string;
  signingName?: string;
  issuedAt?: string | Date;
  documentStatus?: "GENERATING" | "READY" | "FAILED";
  generationError?: string | null;
}

interface AcceptanceEvent {
  id: string;
  acceptedAt: Date | string;
  source: string;
  termsVersion?: string | null;
}

export default function ContractPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [businessType, setBusinessType] = useState("ip");
  const [category, setCategory] = useState("");
  const [legalName, setLegalName] = useState("");
  const [inn, setInn] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [kpp, setKpp] = useState("");
  const [regAddress, setRegAddress] = useState("");
  
  const [bankName, setBankName] = useState("");
  const [bik, setBik] = useState("");
  const [phone, setPhone] = useState("");
  const [settlementAccount, setSettlementAccount] = useState("");
  const [corrAccount, setCorrAccount] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const [tradePoints, setTradePoints] = useState<string[]>([""]);
  const [signingName, setSigningName] = useState("");

  const [existingLicense, setExistingLicense] = useState<ExistingLicense | null>(null);

  // Lock the form once any license record exists — prevents multi-company abuse
  const isLocked = success || !!existingLicense;

  // Fetch initial business data using React Query for better resilience
  const { data: businessData, isLoading: initialLoading } = useQuery({
    queryKey: ["business-details"],
    queryFn: async () => {
      const result = await getBusinessDetailsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: 1,
    // Poll every 3s while the license document is being generated
    refetchInterval: (query) => {
      const license = query.state.data?.licenses?.[0];
      return license?.documentStatus === "GENERATING" ? 3000 : false;
    },
  });

  const { data: acceptanceEvents } = useQuery({
    queryKey: ["legal-acceptance-events"],
    queryFn: async () => {
      const result = await getLegalAcceptanceEventsAction(20);
      if (!result.success) throw new Error(result.error);
      return result.data as AcceptanceEvent[];
    },
    retry: 1,
  });

  useEffect(() => {
    if (businessData) {
      setLegalName(businessData.legalName || "");
      setInn(businessData.inn || "");
      setOgrn(businessData.ogrn || "");
      setKpp(businessData.kpp || "");
      setRegAddress(businessData.address || "");
      
      // Populate trade points from locations if they exist
      if (businessData.locations && businessData.locations.length > 0) {
        setTradePoints(businessData.locations.map((l: { address: string }) => l.address));
      }

      // Always sync license state so polling picks up GENERATING → READY/FAILED transitions
      if (businessData.licenses && businessData.licenses.length > 0) {
        setExistingLicense(businessData.licenses[0]);
        setSigningName(prev => prev || businessData.licenses[0].signingName || "");
      }

      const licenseReady = businessData.licenses?.[0]?.documentStatus === "READY" || !!businessData.licenses?.[0]?.pdfUrl;
      if (businessData.subscriptionStatus === "ACTIVE" || licenseReady) {
        setSuccess(true);
      }
    }
  }, [businessData]);

  const addTradePoint = () => !isLocked && setTradePoints([...tradePoints, ""]);
  const updateTradePoint = (index: number, val: string) => {
    const newPoints = [...tradePoints];
    newPoints[index] = val;
    setTradePoints(newPoints);
  };
  const removeTradePoint = (index: number) => {
    const newPoints = [...tradePoints];
    newPoints.splice(index, 1);
    setTradePoints(newPoints);
  };

  const handleGenerateLicense = async () => {
    if (!signingName || !legalName || !inn) {
      toast.error("Пожалуйста, заполните основные поля и подпишите договор");
      return;
    }

    setLoading(true);
    try {
      const result = await submitContractAction({
        businessType,
        businessCategory: category,
        legalName,
        inn,
        ogrn,
        kpp,
        regAddress,
        phone,
        contactPerson,
        bankName,
        bik,
        settlementAccount,
        corrAccount,
        tradePoints: tradePoints.filter(p => p.trim() !== ""),
        signingName
      });

      if (result.success) {
        if ("pdfUrl" in result && result.pdfUrl) {
          window.open(result.pdfUrl, "_blank", "noopener,noreferrer");
        }

        setSuccess(true);
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["business-details"] });
        
        toast.success("Лицензия успешно сформирована и подписана!");
      } else {
        toast.error('error' in result ? result.error : "Ошибка при генерации лицензии");
      }
    } catch {
      toast.error("Произошла непредвиденная ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-neon animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 animate-pulse">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none">Юридический <span className="text-neon">Договор</span></h2>
          <p className="max-w-md text-neutral-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">Заполните данные о юридическом лице для формирования лицензионного договора</p>
        </div>
        <div className="flex-shrink-0 self-start sm:self-auto">
          {success ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 rounded-full">
               <ShieldCheck className="w-4 h-4 text-neon" />
               <span className="text-[10px] font-black uppercase tracking-widest text-neon">ДОГОВОР АКТИВЕН</span>
            </div>
          ) : existingLicense?.documentStatus === "READY" || existingLicense?.pdfUrl ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 rounded-full">
               <ShieldCheck className="w-4 h-4 text-neon" />
               <span className="text-[10px] font-black uppercase tracking-widest text-neon">ДОГОВОР АКТИВЕН</span>
            </div>
          ) : existingLicense?.documentStatus === "GENERATING" ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
               <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">ФОРМИРУЕТСЯ...</span>
            </div>
          ) : existingLicense?.documentStatus === "FAILED" ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
               <AlertTriangle className="w-4 h-4 text-red-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-red-400">ОШИБКА ГЕНЕРАЦИИ</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
               <AlertCircle className="w-4 h-4 text-red-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-red-500">НЕ ПОДПИСАНО</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Section */}
      <div className="glass-dark border border-white/10 rounded-[3rem] p-10 space-y-12 shadow-2xl shadow-neon/5">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center border border-neon/20 text-neon shadow-lg shadow-neon/10">
             <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white">Информация о компании</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Тип бизнеса</Label>
              <select 
                value={businessType}
                disabled={isLocked}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon outline-none transition-all appearance-none h-14 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ip">Индивидуальный предприниматель (ИП)</option>
                <option value="ooo">Общество с ограниченной ответственностью (ООО)</option>
                <option value="self">Самозанятый</option>
              </select>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Категория заведения</Label>
              <select 
                value={category}
                disabled={isLocked}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-xl p-4 text-white focus:border-neon outline-none transition-all appearance-none h-14 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Выберите категорию</option>
                <option value="cafe">Кафе / Ресторан</option>
                <option value="retail">Ритейл / Магазин</option>
                <option value="beauty">Салон красоты</option>
                <option value="fitness">Фитнес-центр</option>
                <option value="hotel">Отель / Гостиница</option>
              </select>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">ФИО / Название организации</Label>
              <Input 
                value={legalName}
                disabled={isLocked}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="ООО 'Музыкальный Бизнес'" 
                className="bg-neutral-900/50 border-white/10 rounded-xl p-6 text-white h-14 focus:border-neon/50 disabled:opacity-50" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">ИНН</Label>
                <Input 
                  value={inn}
                  disabled={isLocked}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="10 или 12 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" 
                />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">ОГРН</Label>
                <Input 
                  value={ogrn}
                  disabled={isLocked}
                  onChange={(e) => setOgrn(e.target.value)}
                  placeholder="13-15 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">КПП</Label>
                <Input 
                  value={kpp}
                  disabled={isLocked}
                  onChange={(e) => setKpp(e.target.value)}
                  placeholder="9 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Адрес регистрации</Label>
              <LocationInput value={regAddress} onChange={setRegAddress} placeholder="Юридический адрес" disabled={isLocked} />
            </div>
            
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Контактное лицо</Label>
              <Input 
                value={contactPerson}
                disabled={isLocked}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="ФИО контактного лица" 
                className="bg-neutral-900/50 border-white/10 rounded-xl p-6 text-white h-14 disabled:opacity-50" 
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
               <Landmark className="w-4 h-4 text-neutral-500" />
               <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Банковские реквизиты</h4>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Название банка</Label>
              <Input value={bankName} disabled={isLocked} onChange={(e) => setBankName(e.target.value)} placeholder="Название банка" className="bg-neutral-900/50 border-white/10 rounded-xl p-6 text-white h-14 disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">БИК</Label>
                <Input value={bik} disabled={isLocked} onChange={(e) => setBik(e.target.value)} placeholder="9 цифр" className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Телефон</Label>
                <Input value={phone} disabled={isLocked} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Расчетный счет</Label>
              <Input value={settlementAccount} disabled={isLocked} onChange={(e) => setSettlementAccount(e.target.value)} placeholder="20 цифр" className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Корр. счет</Label>
              <Input value={corrAccount} disabled={isLocked} onChange={(e) => setCorrAccount(e.target.value)} placeholder="20 цифр" className="bg-neutral-900/50 border-white/10 rounded-xl px-4 py-6 text-white h-14 disabled:opacity-50 tabular-nums tracking-[0.05em]" />
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-6">
           <div className="flex flex-col xs:flex-row xs:items-center justify-between border-b border-white/5 pb-4 gap-4">
             <div className="flex items-center gap-3">
               <MapPin className="w-5 h-5 text-neutral-500 flex-shrink-0" />
               <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight">Адреса торговых точек</h4>
             </div>
             <Button onClick={addTradePoint} disabled={isLocked} variant="ghost" className="text-neon hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest gap-2 disabled:opacity-30 self-start xs:self-auto -ml-2 xs:ml-0">
               <Plus className="w-4 h-4" /> Добавить точку
             </Button>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
             {tradePoints.map((point, i) => (
                <div key={i} className="flex gap-4 items-center animate-fade-in">
                   <div className="flex-1">
                     <LocationInput value={point} disabled={isLocked} onChange={(val) => updateTradePoint(i, val)} placeholder={`Адрес точки ${i + 1}`} />
                   </div>
                   {tradePoints.length > 1 && (
                     <Button disabled={isLocked} onClick={() => removeTradePoint(i)} variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl disabled:opacity-30">
                       <Trash2 className="w-5 h-5" />
                     </Button>
                   )}
                </div>
             ))}
           </div>
        </div>

        <div className="pt-12 border-t border-white/5 space-y-8">
           <div className="max-w-md mx-auto space-y-6 text-center">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1 text-center block">Электронная подпись (Введите ФИО)</Label>
                <Input 
                  value={signingName}
                  disabled={isLocked || loading}
                  onChange={(e) => setSigningName(e.target.value)}
                  placeholder={signingName ? "" : "ВАШЕ Ф.И.О."} 
                  className="bg-neutral-900/80 border-2 border-neon/30 focus:border-neon rounded-xl p-6 xs:p-8 text-center text-base xs:text-lg sm:text-2xl font-black italic uppercase tracking-normal sm:tracking-wider text-neon shadow-2xl shadow-neon/10 disabled:opacity-80 disabled:cursor-not-allowed placeholder:text-neon/20" 
                />
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
                  Нажимая кнопку ниже, вы подтверждаете акцепт оферты и <br /> подписываете лицензионный договор в электронной форме (63-ФЗ).
                </p>
              </div>

              <Button 
                onClick={handleGenerateLicense}
                disabled={loading || isLocked}
                className="w-full bg-neon text-black hover:scale-105 transition-all rounded-2xl py-10 font-black uppercase text-sm tracking-widest gap-3 shadow-2xl shadow-neon/30 border-none group disabled:opacity-50 disabled:hover:scale-100 disabled:bg-neutral-800 disabled:text-neutral-500"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isLocked ? (
                  <>
                    <ShieldCheck className="w-6 h-6" /> Договор Подписан
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Сформировать и Подписать
                  </>
                )}
              </Button>
           </div>
        </div>
      </div>

      <section className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter px-2">Ваши <span className="text-neon">Лицензии</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {existingLicense ? (
             <div className={`glass-dark border-2 p-8 rounded-[2rem] space-y-6 group animate-fade-in shadow-2xl ${
               existingLicense.documentStatus === "FAILED"
                 ? "border-red-500/30 bg-red-500/5 shadow-red-500/10"
                 : existingLicense.documentStatus === "GENERATING"
                 ? "border-yellow-500/20 bg-yellow-500/5 shadow-none"
                 : "border-neon/30 bg-neon/5 shadow-neon/10"
             }`}>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    existingLicense.documentStatus === "FAILED"
                      ? "bg-red-500 shadow-red-500/20"
                      : existingLicense.documentStatus === "GENERATING"
                      ? "bg-yellow-500/20"
                      : "bg-neon shadow-neon/20"
                  }`}>
                    {existingLicense.documentStatus === "FAILED" ? (
                      <AlertTriangle className="text-white w-6 h-6" />
                    ) : existingLicense.documentStatus === "GENERATING" ? (
                      <Loader2 className="text-yellow-400 w-6 h-6 animate-spin" />
                    ) : (
                      <CheckCircle2 className="text-black w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    existingLicense.documentStatus === "FAILED"
                      ? "text-red-400"
                      : existingLicense.documentStatus === "GENERATING"
                      ? "text-yellow-400 animate-pulse"
                      : "text-neon animate-pulse"
                  }`}>
                    {existingLicense.documentStatus === "FAILED"
                      ? "Ошибка формирования"
                      : existingLicense.documentStatus === "GENERATING"
                      ? "Формируется..."
                      : "Лицензия активна"}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black uppercase tracking-tight text-white truncate">{legalName || "Ваша Лицензия"}</h4>
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                    Договор подписан: {existingLicense?.issuedAt ? new Date(existingLicense.issuedAt).toLocaleDateString("ru-RU") : new Date().toLocaleDateString("ru-RU")}
                  </p>
                </div>
                {existingLicense.documentStatus === "FAILED" ? (
                  <>
                    <p className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {existingLicense.generationError || "Не удалось сформировать документ"}
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full border border-red-500/30 hover:bg-red-500/10 text-xs font-black uppercase tracking-widest py-6 rounded-xl gap-2 transition-all text-red-400"
                      onClick={async () => {
                        if (!existingLicense.id) return;
                        toast.loading("Повторная генерация...");
                        const res = await retryLicenseGenerationAction(existingLicense.id);
                        toast.dismiss();
                        if (res.success) {
                          toast.success("Документ успешно сформирован!");
                          queryClient.invalidateQueries({ queryKey: ["business-details"] });
                        } else {
                          toast.error(res.error || "Не удалось повторить генерацию");
                        }
                      }}
                    >
                      <RefreshCcw className="w-4 h-4" /> Повторить генерацию
                    </Button>
                  </>
                ) : existingLicense.pdfUrl ? (
                  <Button 
                    asChild
                    variant="ghost" 
                    className="w-full border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest py-6 rounded-xl gap-2 transition-all cursor-pointer"
                  >
                    <a href={existingLicense.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" /> Скачать оригинал (PDF)
                    </a>
                  </Button>
                ) : (
                  <Button 
                    disabled
                    variant="ghost" 
                    className="w-full border border-white/10 text-xs font-black uppercase tracking-widest py-6 rounded-xl gap-2 transition-all opacity-70"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" /> Документы формируются...
                  </Button>
                )}
             </div>
           ) : (
             <div className="glass-dark border border-white/10 p-8 rounded-[2rem] space-y-6 opacity-30 flex flex-col items-center justify-center min-h-[220px]">
                <FileText className="w-12 h-12 text-neutral-700 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Нет активных лицензий</p>
             </div>
           )}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter px-2">Журнал <span className="text-neon">Акцепта</span></h3>
        <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
          {(acceptanceEvents || []).length === 0 ? (
            <p className="text-sm text-neutral-500">Записи акцепта пока отсутствуют.</p>
          ) : (
            <div className="space-y-3">
              {(acceptanceEvents || []).slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-semibold">{new Date(event.acceptedAt).toLocaleString("ru-RU")}</p>
                    <p className="text-xs text-neutral-500">Источник: {event.source}</p>
                  </div>
                  <p className="text-xs text-neutral-400">Версия: {event.termsVersion || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
