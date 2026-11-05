"use client";

import React, { useMemo } from "react";
import {
  FiEye,
  FiX,
  FiCalendar,
  FiClock,
  FiTag,
  FiRotateCcw,
  FiEdit2,
  FiExternalLink,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArticleItem } from "./ArticleCard";
import ArticleStatusBadge from "./ArticleStatusBadge";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleItem | null;
  onWithdraw?: (article: ArticleItem) => void;
}

export default function ArticlePreviewModal({
  isOpen,
  onClose,
  article,
  onWithdraw,
}: Props) {
  const t = useTranslations("DashboardArtikel");
  const locale = useLocale();

  // Terjemahkan judul secara dinamis jika bahasa selain Indonesia
  const { data: displayArticle } = useTranslatedContent(
    article,
    "articles",
    locale,
    ["title"]
  );

  const displayTitle = displayArticle?.title || article?.title || "";

  const readingTime = useMemo(() => {
    if (!article?.content) return 1;
    const wordCount = article.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [article?.content]);

  const formattedDate = useMemo(() => {
    if (!article) return "";
    const rawDate = article.published_at || article.created_at;
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(new Date(rawDate));
    } catch {
      return rawDate;
    }
  }, [article, locale]);

  if (!isOpen || !article) return null;

  const isPending = article.status === "pending";
  const isDraft = article.status === "draft";
  const isRejected = article.status === "rejected";
  const isPublished = article.status === "published";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <FiEye size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-on-surface">
                    {t("previewModalTitle")}
                  </h3>
                  <ArticleStatusBadge status={article.status} size="sm" />
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
            {/* Notice Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-start gap-3">
              <FiEye className="text-primary text-base shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t("previewNotice")}
              </p>
            </div>

            {/* Cover Image */}
            {article.cover_url && (
              <div className="rounded-2xl overflow-hidden border border-outline-variant/30 max-h-72 sm:max-h-80 w-full shadow-sm bg-surface-variant/20">
                <img
                  src={article.cover_url}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-on-surface-variant mb-3">
                {article.category && (
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <FiTag size={11} />
                    <span>
                      {article.category === "Artikel"
                        ? t("categoryArticle")
                        : article.category}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiClock size={12} />
                  <span>{t("previewMinuteRead", { min: readingTime })}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiCalendar size={12} />
                  <span>
                    {isPublished
                      ? t("publishedAt", { date: formattedDate })
                      : t("createdAt", { date: formattedDate })}
                  </span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface leading-snug break-words [overflow-wrap:anywhere]">
                {displayTitle}
              </h1>
            </div>

            <div className="h-px bg-outline-variant/20" />

            {/* Content Body */}
            <article className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-sm sm:text-base text-on-surface/90 space-y-4">
                {article.content ? (
                  article.content
                ) : (
                  <p className="italic text-on-surface-variant/50">
                    {t("emptySnippet")}
                  </p>
                )}
              </div>
            </article>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-outline-variant/20 bg-surface shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-variant/30 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {t("previewClose")}
            </button>

            <div className="flex items-center gap-2">
              {/* Jika Pending: Bisa Tarik ke Draf */}
              {isPending && onWithdraw && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onWithdraw(article);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/25 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
                >
                  <FiRotateCcw size={14} />
                  <span>{t("btnCancelSubmission")}</span>
                </button>
              )}

              {/* Jika Draf atau Perlu Revisi: Tombol Edit */}
              {(isDraft || isRejected) && (
                <Link
                  href={`/dashboard/artikel/${article.id}/edit`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm font-bold transition-all shadow-sm"
                >
                  <FiEdit2 size={14} />
                  <span>{t("editAndSubmit")}</span>
                </Link>
              )}

              {/* Jika Published: Lihat Publik */}
              {isPublished && (
                <Link
                  href={`/artikel/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm font-bold transition-all shadow-sm"
                >
                  <FiExternalLink size={14} />
                  <span>{t("viewPublic")}</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

