"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  defaultValue?: string;
  label?: string;
}

export const ImageUpload = ({ onUploadComplete, onUploadingChange, defaultValue, label = "Обложка" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);

  // Sync with defaultValue when it changes (initial load/updates)
  useEffect(() => {
    if (defaultValue) {
      setCurrentUrl(defaultValue);
    }
  }, [defaultValue]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      const metaResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          type: 'image'
        }),
      });

      if (!metaResponse.ok) {
        const errorData = await metaResponse.json();
        throw new Error(errorData.error || `Ошибка сервера: ${metaResponse.status}`);
      }

      const { uploadUrl, publicUrl } = await metaResponse.json();

      // Step 2: Upload direct to S3/Supabase
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Ошибка загрузки: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Ошибка сети"));
        xhr.send(file);
      });

      setCurrentUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("Изображение загружено!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка при загрузке";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }, [onUploadComplete, onUploadingChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif", ".svg"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-neutral-400" />
          {label}
        </h3>
        {currentUrl && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setCurrentUrl(null); onUploadComplete(""); }}
            className="text-neutral-500 hover:text-red-400 font-bold uppercase tracking-widest text-[10px] h-8"
          >
            Удалить
          </Button>
        )}
      </div>

      {!currentUrl ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-[2.5rem] p-8 transition-all cursor-pointer group",
            isDragActive ? "border-neon bg-neon/5" : "border-white/10 bg-white/[0.02] hover:border-white/20",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                isDragActive ? "bg-neon/20 border-neon" : "bg-white/5 border-white/10 group-hover:border-white/20"
            )}>
              {uploading ? (
                <div className="w-6 h-6 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-tight text-white">
                {uploading ? `Загрузка ${uploadProgress}%` : isDragActive ? "Отпустите файл" : "Выберите файл для обложки"}
              </p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                JPG, PNG, WEBP до 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 group">
          <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <Button variant="secondary" className="bg-white text-black font-black uppercase tracking-widest px-6 h-10 rounded-xl hover:bg-neon hover:text-black transition-colors">
                Заменить
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};
