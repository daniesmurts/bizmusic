"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, X, CheckCircle2, AlertCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WaveSurfer from "wavesurfer.js";
import { toast } from "sonner";

interface TrackUploaderProps {
  onUploadComplete: (fileName: string, publicUrl: string, duration: number) => void;
}

export const TrackUploader = ({ onUploadComplete }: TrackUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);

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
        onUploadComplete(uploadedFile.name, uploadedUrlRef.current!, wsDuration);
      });

      ws.on("error", (err) => {
        console.error("WaveSurfer error:", err);
        toast.error("Failed to load audio waveform");
      });

      wavesurferRef.current = ws;

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
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
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);

      // Get presigned upload URL from API
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      const { uploadUrl, fileName, publicUrl } = uploadData;

      // Upload file to Yandex Object Storage using presigned URL
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // Store the public URL for waveform visualization
      uploadedUrlRef.current = publicUrl;

      setUploadedFile({
        name: fileName,
        url: publicUrl,
        size: file.size,
      });

      toast.success("Файл загружен успешно!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
      toast.error(err.message || "Failed to upload file");
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
