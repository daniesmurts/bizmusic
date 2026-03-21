"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

interface LocationSuggestion {
  value: string;
  displayName: string;
  address: string;
  fullAddress: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef<string>("");

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
    if (disabled) return;
    const query = e.target.value;
    onChange(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    latestQueryRef.current = query;
    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const capturedQuery = query;
      try {
        const response = await fetch(`/api/location/suggest?text=${encodeURIComponent(capturedQuery)}`);
        if (!response.ok) throw new Error("Suggest API failed");
        
        const data = await response.json();
        
        // Ignore out-of-order responses
        if (capturedQuery !== latestQueryRef.current) return;
        
        const items: LocationSuggestion[] = data.results || [];
        setSuggestions(items);
        setIsOpen(items.length > 0);
      } catch (error) {
        console.error("Geosuggest Error:", error);
      } finally {
        if (capturedQuery === latestQueryRef.current) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleSelect = (item: LocationSuggestion) => {
    onChange(item.fullAddress || item.value);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* 
         NOTE: We no longer load the Yandex Maps JS API (ymaps). 
         We now use the specialized Geosuggest HTTP API via /api/location/suggest proxy.
      */}
      
      <div className="relative group">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "bg-neutral-900 border-white/10 rounded-2xl p-6 pr-12 text-white h-14 focus:border-neon focus:ring-1 focus:ring-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          disabled={disabled}
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
                {item.address && (
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black opacity-50">
                    {item.address}
                  </span>
                )}
                {!item.address && (
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black opacity-50">
                    Выбрать этот адрес
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
