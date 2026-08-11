"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/ImageUpload";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <p className="text-sm text-on-surface-variant p-4">Memuat editor...</p> });

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

const CATEGORIES = ["Berita", "Artikel", "Rilis", "Kampus", "Pendidikan", "Mahasiswa", "Event"];

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function BeritaForm({ initialData = null }: { initialData?: any }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    category: initialData?.category || "Berita",
    image_url: initialData?.image_url || "",
    tags: initialData?.tags?.join(", ") || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    is_published: initialData?.is_published ?? true,
  });

  // Auto-slug from title
  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: generateSlug(val),
    }));
    setIsDirty(true);
    if (formErrors.title) setFormErrors((e) => { const n = {...e}; delete n.title; return n; });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (formErrors[field]) setFormErrors((e) => { const n = {...e}; delete n[field]; return n; });
  };

  // Warn on unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Draft loading — hanya muat draft jika halaman di-refresh, bukan navigasi baru
  useEffect(() => {
    if (!initialData) {
      // Cek apakah ini refresh (sessionStorage punya flag) atau navigasi baru
      const isRefresh = sessionStorage.getItem("berita_form_active");
      if (isRefresh) {
        const draft = localStorage.getItem("berita_draft");
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            setFormData(parsed);
            setIsDirty(true);
          } catch (e) {}
        }
      }
      // Tandai bahwa form ini aktif (untuk deteksi refresh berikutnya)
      sessionStorage.setItem("berita_form_active", "true");
    }
    
    // Hapus draft & flag saat user menekan tombol Back browser
    const handlePopState = () => {
      localStorage.removeItem("berita_draft");
      sessionStorage.removeItem("berita_form_active");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialData]);

  // Draft saving
  useEffect(() => {
    if (!initialData && isDirty) {
      localStorage.setItem("berita_draft", JSON.stringify(formData));
    }
  }, [formData, initialData, isDirty]);

  const clearDraft = () => {
    localStorage.removeItem("berita_draft");
    sessionStorage.removeItem("berita_form_active");
  };

  const handleBackNavigation = (e: React.MouseEvent, url: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingUrl(url);
      setShowLeaveConfirm(true);
    } else {
      clearDraft();
      router.push(url);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Judul wajib diisi";
    if (!formData.slug.trim()) errors.slug = "Slug wajib diisi";
    if (!formData.category) errors.category = "Kategori wajib dipilih";
    if (!formData.image_url.trim()) errors.image_url = "Gambar banner wajib diunggah";
    if (!formData.excerpt.trim()) errors.excerpt = "Ringkasan wajib diisi";
    const strippedContent = formData.content.replace(/<[^>]*>?/gm, '').trim();
    if (!strippedContent) errors.content = "Isi konten berita wajib diisi";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("Harap lengkapi semua kolom yang wajib diisi.", "error");
      // Scroll to first error
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);
    let finalTags = formData.tags;
    if (!finalTags.trim()) {
      // Auto-generate tags from title and content
      const textToAnalyze = (formData.title + " " + formData.content.replace(/<[^>]*>?/gm, ' ').replace(/&[a-z]+;/g, ' ')).toLowerCase();
      const words = textToAnalyze.replace(/[^\w\s]/g, '').split(/\s+/);
      
      const stopWords = new Set(['dan', 'atau', 'tetapi', 'yang', 'di', 'ke', 'dari', 'pada', 'dalam', 'untuk', 'dengan', 'ini', 'itu', 'adalah', 'sebagai', 'tidak', 'akan', 'bisa', 'ada', 'juga', 'oleh', 'kepada']);
      
      const wordCounts: Record<string, number> = {};
      words.forEach(w => {
        if (w.length > 3 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
      
      const topWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));
        
      finalTags = topWords.join(", ");
    }

    try {
      const payload = {
        ...formData,
        tags: finalTags.split(",").map((t: string) => t.trim()).filter(Boolean),
      };

      const res = await fetch("/api/admin/berita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: initialData?.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan berita");
      }

      if (!initialData) localStorage.removeItem("berita_draft");
      setIsDirty(false);
      toast("Berita berhasil disimpan!", "success");
      router.push("/admin/berita");
    } catch (err: any) {
      toast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
      formErrors[field]
        ? "border-red-400 bg-red-50 focus:border-red-400"
        : "border-outline-variant/30 focus:border-primary"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={(e) => handleBackNavigation(e, "/admin/berita")}
          className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
            {initialData ? "Edit Berita" : "Tambah Berita Baru"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Lengkapi form di bawah ini.</p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">

        {/* Publikasi Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/20">
          <div>
            <p className="font-bold text-sm text-on-surface">Status Publikasi</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {formData.is_published ? "Berita akan tampil di website" : "Berita disimpan sebagai draft"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange("is_published", !formData.is_published)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
              formData.is_published ? "bg-emerald-500" : "bg-outline-variant/40"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                formData.is_published ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Judul */}
        <div id="field-title" className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Judul Berita <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={inputClass("title")}
            placeholder="Masukkan judul berita yang menarik"
          />
          {formErrors.title && <p className="text-xs text-red-500 font-medium">{formErrors.title}</p>}
        </div>

        {/* Slug + Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="field-slug" className="space-y-2">
            <label className="text-sm font-bold text-on-surface flex items-center gap-2">
              Slug (URL) <span className="text-red-500">*</span>
              <span className="text-[10px] font-normal text-on-surface-variant bg-surface-variant/30 px-2 py-0.5 rounded-full">Otomatis</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              readOnly
              className={inputClass("slug") + " bg-surface-variant/20 text-on-surface-variant cursor-not-allowed"}
              placeholder="judul-berita-anda"
            />
            {formErrors.slug && <p className="text-xs text-red-500 font-medium">{formErrors.slug}</p>}
          </div>

          <div id="field-category" className="space-y-2">
            <label className="text-sm font-bold text-on-surface">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={inputClass("category")}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formErrors.category && <p className="text-xs text-red-500 font-medium">{formErrors.category}</p>}
          </div>
        </div>

        {/* Gambar Banner */}
        <div id="field-image_url" className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Gambar Banner <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => handleChange("image_url", url)}
              className="shrink-0"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-on-surface-variant">Atau paste URL gambar langsung:</p>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => handleChange("image_url", e.target.value)}
                className={`${inputClass("image_url")} text-xs`}
                placeholder="https://..."
              />
              {formErrors.image_url && <p className="text-xs text-red-500 font-medium">{formErrors.image_url}</p>}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Tags <span className="text-on-surface-variant font-normal">(pisahkan dengan koma, atau kosongkan untuk diisi otomatis)</span></label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            className={inputClass("tags")}
            placeholder="Teknologi, Kampus, Inovasi"
          />
        </div>

        {/* Ringkasan */}
        <div id="field-excerpt" className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Ringkasan (Excerpt) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
            rows={3}
            className={inputClass("excerpt") + " resize-none"}
            placeholder="Tuliskan ringkasan singkat berita yang menarik perhatian pembaca..."
          />
          {formErrors.excerpt && <p className="text-xs text-red-500 font-medium">{formErrors.excerpt}</p>}
        </div>

        {/* Isi Konten */}
        <div id="field-content" className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Isi Konten Berita <span className="text-red-500">*</span>
          </label>
          <div className={`${formErrors.content ? 'ring-2 ring-red-400 rounded-lg' : ''}`}>
            <ReactQuill 
              theme="snow"
              value={formData.content}
              onChange={(val) => handleChange("content", val === "<p><br></p>" ? "" : val)}
              modules={QUILL_MODULES}
              className="bg-surface rounded-xl overflow-hidden [&_.ql-toolbar]:border-outline-variant/30 [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-outline-variant/30 [&_.ql-container]:rounded-b-xl [&_.ql-editor]:min-h-[300px]"
              placeholder="Tuliskan isi berita di sini..."
            />
          </div>
          {formErrors.content && <p className="text-xs text-red-500 font-medium">{formErrors.content}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={(e) => handleBackNavigation(e, "/admin/berita")}
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
          {isLoading ? "Menyimpan..." : "Simpan Berita"}
        </button>
      </div>

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
              <p className="text-on-surface-variant text-sm mb-8">
                Apakah kamu yakin ingin keluar? Semua isian yang belum disimpan akan hilang.
              </p>
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
                    clearDraft();
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
    </form>
  );
}
