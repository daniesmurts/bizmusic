"use client";

import { useEffect, useState } from "react";
import { Building2, Download, Mail, Plus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createLocationAction,
  deactivateManagerAction,
  getLocationsWithManagersAction,
  inviteBranchManagerAction,
} from "@/lib/actions/branches";

type Manager = {
  id: string;
  email: string;
  role: "ADMIN" | "BUSINESS_OWNER" | "STAFF";
  createdAt: string | Date;
};

type LocationCard = {
  id: string;
  name: string;
  address: string;
  createdAt: string | Date;
  assignedUsers: Manager[];
};

export default function BranchesPage() {
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [emailByLocation, setEmailByLocation] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const result = await getLocationsWithManagersAction();
    if (result.success) {
      setLocations(result.data);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">Филиалы</h1>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-2">
            Управление локациями, приглашениями и выгрузкой логов
          </p>
        </div>
      </div>

      <div className="glass-dark border border-white/10 rounded-[2rem] p-6 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-neon">Новый филиал</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Кофейня на Тверской" />
          </div>
          <div className="space-y-2">
            <Label>Адрес</Label>
            <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Москва, ул. Тверская, 1" />
          </div>
        </div>
        <Button
          onClick={async () => {
            const result = await createLocationAction(name, address);
            if (result.success) {
              setName("");
              setAddress("");
              toast.success("Филиал создан");
              await load();
              return;
            }
            toast.error(result.error);
          }}
          className="bg-neon text-black hover:bg-neon/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить филиал
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Загрузка...</div>
        ) : locations.length === 0 ? (
          <div className="glass-dark border border-white/10 rounded-[2rem] p-12 text-center text-neutral-500">
            Филиалы пока не созданы
          </div>
        ) : (
          locations.map((location) => {
            const manager = location.assignedUsers[0] ?? null;

            return (
              <div key={location.id} className="glass-dark border border-white/10 rounded-[2rem] p-6 space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-neutral-900 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-neon" />
                    </div>
                    <div>
                      <div className="text-white font-black uppercase tracking-widest">{location.name}</div>
                      <div className="text-neutral-500 text-sm mt-1">{location.address}</div>
                    </div>
                  </div>
                  <a
                    href={`/api/compliance/branch-export?locationId=${encodeURIComponent(location.id)}`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт логов
                  </a>
                </div>

                {manager ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-white font-bold">{manager.email}</div>
                      <div className="text-neutral-500 text-xs uppercase tracking-widest mt-1">Менеджер филиала</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const result = await deactivateManagerAction(manager.id);
                        if (result.success) {
                          toast.success("Доступ менеджера отозван");
                          await load();
                          return;
                        }
                        toast.error(result.error);
                      }}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Отозвать доступ
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Email менеджера</Label>
                      <Input
                        type="email"
                        value={emailByLocation[location.id] ?? ""}
                        onChange={(event) =>
                          setEmailByLocation((current) => ({
                            ...current,
                            [location.id]: event.target.value,
                          }))
                        }
                        placeholder="manager@example.com"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        const result = await inviteBranchManagerAction(
                          location.id,
                          emailByLocation[location.id] ?? ""
                        );
                        if (result.success) {
                          toast.success(result.message || "Приглашение отправлено");
                          setEmailByLocation((current) => ({ ...current, [location.id]: "" }));
                          await load();
                          return;
                        }
                        toast.error(result.error);
                      }}
                      className="bg-neon text-black hover:bg-neon/90"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Пригласить менеджера
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}