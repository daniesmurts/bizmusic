"use client";

import { useState } from "react";
import { AlertTriangle, FileText, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateLicenseAction, retryLicenseGenerationAction } from "@/lib/actions/licenses";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface LicenseButtonProps {
  businessId: string;
  hasLicense: boolean;
  licenseId?: string;
  pdfUrl?: string | null;
  documentStatus?: "GENERATING" | "READY" | "FAILED";
  generationError?: string | null;
}

export function LicenseButton({
  businessId,
  hasLicense,
  licenseId,
  pdfUrl,
  documentStatus,
  generationError,
}: LicenseButtonProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateLicenseAction(businessId);
      if (result.success && result.data) {
        toast.success("Лицензия успешно сформирована!");
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
        if (result.data.pdfUrl) {
          window.open(result.data.pdfUrl, "_blank");
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Ошибка при генерации лицензии");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!licenseId) {
      toast.error("Не найден идентификатор лицензии для повторной генерации");
      return;
    }

    setLoading(true);
    try {
      const result = await retryLicenseGenerationAction(licenseId);
      if (result.success && result.data) {
        toast.success("Документы успешно пересобраны");
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
        if (result.data.pdfUrl) {
          window.open(result.data.pdfUrl, "_blank");
        }
      } else {
        toast.error(result.error || "Повторная генерация не удалась");
      }
    } catch {
      toast.error("Ошибка при повторной генерации");
    } finally {
      setLoading(false);
    }
  };

  if (hasLicense && documentStatus === "FAILED") {
    return (
      <div className="flex items-center gap-2">
        <div
          title={generationError || "Ошибка генерации документа"}
          className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 transition-all"
          onClick={handleRetry}
          disabled={loading}
          title="Повторная генерация"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  if (hasLicense && documentStatus === "GENERATING") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-neutral-400"
        disabled
        title="Документы формируются"
      >
        <Loader2 className="w-4 h-4 animate-spin text-neon" />
      </Button>
    );
  }

  if (hasLicense && pdfUrl) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 hover:bg-neon/20 text-neon transition-all"
        asChild
      >
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          <FileText className="w-4 h-4" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-neutral-400 hover:text-white"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-neon" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
    </Button>
  );
}
