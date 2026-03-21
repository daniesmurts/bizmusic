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
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { LocationInput } from "@/components/LocationInput";
import { submitContractAction } from "@/lib/actions/licenses";
import { toast } from "sonner";

interface ExistingLicense {
  id: string;
  pdfUrl: string;
  signingName?: string;
  issuedAt?: string;
}

export default function ContractPage() {
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

  const [initialLoading, setInitialLoading] = useState(true);
  const [existingLicense, setExistingLicense] = useState<ExistingLicense | null>(null);

  // Fetch initial business data
  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/user/business');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setLegalName(data.legalName || "");
            setInn(data.inn || "");
            setOgrn(data.ogrn || "");
            setKpp(data.kpp || "");
            setRegAddress(data.address || "");
            if (data.subscriptionStatus === "ACTIVE") {
              setSuccess(true);
              if (data.licenses && data.licenses.length > 0) {
                setExistingLicense(data.licenses[0]);
                setSigningName(data.licenses[0].signingName || "");
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial status:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const addTradePoint = () => !success && setTradePoints([...tradePoints, ""]);
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

      if (result.success && 'data' in result && result.data) {
        // Download PDF
        const blob = await (await fetch(`data:application/pdf;base64,${result.data}`)).blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `License_${legalName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSuccess(true);
        // Refresh status to get the new license record
        const response = await fetch('/api/user/business');
        if (response.ok) {
          const data = await response.json();
          if (data.licenses && data.licenses.length > 0) {
            setExistingLicense(data.licenses[0]);
          }
        }
        
        toast.success("Лицензия успешно сформирована и подписана!");
      } else {
        toast.error('error' in result ? result.error : "Ошибка при генерации лицензии");
      }
    } catch (err) {
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
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Юридический <span className="text-neon">Договор</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Заполните данные о юридическом лице для формирования лицензионного договора</p>
        </div>
        {!success ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
             <AlertCircle className="w-4 h-4 text-red-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-red-500">НЕ ПОДПИСАНО</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 rounded-full">
             <ShieldCheck className="w-4 h-4 text-neon" />
             <span className="text-[10px] font-black uppercase tracking-widest text-neon">ДОГОВОР АКТИВЕН</span>
          </div>
        )}
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
                disabled={success}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-2xl p-4 text-white focus:border-neon outline-none transition-all appearance-none h-14 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={success}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-2xl p-4 text-white focus:border-neon outline-none transition-all appearance-none h-14 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={success}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="ООО 'Музыкальный Бизнес'" 
                className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 focus:border-neon/50 disabled:opacity-50" 
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">ИНН</Label>
                <Input 
                  value={inn}
                  disabled={success}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="10 или 12 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" 
                />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">ОГРН</Label>
                <Input 
                  value={ogrn}
                  disabled={success}
                  onChange={(e) => setOgrn(e.target.value)}
                  placeholder="13 или 15 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" 
                />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">КПП</Label>
                <Input 
                  value={kpp}
                  disabled={success}
                  onChange={(e) => setKpp(e.target.value)}
                  placeholder="9 цифр" 
                  className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Адрес регистрации</Label>
              <LocationInput value={regAddress} onChange={setRegAddress} placeholder="Юридический адрес" disabled={success} />
            </div>
            
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Контактное лицо</Label>
              <Input 
                value={contactPerson}
                disabled={success}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="ФИО контактного лица" 
                className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" 
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
              <Input value={bankName} disabled={success} onChange={(e) => setBankName(e.target.value)} placeholder="Название банка" className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">БИК</Label>
                <Input value={bik} disabled={success} onChange={(e) => setBik(e.target.value)} placeholder="9 цифр" className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Телефон</Label>
                <Input value={phone} disabled={success} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Расчетный счет</Label>
              <Input value={settlementAccount} disabled={success} onChange={(e) => setSettlementAccount(e.target.value)} placeholder="20 цифр" className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Корр. счет</Label>
              <Input value={corrAccount} disabled={success} onChange={(e) => setCorrAccount(e.target.value)} placeholder="20 цифр" className="bg-neutral-900/50 border-white/10 rounded-2xl p-6 text-white h-14 disabled:opacity-50" />
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-6">
           <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <div className="flex items-center gap-3">
               <MapPin className="w-5 h-5 text-neutral-500" />
               <h4 className="text-xl font-black uppercase tracking-tight text-white">Адреса торговых точек</h4>
             </div>
             <Button onClick={addTradePoint} disabled={success} variant="ghost" className="text-neon hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest gap-2 disabled:opacity-30">
               <Plus className="w-4 h-4" /> Добавить точку
             </Button>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
             {tradePoints.map((point, i) => (
                <div key={i} className="flex gap-4 items-center animate-fade-in">
                   <div className="flex-1">
                     <LocationInput value={point} disabled={success} onChange={(val) => updateTradePoint(i, val)} placeholder={`Адрес точки ${i + 1}`} />
                   </div>
                   {tradePoints.length > 1 && (
                     <Button disabled={success} onClick={() => removeTradePoint(i)} variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl disabled:opacity-30">
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
                  disabled={success || loading}
                  onChange={(e) => setSigningName(e.target.value)}
                  placeholder="Фамилия Имя Отчество" 
                  className="bg-neutral-900/80 border-2 border-neon/30 focus:border-neon rounded-2xl p-8 text-center text-2xl font-black italic uppercase tracking-wider text-neon shadow-2xl shadow-neon/10 disabled:opacity-80 disabled:cursor-not-allowed" 
                />
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
                  Нажимая кнопку ниже, вы подтверждаете акцепт оферты и <br /> подписываете лицензионный договор в электронной форме (63-ФЗ).
                </p>
              </div>

              <Button 
                onClick={handleGenerateLicense}
                disabled={loading || success}
                className="w-full bg-neon text-black hover:scale-105 transition-all rounded-2xl py-10 font-black uppercase text-sm tracking-widest gap-3 shadow-2xl shadow-neon/30 border-none group disabled:opacity-50 disabled:hover:scale-100 disabled:bg-neutral-800 disabled:text-neutral-500"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : success ? (
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
           {success ? (
             <div className="glass-dark border-2 border-neon/30 p-8 rounded-[2rem] space-y-6 group bg-neon/5 animate-fade-in shadow-2xl shadow-neon/10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-neon rounded-xl flex items-center justify-center shadow-lg shadow-neon/20">
                    <CheckCircle2 className="text-black w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neon animate-pulse">Лицензия активна</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black uppercase tracking-tight text-white truncate">{legalName || "Ваша Лицензия"}</h4>
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                    Договор подписан: {existingLicense?.issuedAt ? new Date(existingLicense.issuedAt as string).toLocaleDateString("ru-RU") : new Date().toLocaleDateString("ru-RU")}
                  </p>
                </div>
                {existingLicense?.pdfUrl ? (
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
                    onClick={handleGenerateLicense}
                    variant="ghost" 
                    className="w-full border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest py-6 rounded-xl gap-2 transition-all"
                  >
                     <Download className="w-4 h-4" /> Сгенерировать PDF
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
    </div>
  );
}
