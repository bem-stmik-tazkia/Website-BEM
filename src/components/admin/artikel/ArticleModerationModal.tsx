"use client";

import React, { useState } from "react";
import {
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiEye,
  FiUser,
  FiCalendar,
  FiClock,
  FiTag,
  FiExternalLink,
  FiSend,
  FiLayers,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

export interface ModerationArticle {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_url: string | null;
  category: string | null;
  status: string;
  review_note?: string | null;
  submitted_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  views?: number;
  likes?: number;
  author?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ModerationRevision {
  id: string;
  article_id: string;
  author_id: string;
  title: string;
  content: string;
  cover_url: string | null;
  category: string | null;
  status: string;
  review_note?: string | null;
  submitted_at?: string | null;
  created_at: string;
  article?: ModerationArticle | null;
  author?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  item: ModerationArticle | ModerationRevision | null;
  isRevisionItem?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArticleModerationModal({
  item,
  isRevisionItem = false,
  onClose,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const supabase = createClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [revisionViewMode, setRevisionViewMode] = useState<"new" | "diff">("new");

  if (!item) return null;

  const articleItem = isRevisionItem ? (item as ModerationRevision).article : (item as ModerationArticle);
  const revisionItem = isRevisionItem ? (item as ModerationRevision) : null;
  const author = item.author;

  const noteLength = rejectNote.trim().length;
  const isNoteValid = noteLength >= 10 && noteLength <= 500;

  // Handler Approve
  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      if (isRevisionItem && revisionItem) {
        const { error } = await supabase.rpc("admin_approve_revision", {
          p_revision_id: revisionItem.id,
        });
        if (error) throw error;
        toast("Revisi artikel berhasil disetujui dan diperbarui ke publik!", "success");
      } else {
        const { error } = await supabase.rpc("admin_approve_article", {
          p_article_id: item.id,
        });
        if (error) throw error;
        toast("Artikel berhasil disetujui dan resmi dipublikasikan!", "success");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Approve error:", err);
      toast(err.message || "Gagal menyetujui artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler Reject
  const handleReject = async () => {
    if (!isNoteValid) {
      toast("Catatan penolakan wajib antara 10 hingga 500 karakter.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      if (isRevisionItem && revisionItem) {
        const { error } = await supabase.rpc("admin_reject_revision", {
          p_revision_id: revisionItem.id,
          p_note: rejectNote.trim(),
        });
        if (error) throw error;
        toast("Revisi artikel telah ditolak dengan catatan evaluasi.", "info");
      } else {
        const { error } = await supabase.rpc("admin_reject_article", {
          p_article_id: item.id,
          p_note: rejectNote.trim(),
        });
        if (error) throw error;
        toast("Artikel telah ditolak dan dikembalikan ke mahasiswa untuk revisi.", "info");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Reject error:", err);
      toast(err.message || "Gagal menolak artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler Unpublish
  const handleUnpublish = async () => {
    if (!confirm("Apakah Anda yakin ingin menurunkan artikel ini dari publik? Mahasiswa dapat mengedit ulang tulisan ini.")) {
      return;
    }

    try {
      setIsProcessing(true);
      const { error } = await supabase.rpc("admin_unpublish_article", {
        p_article_id: item.id,
      });
      if (error) throw error;
      toast("Artikel berhasil diturunkan (unpublish) dari publik.", "info");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Unpublish error:", err);
      toast(err.message || "Gagal menurunkan artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = item.content ? item.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-surface border border-outline-variant/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between gap-4 bg-surface-variant/20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                isRevisionItem
                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                  : item.status === "pending"
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : item.status === "published"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
              }`}
            >
              {isRevisionItem ? "Revisi Tayang" : item.status}
            </span>
            <span className="text-xs text-on-surface-variant hidden sm:inline">•</span>
            <h2 className="text-sm sm:text-base font-extrabold text-on-surface truncate">
              {isRevisionItem ? "Moderasi Revisi Konten" : "Moderasi Artikel Mahasiswa"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-variant/40 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Penulis & Info Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{author?.full_name?.charAt(0) || "M"}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">{author?.full_name || "Mahasiswa Tazkia"}</p>
                <p className="text-xs text-on-surface-variant truncate">{author?.email || "Akun Mahasiswa"}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              {item.category && (
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                  <FiTag size={11} />
                  <span>{item.category}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <FiClock size={12} />
                <span>{wordCount} kata (~{readingTime} mnt)</span>
              </span>
            </div>
          </div>

          {/* Toggle View Mode Jika Revisi */}
          {isRevisionItem && articleItem && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
                <FiLayers size={15} />
                <span>Perbandingan Konten Revisi vs Artikel Asli</span>
              </div>
              <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setRevisionViewMode("new")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    revisionViewMode === "new" ? "bg-purple-600 text-white" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Konten Revisi Baru
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionViewMode("diff")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    revisionViewMode === "diff" ? "bg-purple-600 text-white" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Bandingkan Perubahan
                </button>
              </div>
            </div>
          )}

          {/* Cover Gambar */}
          {item.cover_url && (
            <div className="rounded-2xl overflow-hidden max-h-80 border border-outline-variant/30 bg-surface-variant/10">
              <img src={item.cover_url} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Judul & Slug */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface leading-snug">
              {item.title}
            </h1>
            {!isRevisionItem && (item as ModerationArticle).slug && (
              <p className="text-xs font-mono text-primary mt-1.5">
                URL publik: /artikel/{(item as ModerationArticle).slug}
              </p>
            )}
          </div>

          {/* Diff Mode (Jika sedang membandingkan revisi) */}
          {isRevisionItem && revisionViewMode === "diff" && articleItem ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: Artikel Asli */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 pb-2 border-b border-amber-500/20">
                  Artikel Saat Ini (Live di Publik)
                </div>
                <h3 className="font-bold text-sm text-on-surface mb-2">{articleItem.title}</h3>
                <div className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {articleItem.content}
                </div>
              </div>

              {/* Kolom Kanan: Revisi Baru */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2 pb-2 border-b border-purple-500/20">
                  Ajuan Revisi Mahasiswa (Menunggu Persetujuan)
                </div>
                <h3 className="font-bold text-sm text-on-surface mb-2">{item.title}</h3>
                <div className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-medium">
                  {item.content}
                </div>
              </div>
            </div>
          ) : (
            /* Regular Content Renderer */
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-variant/10 border border-outline-variant/20 whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-on-surface">
              {item.content}
            </div>
          )}

          {/* Form Input Catatan Penolakan (Jika tombol Tolak ditekan) */}
          {showRejectInput && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <FiAlertTriangle />
                  <span>Catatan Evaluasi / Alasan Penolakan (Wajib 10–500 karakter)</span>
                </label>
                <span className={`text-[11px] font-semibold ${isNoteValid ? "text-emerald-600" : "text-rose-500"}`}>
                  {noteLength} / 500 karakter
                </span>
              </div>
              <textarea
                rows={4}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Tuliskan catatan perbaikan dengan jelas dan edukatif kepada mahasiswa (minimal 10 karakter). Contoh: 'Mohon perbaiki gaya bahasa pada paragraf 2 dan sertakan sumber referensi riset kampus.'"
                className="w-full p-3 rounded-xl bg-surface border border-rose-300 dark:border-rose-700 text-on-surface text-xs sm:text-sm outline-none focus:border-rose-500"
                maxLength={500}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-rose-300/40 text-xs font-semibold hover:bg-rose-500/20"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!isNoteValid || isProcessing}
                  onClick={handleReject}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? "Memproses..." : "Konfirmasi Tolak / Minta Revisi"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 bg-surface-variant/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-variant/40 transition-colors"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Unpublish jika artikel sudah tayang */}
            {!isRevisionItem && item.status === "published" && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleUnpublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <FiAlertTriangle size={14} />
                <span>Turunkan Artikel (Unpublish)</span>
              </button>
            )}

            {/* Tombol Tolak / Minta Revisi */}
            {(item.status === "pending" || isRevisionItem) && !showRejectInput && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowRejectInput(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <FiXCircle size={15} />
                <span>Tolak / Minta Revisi</span>
              </button>
            )}

            {/* Tombol Setujui */}
            {(item.status === "pending" || isRevisionItem) && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <FiCheckCircle size={15} />
                <span>{isProcessing ? "Memproses..." : "Setujui & Publikasikan"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

