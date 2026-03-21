"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { MapPin, Loader2 } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef<string>("");
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3 || !window.ymaps) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    latestQueryRef.current = query;
    setLoading(true);

    debounceRef.current = setTimeout(() => {
      const capturedQuery = query;
      try {
        window.ymaps.ready(() => {
          window.ymaps.suggest(capturedQuery).then((items: any[]) => {
            // Ignore out-of-order responses
            if (capturedQuery !== latestQueryRef.current) return;
            setSuggestions(items);
            setIsOpen(items.length > 0);
            setLoading(false);
          });
        });
      } catch (error) {
        console.error("Yandex Suggest Error:", error);
        setLoading(false);
      }
    }, 250);
  };

  const handleSelect = (item: any) => {
    onChange(item.value);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Script
        src={`https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`}
        strategy="afterInteractive"
      />
      
      <div className="relative group">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "bg-neutral-900 border-white/10 rounded-2xl p-6 pr-12 text-white h-14 focus:border-neon focus:ring-1 focus:ring-neon transition-all",
            className
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neon transition-colors">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-6 py-4 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0 flex flex-col gap-0.5"
              >
                <span className="font-bold tracking-tight">{item.displayName}</span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black opacity-50">Выбрать этот адрес</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
