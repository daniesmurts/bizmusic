"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, X, CheckCircle2, AlertCircle, Music, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WaveSurfer from "wavesurfer.js";
import { toast } from "sonner";
import { parseBlob } from "music-metadata-browser";

interface TrackUploaderProps {
  onUploadComplete: (fileName: string, publicUrl: string, duration: number, coverUrl?: string) => void;
  uploadType?: "audio" | "announcement";
}

function isAbortLikeWaveError(err: unknown) {
  const name = typeof err === "object" && err !== null && "name" in err ? String((err as { name: unknown }).name) : "";
  const message = typeof err === "object" && err !== null && "message" in err
    ? String((err as { message: unknown }).message)
    : String(err ?? "");

  return name === "AbortError"
    || /aborted|aborterror|signal is aborted without reason/i.test(message);
}

export const TrackUploader = ({ onUploadComplete, uploadType = "audio" }: TrackUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [extractedCoverUrl, setExtractedCoverUrl] = useState<string | null>(null);
  
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const coverUrlRef = useRef<string | null>(null);

  /**
   * Extract embedded cover art from audio file ID3 tags and upload to storage.
   */
  async function extractAndUploadCoverArt(file: File): Promise<string | undefined> {
    try {
      const metadata = await parseBlob(file);
      const picture = metadata.common.picture?.[0];
      if (!picture) return undefined;

      // Convert to File for upload
      const ext = picture.format.includes("png") ? "png" : "jpg";
      const coverBlob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
      const coverFileName = `cover_${Date.now()}.${ext}`;

      // Get presigned URL for image upload
      const metaRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: coverFileName,
          fileSize: coverBlob.size,
          fileType: picture.format,
          type: "image",
        }),
      });

      if (!metaRes.ok) return undefined;
      const { uploadUrl, publicUrl } = await metaRes.json();

      // Upload the image
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, false); // sync is OK for small images
      xhr.setRequestHeader("Content-Type", picture.format);
      xhr.send(coverBlob);

      if (xhr.status >= 200 && xhr.status < 300) {
        return publicUrl;
      }
    } catch (err) {
      console.warn("[TrackUploader] Could not extract embedded cover art:", err);
    }
    return undefined;
  }

  // Initialize wavesurfer when file is uploaded
  useEffect(() => {
    if (uploadedFile && waveformRef.current && uploadedUrlRef.current) {
      // Destroy previous instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      // Create new wavesurfer instance
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#5CF387",
        progressColor: "#ffffff",
        cursorColor: "#5CF387",
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 120,
        normalize: true,
        backend: "WebAudio",
      });

      ws.load(uploadedUrlRef.current);

      ws.on("ready", () => {
        const wsDuration = ws.getDuration();
        setDuration(wsDuration);
        onUploadComplete(uploadedFile.name, uploadedUrlRef.current!, wsDuration, coverUrlRef.current || undefined);
      });

      ws.on("error", (err) => {
        if (isAbortLikeWaveError(err)) {
          return;
        }

        console.error("WaveSurfer error:", err);
        toast.error("Failed to load audio waveform");
      });

      wavesurferRef.current = ws;

      return () => {
        if (wavesurferRef.current === ws) {
          wavesurferRef.current = null;
        }

        if (ws) {
          ws.destroy();
        }
      };
    }
  }, [uploadedFile, onUploadComplete]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL from API using metadata only
      // This prevents 413 Payload Too Large errors
      const metaResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          type: uploadType,
        }),
      });

      if (!metaResponse.ok) {
        const errorData = await metaResponse.json();
        if (metaResponse.status === 413) {
          throw new Error("Файл слишком большой для обработки сервером.");
        }
        throw new Error(errorData.error || `Ошибка сервера: ${metaResponse.status}`);
      }

      const uploadData = await metaResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Не удалось получить ссылку для загрузки");
      }

      const { uploadUrl, fileName, publicUrl } = uploadData;

      // Step 2: Upload file directly to storage using presigned URL
      // Use XMLHttpRequest to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Ошибка загрузки в хранилище: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Ошибка сети при загрузке файла"));
        xhr.send(file);
      });

      // Store the public URL for waveform visualization
      uploadedUrlRef.current = publicUrl;

      // Extract embedded cover art from ID3 tags and upload
      const embeddedCover = await extractAndUploadCoverArt(file);
      if (embeddedCover) {
        coverUrlRef.current = embeddedCover;
        setExtractedCoverUrl(embeddedCover);
      }

      setUploadedFile({
        name: fileName,
        url: publicUrl,
        size: file.size,
      });

      toast.success("Файл загружен успешно!");
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Ошибка при загрузке";
      console.error("Upload error:", err);
      setError(errMessage);
      toast.error(errMessage);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg", ".flac"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading || !!uploadedFile,
  });

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setDuration(0);
    uploadedUrlRef.current = null;
    coverUrlRef.current = null;
    setExtractedCoverUrl(null);
    setError(null);
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-[2rem] p-12 transition-all duration-300 cursor-pointer group",
            isDragActive
              ? "border-neon bg-neon/5 scale-[1.02]"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Icon */}
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center border-2 transition-all duration-300",
              isDragActive
                ? "bg-neon/20 border-neon scale-110"
                : "bg-white/5 border-white/10 group-hover:border-white/20"
            )}>
              {uploading ? (
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
                </div>
              ) : isDragActive ? (
                <Upload className="w-10 h-10 text-neon" />
              ) : (
                <Music className="w-10 h-10 text-neutral-400" />
              )}
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-md">
              <p className="text-lg font-black uppercase tracking-tight text-white">
                {uploading
                  ? "Загрузка..."
                  : isDragActive
                  ? "Отпустите файл для загрузки"
                  : "Перетащите аудиофайл или кликните"}
              </p>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
                MP3, WAV, OGG, FLAC до 100MB
              </p>
            </div>

            {/* Progress */}
            {uploading && (
              <div className="w-full max-w-xs space-y-2">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                  {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Uploaded File Display */
        <div className="relative glass-dark border border-white/10 rounded-[2rem] p-8 space-y-6">
          <button
            onClick={handleRemoveFile}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors group"
          >
            <X className="w-5 h-5 text-neutral-400 group-hover:text-red-400" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
              <FileAudio className="w-8 h-8 text-neon" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black uppercase tracking-tight truncate">
                {uploadedFile.name}
              </p>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-neon">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm font-black uppercase tracking-widest">Готово</span>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Аудиоволна
              </span>
              {duration > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {formatDuration(duration)}
                </span>
              )}
            </div>
            <div
              ref={waveformRef}
              className="w-full rounded-xl overflow-hidden bg-white/[0.02] border border-white/5"
            />
          </div>

          {/* Extracted Cover Art */}
          {extractedCoverUrl && (
            <div className="flex items-center gap-4 p-4 bg-neon/5 border border-neon/10 rounded-2xl">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                <img src={extractedCoverUrl} alt="Обложка" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white text-sm font-black uppercase tracking-tight">Обложка найдена</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Извлечена из метаданных файла
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
