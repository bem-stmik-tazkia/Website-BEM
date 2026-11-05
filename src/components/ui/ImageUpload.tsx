"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FiX,
  FiImage,
  FiLoader,
  FiUpload,
  FiLink,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";
import { compressImage } from "@/lib/imageCompression";
import { useTranslations } from "next-intl";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  folder?: string;
  label?: string;
}

/**
 * Ekstrak tautan file gambar langsung jika pengguna menempelkan URL halaman
 * hasil pencarian gambar (seperti Google Images, Bing Images, Yahoo Images, dsb).
 */
export function extractDirectImageUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return trimmed;
    }
    const urlObj = new URL(trimmed);

    // 1. Google Images (google.com/imgres?...&imgurl=https%3A%2F%2F...)
    if (urlObj.hostname.includes("google.") && urlObj.searchParams.has("imgurl")) {
      const imgurl = urlObj.searchParams.get("imgurl");
      if (imgurl) {
        return decodeURIComponent(imgurl);
      }
    }

    // 2. Bing Images (bing.com/images/search?...&mediaurl=https%3A%2F%2F...)
    if (urlObj.hostname.includes("bing.com") && urlObj.searchParams.has("mediaurl")) {
      const mediaurl = urlObj.searchParams.get("mediaurl");
      if (mediaurl) {
        return decodeURIComponent(mediaurl);
      }
    }

    // 3. Yahoo Images (images.search.yahoo.com/...imgurl=...)
    if (urlObj.hostname.includes("yahoo.com") && urlObj.searchParams.has("imgurl")) {
      const imgurl = urlObj.searchParams.get("imgurl");
      if (imgurl) {
        return decodeURIComponent(imgurl);
      }
    }

    // 4. Google Drive share view link -> direct preview link
    if (urlObj.hostname.includes("drive.google.com") && urlObj.pathname.includes("/file/d/")) {
      const match = urlObj.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    // 5. Dropbox share link -> raw image direct link
    if (urlObj.hostname.includes("dropbox.com")) {
      urlObj.searchParams.set("raw", "1");
      return urlObj.toString();
    }

    return trimmed;
  } catch {
    return rawUrl.trim();
  }
}

export default function ImageUpload({
  value,
  onChange,
  className = "",
  folder = "kabinet",
  label,
}: ImageUploadProps) {
  const t = useTranslations("ImageUpload");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset load error state jika value berubah
  useEffect(() => {
    setImageLoadError(false);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t("errMax2MB"));
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      setError(t("errInvalidType"));
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setImageLoadError(false);

      // Kompres file sebelum upload (max 1MB, 1920px)
      // Kompresi via HTML5 Canvas ini otomatis membuang payload EXIF / script jahat yang disisipkan
      const compressedFile = await compressImage(file, 1, 1920);

      // Kirim ke API endpoint /api/upload
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.publicUrl) {
        throw new Error(result.error || t("errUploadFailed"));
      }

      onChange(result.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || t("errUploadFailed"));
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError(t("errEmptyUrl"));
      return;
    }

    // Validasi URL aman (wajib diawali http/https, cegah skema javascript/data)
    if (!/^https?:\/\//i.test(trimmed)) {
      setError(t("errHttpRequired"));
      return;
    }

    if (/^(javascript|vbscript|data):/i.test(trimmed)) {
      setError(t("errProtocolBlocked"));
      return;
    }

    // Ekstrak URL gambar langsung jika dari Google Images / Bing Images / Google Drive
    const directUrl = extractDirectImageUrl(trimmed);

    // Pre-validasi: uji muat gambar dengan objek Image browser
    setIsValidatingUrl(true);
    setError(null);

    if (typeof window !== "undefined") {
      const testImg = new window.Image();
      let isHandled = false;

      // Timeout 6 detik jika server luar sangat lambat
      const timeoutId = setTimeout(() => {
        if (!isHandled) {
          isHandled = true;
          setIsValidatingUrl(false);
          setImageLoadError(false);
          onChange(directUrl);
        }
      }, 6000);

      testImg.onload = () => {
        if (!isHandled) {
          isHandled = true;
          clearTimeout(timeoutId);
          setIsValidatingUrl(false);
          setImageLoadError(false);
          setError(null);
          onChange(directUrl);
        }
      };

      testImg.onerror = () => {
        if (!isHandled) {
          isHandled = true;
          clearTimeout(timeoutId);
          setIsValidatingUrl(false);
          setError(t("errNotDirectImage"));
        }
      };

      testImg.src = directUrl;
    } else {
      setIsValidatingUrl(false);
      onChange(directUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setUrlInput("");
    setError(null);
    setImageLoadError(false);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Jika sudah ada gambar terpilih, tampilkan Thumbnail Preview */}
      {value ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full min-w-0 overflow-hidden">
          <div className="relative group rounded-xl overflow-hidden border border-outline-variant/30 aspect-video w-full max-w-[200px] bg-surface-variant/30 flex items-center justify-center shadow-xs shrink-0">
            {imageLoadError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-rose-500/10 text-rose-500 gap-1.5">
                <FiAlertTriangle size={22} />
                <span className="text-[10px] font-bold leading-tight">
                  {t("errImageFailedToLoad")}
                </span>
              </div>
            ) : (
              <img
                src={value}
                alt="Preview Cover"
                className="w-full h-full object-cover"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="w-8 h-8 bg-rose-600 hover:bg-rose-700 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer"
                title={t("deleteTitle")}
                type="button"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0 overflow-hidden">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                imageLoadError
                  ? "text-rose-500"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {imageLoadError ? (
                <FiAlertTriangle size={14} />
              ) : (
                <FiCheck size={14} />
              )}
              <span>
                {imageLoadError
                  ? t("errImageFailedToLoad")
                  : t("successAttached")}
              </span>
            </span>
            <p className="text-[11px] text-on-surface-variant/70 truncate w-full max-w-full font-mono bg-surface-variant/20 px-2 py-0.5 rounded border border-outline-variant/20" title={value}>
              {value}
            </p>
            {imageLoadError && (
              <p className="text-[11px] text-rose-500 leading-relaxed w-full max-w-full">
                {t("errImageFailedHint")}
              </p>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 text-left mt-1 hover:underline cursor-pointer"
            >
              {t("changeOrRemove")}
            </button>
          </div>
        </div>
      ) : (
        /* Jika belum ada gambar, sediakan Opsi: Unggah File ATAU Tautan URL */
        <div>
          {/* Tab Pilihan Mode Input */}
          <div className="flex items-center gap-1 mb-2.5 bg-surface-variant/30 p-1 rounded-xl w-fit border border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                setUploadMode("file");
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                uploadMode === "file"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <FiUpload size={13} />
              <span>{label || t("tabUpload")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode("url");
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                uploadMode === "url"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <FiLink size={13} />
              <span>{t("tabUrl")}</span>
            </button>
          </div>

          {/* Mode 1: Unggah Berkas */}
          {uploadMode === "file" && (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={isUploading}
                className={`
                  aspect-square w-full max-w-[130px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                  ${isUploading ? "border-primary/50 bg-primary/5 text-primary" : ""}
                  ${
                    isDragging
                      ? "border-primary bg-primary/10 text-primary scale-105"
                      : !isUploading
                      ? "border-outline-variant/50 bg-surface-variant/10 text-on-surface-variant hover:border-primary hover:bg-primary/5 hover:text-primary"
                      : ""
                  }
                  ${error ? "border-rose-400 bg-rose-500/10 text-rose-500" : ""}
                `}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <FiLoader className="animate-spin text-xl text-primary" />
                    <span className="text-[10px] font-bold text-primary">{t("uploading")}</span>
                  </div>
                ) : (
                  <>
                    <FiImage className="text-2xl opacity-70" />
                    <span className="text-[10px] font-bold px-2 text-center leading-tight">
                      {label || t("tabUpload")}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mode 2: Masukkan Tautan URL Langsung */}
          {uploadMode === "url" && (
            <div className="max-w-md space-y-2 p-3.5 rounded-2xl bg-surface-variant/20 border border-outline-variant/30">
              <label className="text-xs font-semibold text-on-surface block">
                {t("urlInputLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  disabled={isValidatingUrl}
                  placeholder={t("urlInputPlaceholder")}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={isValidatingUrl}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isValidatingUrl ? (
                    <>
                      <FiLoader className="animate-spin text-xs" />
                      <span>{t("validating")}</span>
                    </>
                  ) : (
                    <span>{t("btnApply")}</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                {t("urlTip")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pesan Kesalahan Jika Ada */}
      {error && (
        <p className="text-xs text-rose-500 font-semibold animate-shake">
          {error}
        </p>
      )}
    </div>
  );
}
