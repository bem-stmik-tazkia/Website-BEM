"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FiX,
  FiEdit2,
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
  FiTrash2,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { notifyArticleModerated } from "@/actions/telegram-notifications";
import { unpublishArticleAdmin, deleteArticleAdmin } from "@/app/(internal)/admin/artikel/actions";

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
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [revisionViewMode, setRevisionViewMode] = useState<"new" | "diff">("new");

  if (!item) return null;

  const articleItem = isRevisionItem ? (item as ModerationRevision).article : (item as ModerationArticle);
  const revisionItem = isRevisionItem ? (item as ModerationRevision) : null;
  const author = item.author;

  const isOfficialBem =
    author?.full_name?.toLowerCase().includes("bem") ||
    author?.email?.includes("bem@stmik.tazkia.ac.id");
  const authorAvatar = author?.avatar_url || (isOfficialBem ? "/images/logo2.webp" : null);

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

      // Notifikasi Telegram Approval
      notifyArticleModerated({
        title: item.title,
        action: "approved",
        category: item.category || undefined,
        authorName: author?.full_name || undefined,
        slug: 'slug' in item ? item.slug : (item.article?.slug || undefined),
        isRevision: isRevisionItem,
      }).catch((err) => console.warn("[Telegram] Gagal kirim notif approve:", err));

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

      // Notifikasi Telegram Rejection / Evaluasi
      notifyArticleModerated({
        title: item.title,
        action: "rejected",
        category: item.category || undefined,
        note: rejectNote.trim(),
        authorName: author?.full_name || undefined,
        slug: 'slug' in item ? item.slug : (item.article?.slug || undefined),
        isRevision: isRevisionItem,
      }).catch((err) => console.warn("[Telegram] Gagal kirim notif reject:", err));

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Reject error:", err);
      toast(err.message || "Gagal menolak artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler Unpublish (Menurunkan dari publik ke draf tanpa error updated_at)
  const handleUnpublish = async () => {
    try {
      setIsProcessing(true);
      const res = await unpublishArticleAdmin(item.id);
      if (res.error) {
        // Fallback to rpc jika server action terkendala
        const { error: rpcErr } = await supabase.rpc("admin_unpublish_article", {
          p_article_id: item.id,
        });
        if (rpcErr) throw new Error(res.error || rpcErr.message);
      }

      // Notifikasi Telegram Unpublish
      notifyArticleModerated({
        title: item.title,
        action: "unpublished",
        category: item.category || undefined,
        authorName: author?.full_name || undefined,
        slug: 'slug' in item ? item.slug : (item.article?.slug || undefined),
      }).catch((err) => console.warn("[Telegram] Gagal kirim notif unpublish:", err));

      toast("Artikel berhasil diturunkan (unpublish) dari publik.", "info");
      setShowUnpublishConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Unpublish error:", err);
      toast(err.message || "Gagal menurunkan artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler Delete Permanen
  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      const articleId = isRevisionItem ? (item as ModerationRevision).article_id : item.id;
      const res = await deleteArticleAdmin(articleId);
      if (res.error) throw new Error(res.error);

      toast("Artikel berhasil dihapus permanen.", "success");
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[Moderation] Delete error:", err);
      toast(err.message || "Gagal menghapus artikel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = item.content ? item.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
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
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="Author" className="w-full h-full object-cover" />
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
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 overflow-hidden">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 pb-2 border-b border-amber-500/20">
                    Artikel Saat Ini (Live di Publik)
                  </div>
                  <h3 className="font-bold text-sm text-on-surface mb-2 break-words [overflow-wrap:anywhere]">{articleItem.title}</h3>
                  <div className="text-xs text-on-surface-variant whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed max-h-96 overflow-y-auto">
                    {articleItem.content}
                  </div>
                </div>

                {/* Kolom Kanan: Revisi Baru */}
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 overflow-hidden">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2 pb-2 border-b border-purple-500/20">
                    Revisi Baru yang Diajukan
                  </div>
                  <h3 className="font-bold text-sm text-on-surface mb-2 break-words [overflow-wrap:anywhere]">{item.title}</h3>
                  <div className="text-xs text-on-surface-variant whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed max-h-96 overflow-y-auto">
                    {item.content}
                  </div>
                </div>
              </div>
            ) : (
              /* Tampilan Konten Standar */
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-on-surface leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] p-4 rounded-2xl bg-surface-variant/10 border border-outline-variant/20">
                {item.content}
              </div>
            )}

            {/* Input Catatan Evaluasi Penolakan */}
            {showRejectInput && (
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <FiAlertTriangle size={15} />
                    <span>Catatan Evaluasi / Alasan Penolakan (Wajib Edukatif)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Batal
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Jelaskan kepada mahasiswa aspek tulisan yang perlu diperbaiki agar mereka dapat mengedit dan mengajukan ulang dengan kualitas lebih baik.
                </p>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Gagasan artikel sudah baik, namun mohon lengkapi sumber referensi data pada paragraf kedua dan perbaiki beberapa ejaan penulisan..."
                  className="w-full p-3 rounded-xl bg-surface border border-rose-500/30 text-xs sm:text-sm text-on-surface outline-none focus:border-rose-500 transition-all"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={noteLength < 10 || noteLength > 500 ? "text-rose-500 font-bold" : "text-emerald-600"}>
                    {noteLength}/500 karakter {noteLength < 10 ? "(Minimal 10 karakter)" : ""}
                  </span>
                  <button
                    type="button"
                    disabled={!isNoteValid || isProcessing}
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-rose-600/20"
                  >
                    {isProcessing ? "Memproses..." : "Konfirmasi Tolak / Minta Revisi"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Bottom Action Footer */}
          <div className="px-6 py-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 bg-surface-variant/20 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                Tutup
              </button>

              {/* Tombol Hapus Permanen */}
              {!isRevisionItem && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  title="Hapus Artikel Secara Permanen"
                >
                  <FiTrash2 size={14} />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Aksi jika artikel masih DRAF */}
              {!isRevisionItem && item.status === "draft" && (
                <>
                  <Link
                    href={`/dashboard/artikel/${item.id}/edit?from=admin`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-variant hover:bg-surface-variant/80 text-on-surface border border-outline-variant/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <FiEdit2 size={14} className="text-primary" />
                    <span>Edit Draf Ini</span>
                  </Link>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <FiCheckCircle size={15} />
                    <span>{isProcessing ? "Memproses..." : "Terbitkan Sekarang"}</span>
                  </button>
                </>
              )}

              {/* Tombol Unpublish jika artikel sudah tayang */}
              {!isRevisionItem && item.status === "published" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowUnpublishConfirm(true)}
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

      {/* Modal Popup Konfirmasi Unpublish (In-App React Dialog, Tanpa Browser Alert) */}
      {showUnpublishConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <FiAlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-on-surface">Konfirmasi Turunkan Artikel</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Apakah Anda yakin ingin menurunkan artikel <strong>"{item.title}"</strong> dari publik? Mahasiswa dapat mengedit ulang tulisan ini sebagai draf.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowUnpublishConfirm(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleUnpublish}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? "Memproses..." : "Ya, Turunkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Konfirmasi Hapus (In-App React Dialog) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-on-surface">Hapus Artikel Permanen</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus artikel <strong>"{item.title}"</strong> secara permanen? Data yang sudah dihapus tidak dapat dipulihkan.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
