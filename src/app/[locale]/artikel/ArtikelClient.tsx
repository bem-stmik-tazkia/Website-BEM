"use client";

import SafeLottie from "@/components/ui/SafeLottie";
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import {
  FiSearch,
  FiClock,
  FiEye,
  FiCalendar,
  FiArrowRight,
  FiTrendingUp,
  FiEdit3,
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useLocale, useTranslations } from "next-intl";
import LikeButton from "@/components/ui/LikeButton";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
import { createClient } from "@/utils/supabase/client";

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
    email?: string | null;
    avatar_url: string | null;
    bio?: string | null;
  } | null;
}

const CATEGORY_KEYS = [
  { key: "Semua", transKey: "catAll" },
  { key: "Opini & Esai", transKey: "catOpinion" },
  { key: "Teknologi & AI", transKey: "catTech" },
  { key: "Akademik & Riset", transKey: "catAcademic" },
  { key: "Prestasi Mahasiswa", transKey: "catAchievement" },
  { key: "Kegiatan Kampus", transKey: "catCampus" },
  { key: "Tips & Karir", transKey: "catCareer" },
  { key: "Seni & Budaya", transKey: "catArts" },
  { key: "Lainnya", transKey: "catOther" },
];

const ITEMS_PER_PAGE = 6;

export default function ArtikelClient({ initialArticles }: { initialArticles: PublishedArticleItem[] }) {
  const locale = useLocale();
  const t = useTranslations("ArticleList");

  const [articlesData, setArticlesData] = useState<PublishedArticleItem[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real-time stats (views & likes) to bypass Next.js static cache & subscribe to live updates
  useEffect(() => {
    if (initialArticles.length === 0) return;
    const supabase = createClient();

    const fetchLatestStats = async () => {
      try {
        const ids = initialArticles.map((a) => a.id);
        const { data } = await supabase
          .from("articles")
          .select("id, views, likes")
          .in("id", ids);

        if (data && data.length > 0) {
          const map = new Map(data.map((d: any) => [d.id, d]));
          setArticlesData((prev) =>
            prev.map((art) => {
              const fresh = map.get(art.id);
              return fresh
                ? { ...art, views: fresh.views ?? art.views, likes: fresh.likes ?? art.likes }
                : art;
            })
          );
        }
      } catch (err) {
        console.error("[ArtikelClient] Error fetching live stats:", err);
      }
    };

    fetchLatestStats();

    // Subscribe to live changes in articles (views & likes)
    const channel = supabase
      .channel(`articles_public_stats_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "articles",
        },
        (payload: any) => {
          if (payload.new && payload.new.id) {
            setArticlesData((prev) =>
              prev.map((art) =>
                art.id === payload.new.id
                  ? {
                      ...art,
                      views: payload.new.views ?? art.views,
                      likes: payload.new.likes ?? art.likes,
                    }
                  : art
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialArticles]);

  // Helper untuk menerjemahkan nama kategori secara dinamis
  const translateCategory = (cat?: string | null) => {
    if (!cat) return "";
    const c = cat.toLowerCase().trim();
    if (c === "semua" || c === "all") return t("catAll");
    if (c.includes("opini") || c.includes("opinion") || c.includes("esai") || c.includes("essay")) return t("catOpinion");
    if (c.includes("teknologi") || c.includes("tech") || c.includes("ai")) return t("catTech");
    if (c.includes("akademik") || c.includes("academic") || c.includes("riset") || c.includes("research")) return t("catAcademic");
    if (c.includes("prestasi") || c.includes("achievement")) return t("catAchievement");
    if (c.includes("kegiatan") || c.includes("kampus") || c.includes("campus") || c.includes("activity")) return t("catCampus");
    if (c.includes("tips") || c.includes("karir") || c.includes("career")) return t("catCareer");
    if (c.includes("seni") || c.includes("budaya") || c.includes("art")) return t("catArts");
    if (c.includes("lain") || c.includes("other")) return t("catOther");
    if (c === "artikel" || c === "article") return t("pageTitle");
    return cat;
  };

  // Helper untuk menentukan avatar (fallback ke lambang resmi Tazkia jika akun BEM / Admin)
  const getAuthorAvatar = (author?: PublishedArticleItem["author"]) => {
    if (author?.avatar_url) return author.avatar_url;
    const name = author?.full_name?.toLowerCase() || "";
    const email = author?.email?.toLowerCase() || "";
    if (name.includes("bem") || name.includes("tazkia") || email.includes("bem@stmik.tazkia.ac.id")) {
      return "/images/logo2.webp";
    }
    return null;
  };

  // Reset pagination saat filter kategori atau search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  // Filtering and sorting
  const filteredArticles = useMemo(() => {
    let result = [...articlesData];

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
  }, [articlesData, selectedCategory, searchQuery, sortBy]);

  // Terjemahkan hanya JUDUL artikel sesuai bahasa yang dipilih (isi artikel tetap asli 100%)
  const { data: translatedArticles } = useTranslatedList(
    filteredArticles,
    "articles",
    locale,
    ["title"]
  );

  // Pagination calculation
  const hasFeatured = selectedCategory === "Semua" && !searchQuery.trim() && currentPage === 1;
  const featuredArticle = hasFeatured && translatedArticles.length > 0 ? translatedArticles[0] : null;

  const gridSourceArticles = useMemo(() => {
    if (hasFeatured) {
      return translatedArticles.slice(1);
    }
    return translatedArticles;
  }, [translatedArticles, hasFeatured]);

  const totalPages = Math.max(1, Math.ceil(gridSourceArticles.length / ITEMS_PER_PAGE));
  const paginatedGridArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return gridSourceArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [gridSourceArticles, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const katalogEl = document.getElementById("katalog");
    if (katalogEl) {
      katalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-32 sm:pb-24 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Header dengan Animasi Maskot Orange Cat */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-secondary/10 border border-outline-variant/30 p-4 sm:p-8 md:p-10 mb-6 sm:mb-10 overflow-hidden shadow-xs sm:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8">
        <div className="relative z-10 w-full md:max-w-xl lg:max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2.5 sm:mb-3 border border-primary/20">
            <FiBookOpen size={13} />
            <span>{t("heroBadge")}</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-on-surface leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
            {t("heroTitle")}
          </h1>
          <p className="text-xs sm:text-base text-on-surface-variant mt-2 sm:mt-2.5 leading-relaxed max-w-xl break-words [overflow-wrap:anywhere]">
            {t("heroSubtitle")}
          </p>

          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3 mt-4 sm:mt-6 w-full sm:w-auto">
            <Link
              href="/dashboard/artikel/baru"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>{t("writeArticle")}</span>
            </Link>
            <a
              href="#katalog"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-variant/30 text-on-surface text-xs sm:text-sm font-bold transition-colors text-center whitespace-nowrap"
            >
              <span>{t("exploreArticles")}</span>
              <FiArrowRight size={14} className="shrink-0" />
            </a>
          </div>
        </div>

        {/* Lottie Animation: Orange Cat Mascot */}
        <div className="relative w-28 h-28 sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0 flex items-center justify-center self-center md:self-auto -mt-1 md:mt-0">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <SafeLottie
            src="/animations/orangeCat.lottie"
            loop
            autoplay
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div id="katalog" className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs sm:text-sm text-on-surface outline-none focus:border-primary shadow-xs transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-xs text-on-surface-variant font-medium shrink-0">{t("sortByLabel")}</span>
            <div className="flex items-center bg-surface border border-outline-variant/40 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === "newest" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t("sortNewest")}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("popular")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  sortBy === "popular" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <FiTrendingUp size={12} />
                <span>{t("sortPopular")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll dengan terjemahan multi-bahasa */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-none touch-pan-x">
          {CATEGORY_KEYS.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                }`}
              >
                {translateCategory(cat.key)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {translatedArticles.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center max-w-md mx-auto my-8 sm:my-12 shadow-xs">
          <div className="w-32 h-32 sm:w-44 sm:h-44 mx-auto -mt-2 mb-3 flex items-center justify-center">
            <SafeLottie
              src="/animations/No Data.lottie"
              loop
              autoplay
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-on-surface">{t("emptyTitle")}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {t("emptyDesc")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Semua");
            }}
            className="mt-5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm shadow-primary/20"
          >
            {t("resetFilter")}
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Featured Article Card */}
          {featuredArticle && (
            <div className="group block bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <Link
                  href={`/artikel/${featuredArticle.slug}`}
                  className="lg:col-span-7 relative h-48 sm:h-64 lg:h-80 max-h-[340px] bg-surface-variant/40 overflow-hidden block"
                >
                  {featuredArticle.cover_url ? (
                    <img
                      src={featuredArticle.cover_url}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                      <FiBookOpen size={44} />
                    </div>
                  )}
                  {featuredArticle.category && (
                    <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 bg-primary text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                      {translateCategory(featuredArticle.category)}
                    </div>
                  )}
                </Link>

                <div className="lg:col-span-5 p-4 sm:p-6 lg:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-on-surface-variant mb-1.5 sm:mb-2">
                      <FiCalendar size={12} />
                      <span>
                        {new Date(featuredArticle.published_at || featuredArticle.created_at).toLocaleDateString(
                          locale,
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </span>
                    </div>

                    <Link href={`/artikel/${featuredArticle.slug}`} className="block">
                      <h2 className="text-base sm:text-xl lg:text-2xl font-black text-on-surface group-hover:text-primary transition-colors leading-snug mb-2 sm:mb-2.5 line-clamp-2 break-words [overflow-wrap:anywhere]">
                        {featuredArticle.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words [overflow-wrap:anywhere]">
                      {featuredArticle.content.replace(/<[^>]*>?/gm, "").replace(/[#*_`]/g, "").slice(0, 180)}...
                    </p>
                  </div>

                  <div className="pt-3 sm:pt-3.5 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden text-[11px] sm:text-xs shrink-0 ring-1 ring-outline-variant/20">
                        {getAuthorAvatar(featuredArticle.author) ? (
                          <img
                            src={getAuthorAvatar(featuredArticle.author)!}
                            alt="Author"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{featuredArticle.author?.full_name?.charAt(0) || "M"}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-on-surface truncate max-w-[120px] sm:max-w-[140px]">
                        {featuredArticle.author?.full_name || "Mahasiswa Tazkia"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-on-surface-variant shrink-0">
                      <span className="flex items-center gap-1" title="Views">
                        <FiEye size={13} />
                        <span>{featuredArticle.views || 0}</span>
                      </span>
                      <div className="flex items-center">
                        <LikeButton
                          initialLikes={featuredArticle.likes || 0}
                          id={featuredArticle.id}
                          table="articles"
                          size={14}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Articles */}
          {paginatedGridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedGridArticles.map((art) => {
                const avatar = getAuthorAvatar(art.author);
                return (
                  <div
                    key={art.id}
                    className="group bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <Link href={`/artikel/${art.slug}`} className="relative h-40 sm:h-44 bg-surface-variant/40 overflow-hidden block">
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
                          {translateCategory(art.category)}
                        </span>
                      )}
                    </Link>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-1.5 sm:mb-2">
                          <FiCalendar size={11} />
                          <span>
                            {new Date(art.published_at || art.created_at).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <Link href={`/artikel/${art.slug}`} className="block">
                          <h3 className="font-bold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5 sm:mb-2 break-words [overflow-wrap:anywhere]">
                            {art.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-3 sm:mb-4 break-words [overflow-wrap:anywhere]">
                          {art.content.replace(/<[^>]*>?/gm, "").replace(/[#*_`]/g, "").slice(0, 130)}...
                        </p>
                      </div>

                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between mt-auto gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden text-[10px] shrink-0 ring-1 ring-outline-variant/20">
                            {avatar ? (
                              <img src={avatar} alt="Author" className="w-full h-full object-cover" />
                            ) : (
                              <span>{art.author?.full_name?.charAt(0) || "M"}</span>
                            )}
                          </div>
                          <span className="text-xs text-on-surface font-medium truncate max-w-[100px] sm:max-w-[120px]">
                            {art.author?.full_name || "Mahasiswa"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-on-surface-variant shrink-0">
                          <span className="flex items-center gap-1" title="Views">
                            <FiEye size={12} />
                            <span>{art.views || 0}</span>
                          </span>
                          <div className="flex items-center">
                            <LikeButton
                              initialLikes={art.likes || 0}
                              id={art.id}
                              table="articles"
                              size={12}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kontrol Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 sm:pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <span className="text-xs text-on-surface-variant font-medium order-2 sm:order-1">
                {t("pageOf", { current: currentPage, total: totalPages })}
              </span>

              <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-variant/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
                  title="Halaman Sebelumnya"
                >
                  <FiChevronLeft size={14} />
                  <span className="hidden sm:inline">{t("prevPage")}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isCurrent = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-white shadow-xs shadow-primary/20 ring-2 ring-primary/20"
                          : "border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-variant/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
                  title="Halaman Berikutnya"
                >
                  <span className="hidden sm:inline">{t("nextPage")}</span>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
