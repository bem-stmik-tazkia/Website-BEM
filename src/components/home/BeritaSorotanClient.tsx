"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { FiArrowRight, FiHeart, FiEye, FiCalendar } from "react-icons/fi";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

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

  const { data: translatedNews } = useTranslatedContent(
    news,
    "berita",
    locale,
    ["title", "excerpt"]
  );

  const item = translatedNews ?? news;

  return (
    <div className="w-full">
      <Link
        href={`/berita/${item.slug}`}
        className="group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-md border border-outline-variant/20 bg-surface min-h-[420px] sm:min-h-[380px] md:min-h-[420px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl block"
      >
        {/* Background Image with Zoom */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${item.image_url}')` }}
        ></div>
        {/* Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b4086]/95 via-[#1b4086]/70 to-[#1b4086]/30 md:to-transparent"></div>

        {/* Featured Content */}
        <div className="relative z-10 p-5 sm:p-6 md:p-10 text-white w-full md:max-w-4xl text-left">
          {/* Featured Badge */}
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <span className="bg-secondary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {t("featured")}
            </span>
            <span className="bg-surface/20 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
              <FiCalendar className="inline shrink-0 text-white" />{" "}
              {new Date(item.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <span className="text-secondary-container font-semibold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest mb-2 block">
            {item.category?.toLowerCase() === "berita"
              ? t("catNews")
              : item.category?.toLowerCase() === "pengumuman"
                ? t("catAnnouncement")
                : item.category?.toLowerCase() === "prestasi"
                  ? t("catAchievement")
                  : item.category}
          </span>

          <h2 className="text-lg sm:text-xl md:text-4xl font-extrabold mb-3 md:mb-4 leading-tight group-hover:text-secondary-container transition-colors duration-300">
            {item.title}
          </h2>
          <p className="text-white/90 text-xs sm:text-sm md:text-base mb-4 md:mb-6 font-light leading-relaxed line-clamp-3 md:line-clamp-3">
            {item.excerpt}
          </p>

          <div className="flex flex-row gap-3 items-center justify-between flex-wrap">
            <div className="inline-flex items-center gap-2 bg-secondary text-white hover:bg-secondary/90 transition-all duration-300 px-4 sm:px-6 py-2 md:py-3 rounded-full font-bold text-xs sm:text-sm shadow-md group-hover:translate-x-1 shrink-0">
              {t("readMore")} <FiArrowRight />
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <FiHeart /> {item.likes || 0} {t("likes")}
              </span>
              <span className="flex items-center gap-1">
                <FiEye /> {item.views || 0} {t("views")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
