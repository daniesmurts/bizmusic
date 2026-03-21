"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateLicenseAction } from "@/lib/actions/licenses";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface LicenseButtonProps {
  businessId: string;
  hasLicense: boolean;
  pdfUrl?: string | null;
}

export function LicenseButton({ businessId, hasLicense, pdfUrl }: LicenseButtonProps) {
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
    } catch (error) {
      toast.error("Ошибка при генерации лицензии");
    } finally {
      setLoading(false);
    }
  };

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
