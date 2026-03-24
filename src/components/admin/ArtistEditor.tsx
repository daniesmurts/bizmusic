"use client";

import { useState, useEffect } from "react";
import { AdminArtist } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { 
  X, 
  Save, 
  User, 
  Link as LinkIcon, 
  Globe, 
  Music2, 
  Instagram,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { slugify } from "@/lib/slug-utils";

interface ArtistEditorProps {
  initialData?: AdminArtist | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ArtistEditor = ({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: ArtistEditorProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [links, setLinks] = useState({
    spotify: initialData?.externalLinks?.spotify || "",
    vk: initialData?.externalLinks?.vk || "",
    appleMusic: initialData?.externalLinks?.appleMusic || "",
    website: initialData?.externalLinks?.website || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate slug from name (with Cyrillic transliteration)
  useEffect(() => {
    if (!initialData && name) {
      setSlug(slugify(name));
    }
  }, [name, initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Имя обязательно";
    if (!slug.trim()) newErrors.slug = "Slug обязателен";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name,
      slug,
      imageUrl,
      bio,
      isFeatured,
      externalLinks: links,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-dark border border-white/10 rounded-[2rem] p-8 space-y-6 text-center">
             <Label className="text-white font-black uppercase tracking-widest text-[10px] block text-left">
                Фото артиста
             </Label>
             <div className="flex flex-col items-center gap-6">
                <ImageUpload 
                  defaultValue={imageUrl} 
                  onUploadComplete={setImageUrl}
                  label="Фото артиста"
                />
                <div className="text-left w-full space-y-4">
                    <div>
                      <Label className="text-white font-black uppercase tracking-widest text-[10px]">
                        Имя артиста *
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название группы или имя..."
                        className={cn(
                          "mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6",
                          errors.name && "border-red-500/50"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-white font-black uppercase tracking-widest text-[10px]">
                        URL Slug (публичная ссылка)
                      </Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="artist-name"
                        className={cn(
                          "mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6 font-mono text-sm",
                          errors.slug && "border-red-500/50"
                        )}
                      />
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Bio & Links */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-dark border border-white/10 rounded-[2rem] p-8 space-y-6">
              <div>
                <Label className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-3 text-neutral-400">
                  <User className="w-4 h-4 text-neon" />
                  Биография
                </Label>
                <Textarea
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  placeholder="Расскажите об артисте..."
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl min-h-[160px] p-6 resize-none leading-relaxed"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 text-neutral-400">
                        <Music2 className="w-3.5 h-3.5" /> Spotify
                    </Label>
                    <Input
                        value={links.spotify}
                        onChange={(e) => setLinks({...links, spotify: e.target.value})}
                        placeholder="https://open.spotify.com/artist/..."
                        className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 text-neutral-400">
                        <Instagram className="w-3.5 h-3.5" /> VK Music
                    </Label>
                    <Input
                        value={links.vk}
                        onChange={(e) => setLinks({...links, vk: e.target.value})}
                        placeholder="https://vk.com/artist/..."
                        className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 text-neutral-400">
                        <Music2 className="w-3.5 h-3.5" /> Apple Music
                    </Label>
                    <Input
                        value={links.appleMusic}
                        onChange={(e) => setLinks({...links, appleMusic: e.target.value})}
                        placeholder="https://music.apple.com/artist/..."
                        className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 text-neutral-400">
                        <Globe className="w-3.5 h-3.5" /> Веб-сайт
                    </Label>
                    <Input
                        value={links.website}
                        onChange={(e) => setLinks({...links, website: e.target.value})}
                        placeholder="https://artist.com"
                        className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4"
                    />
                 </div>
              </div>
           </div>

           <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <p className="text-white font-black uppercase tracking-tight">
                    Рекомендуемый артист (Featured)
                  </p>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    Будет отображаться в специальных разделах главной страницы
                  </p>
                </div>
              </div>
              <Switch
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
                className="data-[state=checked]:bg-neon h-7 w-12"
              />
           </div>

           <div className="flex gap-4">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-[2rem] h-16 font-black uppercase tracking-widest"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-neon text-black hover:scale-[1.02] transition-transform rounded-[2rem] h-16 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-3"
              >
                <Save className="w-5 h-5" />
                {initialData ? "Обновить профиль" : "Создать артиста"}
              </Button>
           </div>
        </div>
      </div>
    </form>
  );
};
