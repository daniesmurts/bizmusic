"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBusinessProfileAction } from "@/lib/actions/settings";
import { validateBusinessLegalData } from "@/lib/validation/business";

type SetupForm = {
  inn: string;
  legalName: string;
  address: string;
  contactPerson: string;
  phone: string;
};

export default function DashboardSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SetupForm>({
    inn: "",
    legalName: "",
    address: "",
    contactPerson: "",
    phone: "",
  });

  useEffect(() => {
    async function loadBusiness() {
      try {
        const response = await fetch("/api/user/business");
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const business = await response.json();
        setForm({
          inn: business.inn || "",
          legalName: business.legalName || "",
          address: business.address || "",
          contactPerson: business.contactPerson || "",
          phone: business.phone || "",
        });
      } catch {
        toast.error("Не удалось загрузить данные компании");
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateBusinessLegalData(
      {
        inn: form.inn,
        legalName: form.legalName,
        address: form.address,
      },
      { requireAll: true }
    );

    if (!validation.isValid) {
      toast.error(validation.error || "Проверьте обязательные поля");
      return;
    }

    setSaving(true);
    try {
      const result = await updateBusinessProfileAction({
        inn: form.inn,
        legalName: form.legalName,
        address: form.address,
        contactPerson: form.contactPerson || null,
        phone: form.phone || null,
      });

      if (!result.success) {
        toast.error(result.error || "Не удалось сохранить данные");
        return;
      }

      toast.success("Реквизиты сохранены");
      router.push("/dashboard/subscription");
      router.refresh();
    } catch {
      toast.error("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-neutral-300">
          Загружаем данные компании...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Завершите настройку компании</h1>
        <p className="text-sm text-neutral-400">
          Для подключения подписки заполните обязательные юридические реквизиты: ИНН, название и адрес.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-300">ИНН (10 цифр)</label>
          <Input
            value={form.inn}
            onChange={(e) => setForm((prev) => ({ ...prev, inn: e.target.value }))}
            placeholder="7701234567"
            required
            inputMode="numeric"
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-300">Юридическое название</label>
          <Input
            value={form.legalName}
            onChange={(e) => setForm((prev) => ({ ...prev, legalName: e.target.value }))}
            placeholder='ООО "Маяк"'
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-300">Юридический адрес</label>
          <Input
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="г. Москва, ул. Арбат, д. 1"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-300">Контактное лицо</label>
            <Input
              value={form.contactPerson}
              onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
              placeholder="Иван Иванов"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-300">Телефон</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+7 (999) 000-00-00"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving} className="font-black uppercase tracking-widest">
            {saving ? "Сохраняем..." : "Сохранить и продолжить"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/settings")}>
            Перейти в полные настройки
          </Button>
        </div>
      </form>
    </div>
  );
}
