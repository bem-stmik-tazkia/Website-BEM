"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiSave, FiPlus, FiX, FiUpload, FiImage, FiLoader, FiAlertCircle } from "react-icons/fi";
import { saveKegiatan } from "@/app/(internal)/admin/kegiatan/actions";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/lib/imageCompression";

const CATEGORIES = ["Event", "Sosial", "Internal", "Seminar", "Galeri", "Lainnya"];

// ─── Photo Slot Component ─────────────────────────────────────────────────────
function PhotoSlot({
  url,
  index,
  onUpload,
  onRemove,
}: {
  url: string;
  index: number;
  onUpload: (index: number, url: string) => void;
  onRemove: (index: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran file maksimal 5MB"); return; }

    setUploading(true);
    try {
      // Kompres file sebelum upload (max 1MB, 1920px)
      const compressedFile = await compressImage(file, 1, 1920);

      const ext = compressedFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("public_images")
        .upload(`kabinet/${fileName}`, compressedFile, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("public_images").getPublicUrl(`kabinet/${fileName}`);
      onUpload(index, publicUrl);
    } catch (err: any) {
      alert("Gagal upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  if (url) {
    return (
      <div className="group relative aspect-square rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-variant/20">
        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
          >
            <FiX size={12} /> Hapus
          </button>
        </div>
        {/* Index badge */}
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {index + 1}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer select-none
        ${isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-outline-variant/40 bg-surface-variant/10 hover:border-primary/60 hover:bg-primary/5"
        }
        ${uploading ? "pointer-events-none" : ""}
      `}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {uploading ? (
        <>
          <FiLoader size={28} className="text-primary animate-spin" />
          <span className="text-xs text-primary font-semibold">Mengunggah...</span>
        </>
      ) : (
        <>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-primary/20 text-primary" : "bg-surface-variant/50 text-on-surface-variant/60"}`}>
            <FiImage size={22} />
          </div>
          <div className="text-center px-3">
            <p className="text-xs font-bold text-on-surface-variant">{isDragging ? "Lepaskan di sini" : "Klik atau seret foto"}</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">JPG, PNG, WEBP · Max 5MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TambahDokumentasiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    title: "",
    category: "Event",
    date: new Date().toISOString().split("T")[0],
    time_range: "",
    location: "",
    description: "",
    video_url: "",
    is_published: true,
    gallery: [] as string[],
  });

  const toastShown = useRef(false);
  const draftKey = "dokumentasi_draft_new";

  // Load draft
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        setForm(JSON.parse(saved));
        if (!toastShown.current) {
          toast("Draft tersimpan dimuat ulang.", "success");
          toastShown.current = true;
        }
      } catch(e) {}
    }
  }, [toast]);

  // Save draft
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const [initialForm] = useState(form);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBackNavigation = (e: React.MouseEvent, url: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingUrl(url);
      setShowLeaveConfirm(true);
    } else {
      router.push(url);
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handlePhotoUpload = (index: number, url: string) => {
    const newGallery = [...form.gallery];
    newGallery[index] = url;
    setForm((prev) => ({ ...prev, gallery: newGallery }));
    if (formErrors.gallery) setFormErrors((e) => { const n = { ...e }; delete n.gallery; return n; });
  };

  const removePhoto = (index: number) => {
    const newGallery = form.gallery.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, gallery: newGallery }));
  };

  const addEmptySlot = () => {
    setForm((prev) => ({ ...prev, gallery: [...prev.gallery, ""] }));
  };

  // Bulk upload multiple files at once
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    toast(`Memulai proses upload ${files.length} foto...`, "success");

    let successCount = 0;
    const errors: string[] = [];
    
    const uploading = files.map(async (file) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} bukan gambar.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} melebihi 5MB.`);
        return;
      }

      try {
        // Kompres file sebelum upload (max 1MB, 1920px)
        const compressedFile = await compressImage(file, 1, 1920);
        const ext = compressedFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${ext}`;
        
        const { error } = await supabase.storage.from("public_images").upload(`kabinet/${fileName}`, compressedFile, { cacheControl: "3600" });
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from("public_images").getPublicUrl(`kabinet/${fileName}`);
        
        // Update state per foto yang selesai, agar muncul satu-satu (lebih interaktif)
        setForm((prev) => ({
          ...prev,
          gallery: [...prev.gallery.filter(Boolean), publicUrl],
        }));
        successCount++;
      } catch (err: any) {
        errors.push(`Gagal upload ${file.name}: ${err.message}`);
      }
    });

    await Promise.all(uploading);
    
    if (successCount > 0) {
      if (formErrors.gallery) setFormErrors((e) => { const n = { ...e }; delete n.gallery; return n; });
      toast(`${successCount} dari ${files.length} foto berhasil diunggah!`, "success");
    }
    
    if (errors.length > 0) {
      toast(`Gagal mengunggah ${errors.length} foto. Cek kembali ukuran/tipe file.`, "error");
      console.error("Upload errors:", errors);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Judul wajib diisi";
    if (!form.date) errors.date = "Tanggal wajib diisi";
    if (form.gallery.filter(Boolean).length === 0) errors.gallery = "Minimal upload 1 foto dokumentasi";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("Harap lengkapi semua kolom yang wajib.", "error");
      const firstKey = Object.keys(errors)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
      const dateObj = new Date(form.date);

      await saveKegiatan({
        title: form.title,
        slug,
        type: "dokumentasi",
        category: form.category,
        date: dateObj.toISOString(),
        description: form.description || "",
        location: form.location || "-",
        time_range: form.time_range || "-",
        is_published: form.is_published,
        video_url: form.video_url || null,
        gallery: form.gallery.filter(Boolean),
        speakers: [],
      });

      localStorage.removeItem(draftKey);
      toast("Dokumentasi berhasil disimpan!", "success");
      router.push("/admin/dokumentasi");
    } catch (err: any) {
      toast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
      formErrors[field]
        ? "border-red-400 bg-red-50 focus:border-red-400"
        : "border-outline-variant/30 focus:border-primary"
    }`;

  const uploadedCount = form.gallery.filter(Boolean).length;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={(e) => handleBackNavigation(e, "/admin/dokumentasi")}
          className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Tambah Dokumentasi</h1>
          <p className="text-sm text-on-surface-variant mt-1">Upload foto dokumentasi kegiatan.</p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">

        {/* Publikasi Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/20">
          <div>
            <p className="font-bold text-sm text-on-surface">Status Publikasi</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {form.is_published ? "Dokumentasi tampil di halaman Galeri publik" : "Disimpan sebagai draft"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange("is_published", !form.is_published)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${form.is_published ? "bg-emerald-500" : "bg-outline-variant/40"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${form.is_published ? "translate-x-8" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Judul */}
        <div id="field-title" className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Judul Dokumentasi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={inputClass("title")}
            placeholder="Contoh: Baksos Tazkia Peduli, Seminar Nasional 2025..."
          />
          {formErrors.title && <p className="text-xs text-red-500 font-medium">{formErrors.title}</p>}
        </div>

        {/* Kategori + Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={inputClass("category")}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div id="field-date" className="space-y-2">
            <label className="text-sm font-bold text-on-surface">
              Tanggal Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className={inputClass("date")}
            />
            {formErrors.date && <p className="text-xs text-red-500 font-medium">{formErrors.date}</p>}
          </div>
        </div>

        {/* Waktu & Lokasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">
              Waktu <span className="text-on-surface-variant font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.time_range}
              onChange={(e) => handleChange("time_range", e.target.value)}
              className={inputClass("time_range")}
              placeholder="Contoh: 08:00 - 12:00 WIB"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">
              Lokasi <span className="text-on-surface-variant font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className={inputClass("location")}
              placeholder="Contoh: Aula Kampus, Zoom..."
            />
          </div>
        </div>

        {/* Deskripsi */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Deskripsi <span className="text-on-surface-variant font-normal">(opsional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            className={`${inputClass("description")} resize-none`}
            placeholder="Tuliskan sedikit keterangan tentang kegiatan ini..."
          />
        </div>

        {/* Video Link */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Link Video <span className="text-on-surface-variant font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={form.video_url}
            onChange={(e) => handleChange("video_url", e.target.value)}
            className={inputClass("video_url")}
            placeholder="Contoh: https://youtube.com/watch?v=... atau link Instagram Reels/TikTok"
          />
        </div>

        {/* ─── Gallery Upload ──────────────────────────────────────────── */}
        <div id="field-gallery" className="space-y-4 pt-4 border-t border-outline-variant/20">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-sm font-bold text-on-surface">
                Foto Dokumentasi <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {uploadedCount > 0 ? (
                  <span className="text-emerald-600 font-semibold">{uploadedCount} foto terunggah</span>
                ) : "Belum ada foto yang diunggah"}
              </p>
            </div>

            {/* Bulk upload button */}
            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBulkUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
              >
                <FiUpload size={15} /> Upload Banyak Sekaligus
              </button>
            </div>
          </div>

          {/* Error message */}
          {formErrors.gallery && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm font-medium">
              <FiX size={16} className="shrink-0" />
              {formErrors.gallery}
            </div>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Uploaded / empty slots */}
            {form.gallery.map((url, i) => (
              <PhotoSlot
                key={i}
                url={url}
                index={i}
                onUpload={handlePhotoUpload}
                onRemove={removePhoto}
              />
            ))}

            {/* "Add slot" button */}
            <button
              type="button"
              onClick={addEmptySlot}
              className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-on-surface-variant/50 hover:text-primary group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-variant/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <FiPlus size={20} />
              </div>
              <span className="text-xs font-semibold">Tambah Slot</span>
            </button>
          </div>

          <p className="text-xs text-on-surface-variant/60">
            💡 Tip: Gunakan tombol "Upload Banyak Sekaligus" untuk memilih beberapa foto sekaligus dari galeri kamu.
          </p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={(e) => handleBackNavigation(e, "/admin/dokumentasi")}
          className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-variant/30 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSave size={18} />
          )}
          {isLoading ? "Menyimpan..." : "Simpan Dokumentasi"}
        </button>
      </div>
    </form>

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-outline-variant/20"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiAlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Perubahan Belum Disimpan</h3>
              <p className="text-on-surface-variant text-sm mb-8">Apakah kamu yakin ingin keluar? Semua isian pada form ini akan hilang jika belum disimpan.</p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-variant hover:bg-outline-variant transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingUrl) router.push(pendingUrl);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
