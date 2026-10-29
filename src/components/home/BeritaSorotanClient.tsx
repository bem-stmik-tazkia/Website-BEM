"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { FiArrowRight, FiHeart, FiEye, FiCalendar, FiClock, FiShare2, FiCheck } from "react-icons/fi";
import { formatDateLocalized } from "@/utils/dateFormatter";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { motion, AnimatePresence } from "framer-motion";

interface BeritaSorotanClientProps {
  news: {
    id: string;
    title: string;
    excerpt: string;
    slug: string;
    category: string;
    created_at: string;
    image_url?: string;
    likes?: number;
    views?: number;
  };
}

export default function BeritaSorotanClient({ news }: BeritaSorotanClientProps) {
  const t = useTranslations("News");
  const locale = useLocale();
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const { data: translatedNews } = useTranslatedContent(
    news,
    "berita",
    locale,
    ["title", "excerpt"]
  );

  const item = translatedNews || news;

  // Estimasi waktu baca
  const calculateReadingTime = (text?: string) => {
    if (!text) return locale === "id" ? "2 mnt baca" : "2 min read";
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(2, Math.ceil(words / 35));
    return locale === "id" ? `${minutes} mnt baca` : `${minutes} min read`;
  };

  // Robust Clipboard Copy Fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("navigator.clipboard failed, attempting fallback:", err);
      }
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      return false;
    }
  };

  // Universal Share: Web Share API di HP, Clipboard di Desktop
  const handleUniversalShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bem.stmik.tazkia.ac.id";
    const url = `${baseUrl}/${locale}/berita/${item.slug}`;
    const shareData = {
      title: item.title,
      text: `${item.title}\n\n${url}`,
      url: url,
    };

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    const copied = await copyToClipboard(url);
    if (copied) {
      setCopyNotice(locale === "id" ? "Tautan berita berhasil disalin!" : "News link copied to clipboard!");
      setTimeout(() => setCopyNotice(null), 2500);
    }
  };

  return (
    <div className="w-full relative">
      {/* Floating Share Feedback Pill */}
      <AnimatePresence>
        {copyNotice && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <span className="p-1 rounded-full bg-emerald-500 text-white">
              <FiCheck size={12} />
            </span>
            {copyNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-outline-variant/20 hover:border-primary/40 bg-slate-950 min-h-[420px] sm:min-h-[380px] md:min-h-[430px] flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:shadow-primary/25 hover:-translate-y-2 block">
        {/* Background Image with Dynamic Zoom */}
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-108 pointer-events-none">
          {item.image_url && (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            />
          )}
        </div>

        {/* Multi-layer Gradient Overlay for High Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 via-50% to-slate-950/25 transition-opacity duration-500 group-hover:opacity-95 pointer-events-none"></div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

        {/* Full-card link at z-10 */}
        <Link
          href={`/berita/${item.slug}`}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={item.title}
        />

        {/* Featured Content at z-20 pointer-events-none */}
        <div className="relative z-20 p-5 sm:p-6 md:p-10 text-white w-full md:max-w-4xl text-left pointer-events-none">
          {/* Featured Badges (Category + Date + Read Time) */}
          <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
            <span className="bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm transition-transform duration-300 group-hover:scale-105">
              {t("featured")}
            </span>
            <span className="bg-surface/20 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
              <FiCalendar className="inline shrink-0 text-white/90" />{" "}
              {formatDateLocalized(item.created_at, locale)}
            </span>
            <span className="bg-surface/20 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
              <FiClock className="inline shrink-0 text-amber-300" />{" "}
              {calculateReadingTime(item.excerpt)}
            </span>
          </div>

          <span className="text-secondary-container font-semibold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest mb-2 block drop-shadow-xs">
            {item.category?.toLowerCase() === "berita"
              ? t("catNews")
              : item.category?.toLowerCase() === "pengumuman"
                ? t("catAnnouncement")
                : item.category?.toLowerCase() === "prestasi"
                  ? t("catAchievement")
                  : item.category}
          </span>

          <h2 className="text-lg sm:text-xl md:text-4xl font-extrabold mb-3 md:mb-4 leading-tight group-hover:text-secondary-container transition-all duration-300 drop-shadow-md">
            {item.title}
          </h2>
          <p className="text-white/90 text-xs sm:text-sm md:text-base mb-4 md:mb-6 font-light leading-relaxed line-clamp-3 md:line-clamp-3 drop-shadow-xs">
            {item.excerpt}
          </p>

          <div className="flex flex-row gap-3 items-center justify-between flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 bg-secondary text-white hover:bg-secondary/90 transition-all duration-300 px-4 sm:px-6 py-2 md:py-3 rounded-full font-bold text-xs sm:text-sm shadow-md group-hover:scale-105 group-hover:shadow-glow shrink-0 pointer-events-none">
                {t("readMore")} <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
              <button
                type="button"
                onClick={handleUniversalShare}
                title={locale === "id" ? "Bagikan berita" : "Share news"}
                className="pointer-events-auto relative z-30 inline-flex items-center gap-1.5 bg-white/20 hover:bg-primary text-white backdrop-blur-md px-3.5 py-2 md:py-3 rounded-full text-xs font-semibold shadow-md transition-all duration-300 border border-white/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <FiShare2 size={13} />
                <span className="hidden sm:inline">{locale === "id" ? "Bagikan" : "Share"}</span>
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/85">
              <span className="flex items-center gap-1">
                <FiHeart className="text-rose-400" /> {item.likes || 0} {t("likes")}
              </span>
              <span className="flex items-center gap-1">
                <FiEye className="text-sky-300" /> {item.views || 0} {t("views")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
