"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ScriptCardProps {
  label: string;
  subject?: string;
  body: string;
  footer?: string;
  day: number;
  referralCode?: string;
  userName?: string;
}

export function ScriptCard({ label, subject, body, footer, day, referralCode, userName }: ScriptCardProps) {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Helper to replace placeholders
  const personalize = (text: string) => {
    if (!text) return "";
    let personalized = text;
    
    if (referralCode) {
      personalized = personalized.replace(/\[ваш_код\]/g, referralCode);
    }
    
    if (userName) {
      personalized = personalized.replace(/\[Имя\]/g, userName);
    }
    
    return personalized;
  };

  const personalizedSubject = useMemo(() => personalize(subject || ""), [subject, referralCode, userName]);
  const personalizedBody = useMemo(() => personalize(body), [body, referralCode, userName]);

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "subject") {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="glass-dark border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-neon/10 border border-neon/20 text-neon text-[10px] font-black uppercase tracking-widest">
            {label}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Subject Section */}
        {subject && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Тема письма</span>
              <button 
                onClick={() => copyToClipboard(personalizedSubject, "subject")}
                className="text-neutral-500 hover:text-neon transition-colors"
              >
                {copiedSubject ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm">
              {personalizedSubject}
            </div>
          </div>
        )}

        {/* Body Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Текст сообщения</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(personalizedBody, "body")}
              className={cn(
                "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                copiedBody ? "bg-neon/10 text-neon border-neon/20" : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10"
              )}
            >
              {copiedBody ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
              {copiedBody ? "Скопировано" : "Копировать текст"}
            </Button>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {personalizedBody}
          </div>
        </div>

        {/* Footer/Notes Section */}
        {footer && (
          <div className="mt-6 p-5 rounded-2xl bg-neon/5 border border-neon/10 flex gap-4 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-neon" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neon/60">Совет по отправке</span>
              <p className="text-xs font-bold text-white leading-relaxed">
                {footer}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
