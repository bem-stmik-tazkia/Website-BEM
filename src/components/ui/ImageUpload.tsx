"use client";

import React, { useState, useRef } from "react";
import { FiX, FiImage, FiLoader, FiUpload, FiLink, FiCheck } from "react-icons/fi";
import { compressImage } from "@/lib/imageCompression";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  folder?: string;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  className = "",
  folder = "kabinet",
  label,
}: ImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      setError("Hanya file gambar JPG, PNG, atau WebP yang diperbolehkan");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

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
        throw new Error(result.error || "Gagal mengunggah gambar.");
      }

      onChange(result.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Gagal mengunggah gambar");
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
      setError("Silakan masukkan tautan URL gambar.");
      return;
    }

    // Validasi URL aman (wajib diawali http/https, cegah skema javascript/data)
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Tautan tidak valid. Harap gunakan alamat URL yang diawali https:// atau http://");
      return;
    }

    if (/^(javascript|vbscript|data):/i.test(trimmed)) {
      setError("Protokol tautan tidak diizinkan demi alasan keamanan.");
      return;
    }

    setError(null);
    onChange(trimmed);
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
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Jika sudah ada gambar terpilih, tampilkan Thumbnail Preview */}
      {value ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative group rounded-xl overflow-hidden border border-outline-variant/30 aspect-video w-full max-w-[200px] bg-surface-variant/30 flex items-center justify-center shadow-xs">
            <img
              src={value}
              alt="Preview Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="w-8 h-8 bg-rose-600 hover:bg-rose-700 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer"
                title="Hapus gambar"
                type="button"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <FiCheck size={14} />
              <span>Gambar sampul berhasil terpasang</span>
            </span>
            <p className="text-[11px] text-on-surface-variant/70 truncate max-w-xs sm:max-w-md font-mono">
              {value}
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 text-left mt-1 hover:underline cursor-pointer"
            >
              Ganti / Hapus Foto
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
              <span>{label || "Upload Foto"}</span>
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
              <span>Tautan URL</span>
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
                    <span className="text-[10px] font-bold text-primary">Mengunggah...</span>
                  </div>
                ) : (
                  <>
                    <FiImage className="text-2xl opacity-70" />
                    <span className="text-[10px] font-bold px-2 text-center leading-tight">
                      {label || "Upload Foto"}
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
                Masukkan URL Gambar Langsung:
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
                  placeholder="https://images.unsplash.com/... atau https://..."
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                Tips: Tautan wajib diawali dengan <code>https://</code> dan merujuk ke gambar publik yang valid (JPG/PNG/WebP).
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
