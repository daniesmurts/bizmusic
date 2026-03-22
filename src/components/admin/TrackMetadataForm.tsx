"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, Plus, Music2, Zap, Tag } from "lucide-react";
import { toast } from "sonner";

interface TrackMetadataFormProps {
  fileName: string;
  fileUrl: string;
  duration: number;
  onSubmit: (data: {
    title: string;
    artist: string;
    bpm?: number;
    genre: string;
    moodTags: string[];
    energyLevel: number;
    isExplicit: boolean;
    isFeatured: boolean;
  }) => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    title: string;
    artist: string;
    bpm?: number | null;
    genre?: string | null;
    moodTags: string[];
    energyLevel?: number | null;
    isExplicit?: boolean;
    isFeatured?: boolean;
  };
}

const PREDEFINED_MOOD_TAGS = [
  "Morning",
  "Evening",
  "Cafe",
  "Retail",
  "Lounge",
  "Energetic",
  "Calm",
  "Jazz",
  "Electronic",
  "Ambient",
  "Pop",
  "Classical",
  "Upbeat",
  "Relaxing",
  "Focus",
  "Happy",
];

const COMMON_GENRES = [
  "Lo-Fi",
  "Jazz",
  "Café Pop",
  "Acoustic",
  "Deep House",
  "Chillout",
  "Electronic",
  "Classical",
  "Ambient",
  "Bossa Nova",
  "Rock",
  "R&B",
  "Corporate",
  "Cinematic",
];

export const TrackMetadataForm = ({
  fileName,
  fileUrl,
  duration,
  onSubmit,
  onCancel,
  initialData,
}: TrackMetadataFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");
  const [bpm, setBpm] = useState(initialData?.bpm?.toString() || "");
  const [genre, setGenre] = useState(initialData?.genre || "Unknown");
  const [moodTags, setMoodTags] = useState<string[]>(initialData?.moodTags || []);
  const [energyLevel, setEnergyLevel] = useState(initialData?.energyLevel || 5);
  const [isExplicit, setIsExplicit] = useState(initialData?.isExplicit || false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [customTag, setCustomTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Название обязательно";
    } else if (title.length < 2) {
      newErrors.title = "Минимум 2 символа";
    }

    if (!artist.trim()) {
      newErrors.artist = "Исполнитель обязателен";
    } else if (artist.length < 2) {
      newErrors.artist = "Минимум 2 символа";
    }

    if (bpm && (isNaN(Number(bpm)) || Number(bpm) < 30 || Number(bpm) > 300)) {
      newErrors.bpm = "BPM должен быть между 30 и 300";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Проверьте правильность заполнения формы");
      return;
    }

    onSubmit({
      title,
      artist,
      bpm: bpm ? Number(bpm) : undefined,
      genre,
      moodTags,
      energyLevel,
      isExplicit,
      isFeatured,
    });
  };

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !moodTags.includes(normalizedTag)) {
      setMoodTags([...moodTags, normalizedTag]);
    }
    setCustomTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMoodTags(moodTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(customTag);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Info */}
      <div className="glass-dark border border-white/10 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center gap-3 text-neutral-400">
          <Music2 className="w-5 h-5 text-neon" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Информация о файле
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
              Файл
            </p>
            <p className="text-sm font-bold text-white truncate">{fileName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
              Длительность
            </p>
            <p className="text-sm font-bold text-white">{formatDuration(duration)}</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-6">
        <div>
          <Label className="text-white font-black uppercase tracking-widest text-xs">
            Название трека *
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Morning Jazz Cafe"
            className={cn(
              "mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6",
              "focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all",
              errors.title && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {errors.title && (
            <p className="mt-2 text-xs font-bold text-red-400">{errors.title}</p>
          )}
        </div>

        <div>
          <Label className="text-white font-black uppercase tracking-widest text-xs">
            Исполнитель *
          </Label>
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Например: Easy Listening"
            className={cn(
              "mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6",
              "focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all",
              errors.artist && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {errors.artist && (
            <p className="mt-2 text-xs font-bold text-red-400">{errors.artist}</p>
          )}
        </div>

        <div>
          <Label className="text-white font-black uppercase tracking-widest text-xs">
            BPM (Tempo)
          </Label>
          <Input
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="Например: 120"
            type="number"
            min="30"
            max="300"
            className={cn(
              "mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6",
              "focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all",
              errors.bpm && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          {errors.bpm && (
            <p className="mt-2 text-xs font-bold text-red-400">{errors.bpm}</p>
          )}
          <p className="mt-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Оставьте пустым, если неизвестно
          </p>
        </div>

        <div>
          <Label className="text-white font-black uppercase tracking-widest text-xs">
            Жанр *
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {COMMON_GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={cn(
                  "px-4 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  genre === g
                    ? "bg-neon text-black border-neon"
                    : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                {g}
              </button>
            ))}
            <div className="relative col-span-full mt-2">
                <Input
                  value={!COMMON_GENRES.includes(genre) ? genre : ""}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Свой жанр..."
                  className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4 w-full"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon" />
            Уровень энергии
          </Label>
          <span className="text-2xl font-black text-neon">{energyLevel}</span>
        </div>
        <Slider
          value={[energyLevel]}
          min={1}
          max={10}
          step={1}
          onValueChange={(val) => setEnergyLevel(val[0])}
          className="py-4"
        />
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
          <span>Спокойный</span>
          <span>Энергичный</span>
        </div>
      </div>

      {/* Mood Tags */}
      <div className="space-y-4">
        <Label className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <Tag className="w-4 h-4 text-neon" />
          Настроение и жанры
        </Label>

        {/* Custom Tag Input */}
        <div className="flex gap-2">
          <Input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Добавить тег"
            className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4 flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAddTag(customTag)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 w-12 p-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Selected Tags */}
        {moodTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {moodTags.map((tag) => (
              <Badge
                key={tag}
                className="bg-neon/10 border border-neon/20 text-neon px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest gap-2 flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-neon/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Predefined Tags */}
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_MOOD_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                moodTags.includes(tag)
                  ? handleRemoveTag(tag)
                  : handleAddTag(tag)
              }
              className={cn(
                "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                moodTags.includes(tag)
                  ? "bg-neon text-black border-neon"
                  : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>


      <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div>
          <p className="text-white font-black uppercase tracking-tight">
            Нецензурная лексика
          </p>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
            Содержит ненормативную лексику
          </p>
        </div>
        <Switch
          checked={isExplicit}
          onCheckedChange={setIsExplicit}
          className="data-[state=checked]:bg-neon"
        />
      </div>

      <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div>
          <p className="text-white font-black uppercase tracking-tight">
            Рекомендуемый трек
          </p>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
            Появляется на главной странице (Featured)
          </p>
        </div>
        <Switch
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
          className="data-[state=checked]:bg-neon"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-white/5">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 font-black uppercase tracking-widest"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-neon text-black hover:scale-[1.02] transition-transform rounded-2xl h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)]"
        >
          Сохранить трек
        </Button>
      </div>
    </form>
  );
};
