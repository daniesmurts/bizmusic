"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building,
  CreditCard,
  Lock,
  Save,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Banknote,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserProfileAction,
  updateUserEmailAction,
  updateUserPasswordAction,
  updateBusinessProfileAction,
  getPaymentMethodsAction,
  getSubscriptionInfoAction,
} from "@/lib/actions/settings";

interface SubscriptionInfo {
  subscriptionStatus: string | null;
  subscriptionExpiresAt: Date | string | null;
  currentPlanSlug: string | null;
  trialEndsAt: Date | string | null;
  rebillId: string | null;
}

interface PaymentRecord {
  id: string;
  businessId: string;
  amount: number;
  status: string;
  orderId: string;
  tbankPaymentId?: string | null;
  recurrent: boolean;
  rebillId?: string | null;
  errorCode?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "business" | "security" | "billing">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [email, setEmail] = useState("");

  // Business state
  const [businessData, setBusinessData] = useState({
    legalName: "",
    inn: "",
    kpp: "",
    address: "",
    phone: "",
    contactPerson: "",
    businessType: "",
    businessCategory: "",
    bankName: "",
    bik: "",
    settlementAccount: "",
    corrAccount: "",
  });

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Billing state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const [profileResult, paymentsResult, subscriptionResult] = await Promise.all([
        getUserProfileAction(),
        getPaymentMethodsAction(),
        getSubscriptionInfoAction(),
      ]);

      if (profileResult.success && profileResult.data) {
        setEmail(profileResult.data.user.email || "");
        if (profileResult.data.business) {
          setBusinessData({
            legalName: profileResult.data.business.legalName || "",
            inn: profileResult.data.business.inn || "",
            kpp: profileResult.data.business.kpp || "",
            address: profileResult.data.business.address || "",
            phone: profileResult.data.business.phone || "",
            contactPerson: profileResult.data.business.contactPerson || "",
            businessType: profileResult.data.business.businessType || "",
            businessCategory: profileResult.data.business.businessCategory || "",
            bankName: profileResult.data.business.bankName || "",
            bik: profileResult.data.business.bik || "",
            settlementAccount: profileResult.data.business.settlementAccount || "",
            corrAccount: profileResult.data.business.corrAccount || "",
          });
        }
      }

      if (paymentsResult.success) {
        setPayments(paymentsResult.data || []);
      }

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.data ?? null);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEmail() {
    setSaving(true);
    try {
      const result = await updateUserEmailAction(email);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ошибка обновления email");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserPasswordAction(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (result.success) {
        toast.success(result.message);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ошибка обновления пароля");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBusiness() {
    setSaving(true);
    try {
      const result = await updateBusinessProfileAction(businessData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ошибка обновления профиля компании");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "profile" as const, name: "Профиль", icon: User },
    { id: "business" as const, name: "Компания", icon: Building },
    { id: "billing" as const, name: "Подписка", icon: CreditCard },
    { id: "security" as const, name: "Безопасность", icon: Lock },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-neon/20 border-t-neon animate-spin mx-auto" />
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          Настройки <span className="text-neon underline decoration-neon/20 underline-offset-8">Аккаунта</span>
        </h1>
        <p className="text-neutral-400 font-medium text-sm italic">
          Управление профилем, компанией и подпиской
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-white/5 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "bg-neon/10 border border-neon/20 text-neon px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                  : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
              }
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Личная информация</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  ID пользователя
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input
                    value={user?.id || ""}
                    disabled
                    className="pl-12 bg-white/[0.02] border-white/10 text-neutral-500 rounded-2xl h-14"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUpdateEmail}
                disabled={saving}
                className="bg-neon text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all rounded-2xl px-8 h-14 font-black uppercase tracking-widest gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === "business" && (
        <div className="space-y-8">
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Информация о компании</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Юридическое название
                </Label>
                <Input
                  value={businessData.legalName}
                  onChange={(e) => setBusinessData({ ...businessData, legalName: e.target.value })}
                  placeholder="ООО 'Пример'"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  ИНН
                </Label>
                <Input
                  value={businessData.inn}
                  onChange={(e) => setBusinessData({ ...businessData, inn: e.target.value })}
                  placeholder="1234567890"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  КПП
                </Label>
                <Input
                  value={businessData.kpp}
                  onChange={(e) => setBusinessData({ ...businessData, kpp: e.target.value })}
                  placeholder="123456789"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Телефон
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                    className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Адрес
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <Input
                    value={businessData.address}
                    onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Контактное лицо
                </Label>
                <Input
                  value={businessData.contactPerson}
                  onChange={(e) => setBusinessData({ ...businessData, contactPerson: e.target.value })}
                  placeholder="Иванов Иван"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Тип бизнеса
                </Label>
                <select
                  value={businessData.businessType}
                  onChange={(e) => setBusinessData({ ...businessData, businessType: e.target.value })}
                  className="bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 text-sm font-bold uppercase tracking-widest"
                >
                  <option value="">Выбрать тип</option>
                  <option value="ip">ИП</option>
                  <option value="ooo">ООО</option>
                  <option value="self">Самозанятый</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Категория бизнеса
                </Label>
                <select
                  value={businessData.businessCategory}
                  onChange={(e) => setBusinessData({ ...businessData, businessCategory: e.target.value })}
                  className="bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 text-sm font-bold uppercase tracking-widest"
                >
                  <option value="">Выбрать категорию</option>
                  <option value="cafe">Кафе / Ресторан</option>
                  <option value="retail">Ритейл</option>
                  <option value="office">Офис</option>
                  <option value="fitness">Фитнес</option>
                  <option value="beauty">Салон красоты</option>
                  <option value="hotel">Отель</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUpdateBusiness}
                disabled={saving}
                className="bg-neon text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all rounded-2xl px-8 h-14 font-black uppercase tracking-widest gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>

          {/* Banking Details */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Banknote className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Банковские реквизиты</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Банк
                </Label>
                <Input
                  value={businessData.bankName}
                  onChange={(e) => setBusinessData({ ...businessData, bankName: e.target.value })}
                  placeholder="ПАО Сбербанк"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  БИК
                </Label>
                <Input
                  value={businessData.bik}
                  onChange={(e) => setBusinessData({ ...businessData, bik: e.target.value })}
                  placeholder="044525225"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Расчетный счет
                </Label>
                <Input
                  value={businessData.settlementAccount}
                  onChange={(e) => setBusinessData({ ...businessData, settlementAccount: e.target.value })}
                  placeholder="40702810400000000000"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Корреспондентский счет
                </Label>
                <Input
                  value={businessData.corrAccount}
                  onChange={(e) => setBusinessData({ ...businessData, corrAccount: e.target.value })}
                  placeholder="30101810400000000000"
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUpdateBusiness}
                disabled={saving}
                className="bg-neon text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all rounded-2xl px-8 h-14 font-black uppercase tracking-widest gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-8">
          {/* Subscription Status */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Текущая подписка</h2>
            </div>

            {subscription ? (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Статус
                  </p>
                  <Badge
                    className={
                      subscription.subscriptionStatus === "ACTIVE"
                        ? "bg-neon/10 border-neon/20 text-neon px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                        : "bg-orange-500/10 border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                    }
                  >
                    {subscription.subscriptionStatus === "ACTIVE" ? "Активна" : subscription.subscriptionStatus || "Неактивна"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    План
                  </p>
                  <p className="text-white font-black text-lg uppercase">
                    {subscription.currentPlanSlug || "Не выбран"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Действует до
                  </p>
                  <p className="text-white font-bold text-lg">
                    {subscription.subscriptionExpiresAt
                      ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">
                  У вас нет активной подписки
                </p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Banknote className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">История платежей</h2>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          payment.status === "completed"
                            ? "w-10 h-10 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center"
                            : "w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"
                        }
                      >
                        {payment.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-neon" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-black uppercase tracking-tight">
                          {payment.orderId || "Платеж"}
                        </p>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                          {new Date(payment.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-lg">
                        {(payment.amount / 100).toLocaleString("ru-RU")} ₽
                      </p>
                      <Badge
                        className={
                          payment.status === "completed"
                            ? "bg-neon/10 border-neon/20 text-neon px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                            : "bg-orange-500/10 border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                        }
                      >
                        {payment.status === "completed" ? "Успешно" : payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">
                  История платежей пуста
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-8">
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Смена пароля</h2>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Текущий пароль
                </Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Новый пароль
                </Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-black uppercase tracking-widest text-xs">
                  Подтверждение пароля
                </Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={saving}
                  className="bg-neon text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all rounded-2xl px-8 h-14 font-black uppercase tracking-widest gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {saving ? "Сохранение..." : "Обновить пароль"}
                </Button>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-neon" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Советы по безопасности</h2>
            </div>

            <ul className="space-y-3 text-neutral-400 text-sm font-medium">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-neon mt-0.5 flex-shrink-0" />
                <span>Используйте пароль не менее 8 символов с заглавными буквами и цифрами</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-neon mt-0.5 flex-shrink-0" />
                <span>Не используйте один и тот же пароль на разных сайтах</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-neon mt-0.5 flex-shrink-0" />
                <span>Регулярно обновляйте пароль (рекомендуется раз в 3 месяца)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-neon mt-0.5 flex-shrink-0" />
                <span>Всегда выходите из аккаунта на общественных компьютерах</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
