"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiSave,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEdit3,
  FiImage,
  FiTag,
  FiInfo,
  FiHelpCircle,
  FiBold,
  FiItalic,
  FiList,
  FiLink,
  FiCode,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import ImageUpload from "@/components/ui/ImageUpload";
import { ArticleItem } from "./ArticleCard";

const CATEGORIES = [
  "Opini & Esai",
  "Teknologi & AI",
  "Akademik & Riset",
  "Prestasi Mahasiswa",
  "Kegiatan Kampus",
  "Tips & Karir",
  "Seni & Budaya",
  "Lainnya",
];

const RESERVED_SLUGS = ["baru", "edit", "admin", "api", "login", "masuk", "dashboard"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

interface ArticleFormProps {
  initialData?: ArticleItem | null;
  mode: "new" | "edit" | "revision";
}

export default function ArticleForm({ initialData, mode }: ArticleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const isNew = mode === "new";
  const isRevision = mode === "revision";
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugManual, setSlugManual] = useState(Boolean(initialData?.slug));
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_url || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate slug dari judul jika belum manual diubah
  useEffect(() => {
    if (!slugManual && isNew) {
      setSlug(slugify(title));
    }
  }, [title, slugManual, isNew]);

  // Perhitungan karakter dan kata
  const titleLen = title.trim().length;
  const contentLen = content.trim().length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Validasi form
  const isTitleValid = titleLen >= 10 && titleLen <= 120;
  const isContentValid = contentLen >= 300 && contentLen <= 20000;
  const isSlugValid =
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 80 &&
    !RESERVED_SLUGS.includes(slug);

  // Helper untuk formatting toolbar
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("article-content-input") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + (selectedText || "teks") + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 50);
  };

  const handleSubmit = async (targetStatus: "draft" | "pending") => {
    setErrorMessage(null);

    // Validasi untuk pengajuan review
    if (targetStatus === "pending") {
      if (!isTitleValid) {
        setErrorMessage("Judul artikel wajib antara 10 hingga 120 karakter.");
        return;
      }
      if (!isSlugValid && !isRevision) {
        setErrorMessage("Slug hanya boleh berupa huruf kecil, angka, dan tanda hubung (-), maksimal 80 karakter.");
        return;
      }
      if (!isContentValid) {
        setErrorMessage("Isi artikel wajib minimal 300 karakter untuk diajukan ke admin (saat ini: " + contentLen + " karakter).");
        return;
      }
    } else {
      // Validasi minimal untuk draft
      if (titleLen === 0) {
        setErrorMessage("Silakan isi judul sebelum menyimpan draf.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast("Sesi masuk Anda telah berakhir. Silakan login kembali.", "error");
        router.push("/masuk");
        return;
      }

      if (isRevision && initialData) {
        // Alur Pengajuan Revisi Artikel Tayang (Tabel article_revisions)
        const { error: revError } = await supabase
          .from("article_revisions")
          .insert({
            article_id: initialData.id,
            author_id: user.id,
            title: title.trim(),
            content: content.trim(),
            cover_url: coverUrl || null,
            category: category,
            status: targetStatus,
            submitted_at: targetStatus === "pending" ? new Date().toISOString() : null,
          });

        if (revError) throw revError;

        toast(
          targetStatus === "pending"
            ? "Revisi artikel berhasil diajukan untuk dimoderasi admin!"
            : "Draf revisi berhasil disimpan.",
          "success"
        );
        router.push("/dashboard/artikel");
        router.refresh();
      } else if (isEdit && initialData) {
        // Alur Update Artikel Draf atau Rejected
        const updatePayload: Record<string, any> = {
          title: title.trim(),
          content: content.trim(),
          cover_url: coverUrl || null,
          category: category,
          status: targetStatus,
          updated_at: new Date().toISOString(),
        };

        // Jika diajukan pending, set submitted_at dan reset review_note
        if (targetStatus === "pending") {
          updatePayload.submitted_at = new Date().toISOString();
          updatePayload.review_note = null;
        }

        // Slug hanya bisa diedit jika draf/rejected
        if (slug) {
          updatePayload.slug = slug.trim();
        }

        const { error: updateError } = await supabase
          .from("articles")
          .update(updatePayload)
          .eq("id", initialData.id)
          .eq("author_id", user.id);

        if (updateError) throw updateError;

        toast(
          targetStatus === "pending"
            ? "Artikel berhasil diajukan untuk dimoderasi admin!"
            : "Perubahan draf berhasil disimpan.",
          "success"
        );
        router.push("/dashboard/artikel");
        router.refresh();
      } else {
        // Alur Buat Artikel Baru
        const finalSlug = slug || slugify(title);

        const { error: insertError } = await supabase
          .from("articles")
          .insert({
            author_id: user.id,
            title: title.trim(),
            slug: finalSlug,
            content: content.trim(),
            cover_url: coverUrl || null,
            category: category,
            status: targetStatus,
            submitted_at: targetStatus === "pending" ? new Date().toISOString() : null,
          });

        if (insertError) throw insertError;

        toast(
          targetStatus === "pending"
            ? "Artikel baru berhasil diajukan untuk moderasi admin!"
            : "Draf artikel berhasil disimpan.",
          "success"
        );
        router.push("/dashboard/artikel");
        router.refresh();
      }
    } catch (err: any) {
      console.error("[ArticleForm] Submit error:", err);
      const msg = err.message || "Terjadi kesalahan saat menyimpan artikel.";
      // Tangani pesan kuota dari PostgreSQL trigger
      if (msg.includes("Batas maksimal 10 draf")) {
        setErrorMessage("Anda telah mencapai batas maksimal 10 draf. Harap ajukan atau hapus draf yang ada.");
      } else if (msg.includes("Batas maksimal 3 pengajuan")) {
        setErrorMessage("Anda telah memiliki 3 artikel yang sedang menunggu moderasi. Mohon tunggu proses review admin selesai.");
      } else if (msg.includes("Batas harian 5 pengajuan")) {
        setErrorMessage("Kuota harian Anda telah mencapai batas maksimal (5 pengajuan per hari). Silakan coba lagi besok.");
      } else if (msg.includes("duplicate key") || msg.includes("slug")) {
        setErrorMessage("Slug tautan ini sudah digunakan oleh artikel lain. Silakan ubah judul atau sesuaikan slug.");
      } else {
        setErrorMessage(msg);
      }
      toast("Gagal memproses artikel. Silakan periksa pesan kesalahan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/dashboard/artikel"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <FiArrowLeft size={16} />
          <span>Kembali ke Dashboard</span>
        </Link>

        <div className="text-xs text-on-surface-variant font-medium">
          Perkiraan baca: <span className="font-bold text-primary">{readingTime} menit</span> ({wordCount} kata)
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-on-surface leading-tight">
          {isNew && "Tulis Artikel Mahasiswa Baru"}
          {isEdit && "Edit Artikel"}
          {isRevision && "Ajukan Revisi Artikel Tayang"}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {isNew && "Bagikan karya pemikiran, wawasan teknologi, opini, atau kegiatan kampus Tazkia ke publik."}
          {isEdit && "Perbaiki konten draf Anda atau sesuaikan dengan masukan catatan review dari admin."}
          {isRevision && "Artikel publik Anda tetap tayang tanpa gangguan selagi admin meninjau revisi yang Anda ajukan."}
        </p>

        {/* Catatan Review Jika Rejected */}
        {initialData?.status === "rejected" && initialData.review_note && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <div className="flex items-start gap-2.5">
              <FiAlertCircle className="text-rose-600 text-base shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Catatan Moderasi Admin Sebelumnya:</p>
                <p className="text-xs mt-1 leading-relaxed bg-surface/60 p-2.5 rounded-lg border border-rose-500/10">
                  {initialData.review_note}
                </p>
                <p className="text-[11px] text-rose-600/80 mt-1.5">
                  Tips: Perbaiki poin-poin yang diminta di atas sebelum mengklik <strong>Ajukan untuk Moderasi</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alert Info Jika Mode Revisi */}
        {isRevision && (
          <div className="mt-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-start gap-2.5 text-xs">
            <FiInfo className="text-blue-600 text-sm shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mode Revisi Terproteksi (PRD 6.1):</p>
              <p className="mt-0.5 text-blue-600/90 leading-relaxed">
                Perubahan pada halaman ini tidak akan langsung menimpa artikel tayang. Admin akan memeriksa revisi ini sebelum memperbarui artikel secara publik.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs sm:text-sm animate-shake">
          <FiAlertCircle className="text-rose-600 text-base shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Perhatian: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="space-y-6">
        {/* Judul Artikel */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label htmlFor="article-title" className="text-xs sm:text-sm font-bold text-on-surface">
              Judul Artikel <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[11px] font-semibold ${isTitleValid ? "text-emerald-600" : "text-on-surface-variant"}`}>
              {titleLen} / 120 karakter (min. 10)
            </span>
          </div>
          <input
            id="article-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Mengembangkan Agen Cerdas AI di Lingkungan Kampus STMIK Tazkia"
            className="w-full px-4 py-3 rounded-xl bg-surface-variant/20 border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-sm sm:text-base outline-none transition-all placeholder:text-on-surface-variant/40"
            maxLength={120}
          />

          {/* Slug Tautan URL */}
          {!isRevision && (
            <div className="mt-3.5 pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
                <span className="shrink-0 font-medium text-on-surface-variant/70">Slug URL:</span>
                {slugManual ? (
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-surface-variant/30 border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary w-full max-w-sm"
                    placeholder="slug-artikel"
                  />
                ) : (
                  <span className="font-mono text-primary truncate">/artikel/{slug || "slug-otomatis"}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSlugManual(!slugManual)}
                className="text-[11px] font-bold text-primary hover:underline shrink-0"
              >
                {slugManual ? "Kunci Otomatis" : "Ubah Slug Manual"}
              </button>
            </div>
          )}
        </div>

        {/* Kategori & Gambar Sampul */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kategori */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <label htmlFor="article-category" className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5 mb-2">
                <FiTag className="text-primary" />
                <span>Kategori Artikel</span>
              </label>
              <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                Pilih topik yang paling mewakili tulisan Anda agar mudah ditemukan pembaca.
              </p>
              <select
                id="article-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/40 focus:border-primary text-on-surface text-xs sm:text-sm outline-none transition-all font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-surface-variant/30 text-[11px] text-on-surface-variant">
              Kategori aktif: <span className="font-bold text-primary">{category}</span>
            </div>
          </div>

          {/* Gambar Sampul (Cover) */}
          <div className="md:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm">
            <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5 mb-2">
              <FiImage className="text-primary" />
              <span>Gambar Sampul (Cover Image)</span>
            </label>
            <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
              Unggah gambar landscape resolusi tinggi (maks 2MB, JPG/PNG/WebP) atau masukkan tautan URL gambar langsung.
            </p>

            <ImageUpload
              value={coverUrl}
              onChange={(url) => setCoverUrl(url)}
              folder="artikel"
            />
          </div>
        </div>

        {/* Konten Artikel */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          {/* Header Editor: Tabs & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-1 bg-surface-variant/30 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "write"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <FiEdit3 size={13} />
                <span>Tulis</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <FiEye size={13} />
                <span>Pratinjau Tampilan</span>
              </button>
            </div>

            {/* Character & Validity Counter */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  isContentValid
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {contentLen} / 20.000 karakter (min. 300)
              </span>
            </div>
          </div>

          {activeTab === "write" ? (
            <div>
              {/* Markdown Quick Toolbar */}
              <div className="flex flex-wrap items-center gap-1 mb-2 bg-surface-variant/20 p-1.5 rounded-xl border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**")}
                  title="Tebal (Bold)"
                  className="p-1.5 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center gap-1"
                >
                  <FiBold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*")}
                  title="Miring (Italic)"
                  className="p-1.5 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center gap-1"
                >
                  <FiItalic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("### ", "")}
                  title="Subjudul (Heading 3)"
                  className="p-1.5 px-2 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs font-bold"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("- ", "")}
                  title="Daftar Poin (List)"
                  className="p-1.5 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center gap-1"
                >
                  <FiList size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("> ", "")}
                  title="Kutipan (Quote)"
                  className="p-1.5 px-2 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs font-serif italic"
                >
                  “Quote”
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("`", "`")}
                  title="Kode Singkat"
                  className="p-1.5 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center gap-1 font-mono"
                >
                  <FiCode size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("[Teks Tautan](", ")")}
                  title="Sisipkan Tautan (Link)"
                  className="p-1.5 rounded-lg hover:bg-surface text-on-surface-variant hover:text-primary transition-colors text-xs flex items-center gap-1"
                >
                  <FiLink size={13} />
                </button>
              </div>

              {/* Textarea Input */}
              <textarea
                id="article-content-input"
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mulai menulis artikel Anda di sini... Gunakan format Markdown untuk menyusun paragraf, subjudul, daftar poin, dan kutipan pemikiran Anda."
                className="w-full p-4 rounded-xl bg-surface-variant/20 border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-sm sm:text-base outline-none transition-all placeholder:text-on-surface-variant/40 font-mono leading-relaxed resize-y min-h-[320px]"
                maxLength={20000}
              />
            </div>
          ) : (
            /* Live Markdown / Article Preview */
            <div className="p-4 sm:p-6 rounded-xl bg-surface-variant/10 border border-outline-variant/30 min-h-[320px] prose dark:prose-invert max-w-none">
              {coverUrl && (
                <div className="mb-6 rounded-xl overflow-hidden max-h-80 border border-outline-variant/30">
                  <img src={coverUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-4">
                {title || "Judul Artikel Akan Ditampilkan di Sini"}
              </h1>
              <div className="text-xs text-on-surface-variant flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
                <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-md">
                  {category}
                </span>
                <span>•</span>
                <span>{readingTime} menit baca</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-on-surface space-y-4">
                {content ? (
                  content
                ) : (
                  <p className="italic text-on-surface-variant/50">
                    Belum ada teks artikel. Ketik di tab "Tulis" untuk melihat pratinjau di sini.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/dashboard/artikel"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-variant/30 text-xs sm:text-sm font-bold transition-colors text-center"
          >
            Batal & Kembali
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Tombol Simpan Draf */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-variant/50 hover:bg-surface-variant text-on-surface border border-outline-variant/40 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <FiSave size={15} />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Draf"}</span>
            </button>

            {/* Tombol Ajukan ke Admin */}
            <button
              type="button"
              disabled={isSubmitting || !isTitleValid || !isContentValid}
              onClick={() => handleSubmit("pending")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiSend size={15} />
              <span>{isSubmitting ? "Mengajukan..." : isRevision ? "Ajukan Revisi" : "Ajukan untuk Moderasi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

