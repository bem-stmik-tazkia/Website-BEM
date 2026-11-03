"use client";

import React, { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import NativeLink from "next/link";
import {
  FiSearch,
  FiClock,
  FiEye,
  FiHeart,
  FiCalendar,
  FiTag,
  FiArrowRight,
  FiTrendingUp,
  FiEdit3,
  FiBookOpen,
} from "react-icons/fi";
import { useLocale, useTranslations } from "next-intl";

export interface PublishedArticleItem {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_url: string | null;
  category: string | null;
  status: string;
  views: number;
  likes: number;
  published_at: string | null;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const CATEGORIES = [
  "Semua",
  "Opini & Esai",
  "Teknologi & AI",
  "Akademik & Riset",
  "Prestasi Mahasiswa",
  "Kegiatan Kampus",
  "Tips & Karir",
];

export default function ArtikelClient({ initialArticles }: { initialArticles: PublishedArticleItem[] }) {
  const locale = useLocale();
  const t = useTranslations("ArticleList");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  // Filtering and sorting
  const filteredArticles = useMemo(() => {
    let result = [...initialArticles];

    if (selectedCategory !== "Semua") {
      result = result.filter(
        (a) => a.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.author?.full_name?.toLowerCase().includes(q) ?? false) ||
          (a.category?.toLowerCase().includes(q) ?? false)
      );
    }

    if (sortBy === "popular") {
      result.sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2));
    } else {
      result.sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at).getTime();
        const timeB = new Date(b.published_at || b.created_at).getTime();
        return timeB - timeA;
      });
    }

    return result;
  }, [initialArticles, selectedCategory, searchQuery, sortBy]);

  const featuredArticle = filteredArticles[0];
  const listArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-secondary/10 border border-outline-variant/30 p-6 sm:p-10 mb-10 overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <FiBookOpen size={13} />
            <span>Karya & Opini Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-on-surface leading-tight tracking-tight">
            Ruang Intelektual Mahasiswa STMIK Tazkia
          </h1>
          <p className="text-xs sm:text-base text-on-surface-variant mt-2.5 leading-relaxed">
            Eksplorasi tulisan gagasan ilmiah, riset teknologi, wawasan karir, dan inspirasi karya mahasiswa yang telah terkurasi secara resmi.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <NativeLink
              href="/dashboard/artikel/baru"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <FiEdit3 size={15} />
              <span>{t("writeArticle")}</span>
            </NativeLink>
            <a
              href="#katalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-variant/30 text-on-surface text-xs sm:text-sm font-bold transition-colors"
            >
              <span>Jelajahi Artikel</span>
              <FiArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div id="katalog" className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-outline-variant/40 text-xs sm:text-sm text-on-surface outline-none focus:border-primary shadow-xs transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-on-surface-variant font-medium">Urutkan:</span>
            <div className="flex items-center bg-surface border border-outline-variant/40 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  sortBy === "newest" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t("sortNewest")}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("popular")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  sortBy === "popular" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <FiTrendingUp size={12} />
                <span>{t("sortPopular")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
            <FiBookOpen size={26} />
          </div>
          <h3 className="text-lg font-bold text-on-surface">{t("emptyTitle")}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {t("emptyDesc")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Semua");
            }}
            className="mt-5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Article Card */}
          {featuredArticle && (
            <Link
              href={`/artikel/${featuredArticle.slug}`}
              className="group block bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 relative h-56 sm:h-72 lg:h-96 bg-surface-variant/40 overflow-hidden">
                  {featuredArticle.cover_url ? (
                    <img
                      src={featuredArticle.cover_url}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                      <FiBookOpen size={48} />
                    </div>
                  )}
                  {featuredArticle.category && (
                    <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {featuredArticle.category}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2.5">
                      <FiCalendar size={13} />
                      <span>
                        {new Date(featuredArticle.published_at || featuredArticle.created_at).toLocaleDateString(
                          locale,
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-on-surface group-hover:text-primary transition-colors leading-snug mb-3">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4">
                      {featuredArticle.content.replace(/<[^>]*>?/gm, "").replace(/[#*_`]/g, "").slice(0, 220)}...
                    </p>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden text-xs">
                        {featuredArticle.author?.avatar_url ? (
                          <img src={featuredArticle.author.avatar_url} alt="Author" className="w-full h-full object-cover" />
                        ) : (
                          <span>{featuredArticle.author?.full_name?.charAt(0) || "M"}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-on-surface">
                        {featuredArticle.author?.full_name || "Mahasiswa Tazkia"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <FiEye size={13} />
                        <span>{featuredArticle.views || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHeart size={13} className="text-rose-500" />
                        <span>{featuredArticle.likes || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of Other Articles */}
          {listArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listArticles.map((art) => (
                <Link
                  key={art.id}
                  href={`/artikel/${art.slug}`}
                  className="group bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative h-44 bg-surface-variant/40 overflow-hidden">
                    {art.cover_url ? (
                      <img
                        src={art.cover_url}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                        <FiBookOpen size={32} />
                      </div>
                    )}
                    {art.category && (
                      <span className="absolute top-2.5 left-2.5 bg-surface/90 backdrop-blur-xs text-primary font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-primary/20 shadow-xs">
                        {art.category}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-2">
                        <FiCalendar size={11} />
                        <span>
                          {new Date(art.published_at || art.created_at).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                        {art.title}
                      </h3>

                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                        {art.content.replace(/<[^>]*>?/gm, "").replace(/[#*_`]/g, "").slice(0, 130)}...
                      </p>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden text-[10px] shrink-0">
                          {art.author?.avatar_url ? (
                            <img src={art.author.avatar_url} alt="Author" className="w-full h-full object-cover" />
                          ) : (
                            <span>{art.author?.full_name?.charAt(0) || "M"}</span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface font-medium truncate max-w-[120px]">
                          {art.author?.full_name || "Mahasiswa"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-on-surface-variant shrink-0">
                        <span className="flex items-center gap-1">
                          <FiEye size={12} />
                          <span>{art.views || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FiHeart size={12} className="text-rose-500" />
                          <span>{art.likes || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

