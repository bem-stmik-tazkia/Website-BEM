"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import {
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiTag,
} from "react-icons/fi";
import ArticleStatusBadge, { ArticleStatus } from "./ArticleStatusBadge";

export interface ArticleItem {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_url: string | null;
  category: string | null;
  status: ArticleStatus | string;
  review_note: string | null;
  reviewed_by: string | null;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Props {
  article: ArticleItem;
  onOpenReviewNote: (article: ArticleItem) => void;
  onOpenDelete: (article: ArticleItem) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ArticleCard({
  article,
  onOpenReviewNote,
  onOpenDelete,
}: Props) {
  const isPublished = article.status === "published";
  const isPending = article.status === "pending";
  const isRejected = article.status === "rejected";
  const isDraft = article.status === "draft";

  // Snippet cuplikan teks artikel
  const contentSnippet = (article.content || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/[#*_`]/g, "")
    .slice(0, 160);

  return (
    <div className="bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col md:flex-row gap-4 sm:gap-5 group">
      {/* Cover Thumbnail */}
      <div className="relative w-full md:w-48 h-36 sm:h-40 md:h-auto rounded-xl overflow-hidden bg-surface-variant/40 shrink-0 border border-outline-variant/20">
        {article.cover_url ? (
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/50 p-3 text-center">
            <span className="material-symbols-outlined text-3xl">image</span>
            <span className="text-[10px] mt-1">Tanpa Sampul</span>
          </div>
        )}

        {/* Floating status badge on mobile */}
        <div className="absolute top-2.5 left-2.5 md:hidden">
          <ArticleStatusBadge status={article.status} size="sm" />
        </div>
      </div>

      {/* Main Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: Category & Status */}
          <div className="hidden md:flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ArticleStatusBadge status={article.status} size="sm" />
              {article.category && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <FiTag size={10} />
                  <span>{article.category}</span>
                </span>
              )}
            </div>

            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <FiCalendar size={12} />
              <span>
                {isPublished
                  ? `Terbit ${formatDate(article.published_at)}`
                  : `Dibuat ${formatDate(article.created_at)}`}
              </span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
            {article.title}
          </h3>

          {/* Snippet */}
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3">
            {contentSnippet || "Belum ada konten tulisan."}
          </p>

          {/* Rejection Alert Banner (Jika rejected) */}
          {isRejected && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 min-w-0">
                <FiAlertCircle className="text-rose-500 text-sm shrink-0 mt-0.5" />
                <p className="text-xs text-rose-600 dark:text-rose-400 line-clamp-2 leading-relaxed">
                  <span className="font-bold">Catatan Admin: </span>
                  {article.review_note || "Perlu revisi sesuai pedoman penulisan."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenReviewNote(article)}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline shrink-0 whitespace-nowrap cursor-pointer"
              >
                Lihat Detail
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-outline-variant/20 mt-auto">
          {/* Metadata info */}
          <div className="text-xs text-on-surface-variant flex items-center gap-3">
            {isPending && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <FiClock size={12} />
                <span>Menunggu antrean review</span>
              </span>
            )}
            {article.updated_at && !isPending && (
              <span className="text-[11px] text-on-surface-variant/70 hidden sm:inline">
                Diperbarui: {formatDate(article.updated_at)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Tombol Lihat Publik jika Tayang */}
            {isPublished && (
              <Link
                href={`/artikel/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-variant/40 hover:bg-surface-variant border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors"
                title="Lihat halaman artikel publik"
              >
                <FiExternalLink size={13} />
                <span>Lihat Publik</span>
              </Link>
            )}

            {/* Tombol Edit Artikel (Hanya draf atau rejected, atau ajukan revisi untuk published) */}
            {(isDraft || isRejected) && (
              <Link
                href={`/dashboard/artikel/${article.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all shadow-sm"
              >
                <FiEdit2 size={13} />
                <span>Edit & Ajukan</span>
              </Link>
            )}

            {/* Tombol Ajukan Revisi jika sudah published */}
            {isPublished && (
              <Link
                href={`/dashboard/artikel/${article.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-xs font-bold transition-all"
              >
                <FiEdit2 size={13} />
                <span>Ajukan Revisi</span>
              </Link>
            )}

            {/* Tombol Hapus (Hanya draf atau rejected) */}
            {(isDraft || isRejected) && (
              <button
                type="button"
                onClick={() => onOpenDelete(article)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Hapus artikel"
              >
                <FiTrash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

