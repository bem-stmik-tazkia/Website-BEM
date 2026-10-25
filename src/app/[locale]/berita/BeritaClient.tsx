"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiCalendar,
  FiArrowRight,
  FiHeart,
  FiEye,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useTranslations, useLocale } from "next-intl";
import LikeButton from "@/components/ui/LikeButton";
import { motion } from "framer-motion";
import SafeLottie from "@/components/ui/SafeLottie";
import BeritaTourClient from "@/components/berita/BeritaTourClient";
import { createClient } from "@/utils/supabase/client";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
import { formatDateLocalized } from "@/utils/dateFormatter";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  created_at: string;
  image_url: string;
  views: number;
  likes: number;
}

export default function BeritaClient({ initialNews }: { initialNews: NewsItem[] }) {
  const t = useTranslations("BeritaPage");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [allNews, setAllNews] = useState<NewsItem[]>(initialNews);
  const isLoading = false;

  useEffect(() => {
    if (!searchQuery) {
      setDebouncedSearchQuery("");
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch real-time stats (views & likes) to bypass Next.js aggressive cache
  useEffect(() => {
    if (initialNews.length === 0) return;
    const fetchLatestStats = async () => {
      try {
        const supabase = createClient();
        const ids = initialNews.map(n => n.id);
        const { data } = await supabase
          .from('berita')
          .select('id, views, likes')
          .in('id', ids);
          
        if (data) {
          setAllNews(prev => prev.map(news => {
            const fresh = data.find(d => d.id === news.id);
            if (fresh) {
              return { ...news, views: fresh.views || 0, likes: fresh.likes || 0 };
            }
            return news;
          }));
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    };
    fetchLatestStats();
  }, [initialNews]);

  // Auto-translate konten berita sesuai bahasa yang dipilih pengguna
  const { data: translatedNews, isTranslating: isTranslatingNews } = useTranslatedList(
    allNews,
    "berita",
    locale,
    ["title", "excerpt"]
  );

  // Pastikan urutan berita dari yang terbaru berdasarkan tanggal pembuatan (created_at)
  const sortedNews = useMemo(() => {
    return [...translatedNews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [translatedNews]);

  // Compute featured, popular, and grid news dynamically
  const featuredNews = sortedNews.length > 0 ? sortedNews[0] : null;
  const newsList = sortedNews;
  const popularNews = useMemo(() => {
    return [...sortedNews].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  }, [sortedNews]);

  // Categories list
  const categories = ["Semua", "Berita", "Artikel", "Rilis", "Kampus", "Pendidikan"];

  const translateCategory = (cat?: string) => {
    if (!cat) return "";
    const c = cat.toLowerCase();
    if (c === "semua" || c === "all") return t("catAll");
    if (c === "berita" || c === "news") return t("categoryNews");
    if (c === "artikel" || c === "article") return t("categoryArticle");
    if (c === "rilis" || c === "release") return t("categoryRelease");
    if (c === "kampus" || c === "campus") return t("categoryCampus");
    if (c === "pendidikan" || c === "education") return t("categoryEducation");
    if (c === "pengumuman" || c === "announcement") return t("categoryAnnouncement");
    if (c === "prestasi" || c === "achievement") return t("categoryAchievement");
    return cat;
  };

  // Filter & Search Logic
  const filteredNews = useMemo(() => {
    const listToFilter = selectedCategory === "Semua" && debouncedSearchQuery === "" ? newsList : sortedNews;
    return listToFilter.filter((item) => {
      const q = debouncedSearchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "Semua" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [sortedNews, newsList, debouncedSearchQuery, selectedCategory]);

  // Pagination Logic
  const itemsPerPage = 4;
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage) || 1;
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNews, currentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to page 1 when category changes
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-32 md:pb-20 font-sans overflow-x-hidden w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Main Container */}
      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">

        {/* Header */}
        <header id="tour-berita-header" className="mb-8 md:mb-10 text-left">
          <h1 className="font-display-lg text-3xl md:text-5xl text-primary mb-3 md:mb-4 font-black tracking-tight leading-tight">
            {t("pageTitle")}
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl text-sm md:text-lg font-light leading-relaxed">
            {t("pageSubtitle")}
          </p>
        </header>

        {/* Filter and Search Section */}
        <section id="tour-berita-search" className="mb-8 bg-surface border border-outline-variant/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
              <FiSearch size={18} className={isSearching ? "text-primary" : ""} />
            </span>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2.5 bg-background border border-outline-variant/40 rounded-xl text-sm placeholder-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${selectedCategory === category
                    ? "bg-primary text-on-primary shadow-soft"
                    : "bg-surface-variant/45 text-on-surface-variant hover:bg-surface-variant/80"
                  }`}
              >
                {translateCategory(category)}
              </button>
            ))}
          </div>
        </section>

        {/* Featured News Section */}
        {selectedCategory === "Semua" && searchQuery === "" && featuredNews && (
          <section id="tour-berita-featured" className="mb-12">
            <div className="group relative rounded-3xl overflow-hidden shadow-md border border-outline-variant/20 bg-surface min-h-[350px] md:min-h-[400px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl cursor-pointer">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${featuredNews.image_url}')` }}
              ></div>
              {/* Gradient Overlay for Text Visibility - Stronger bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a5c] via-[#1b4086]/70 to-[#1b4086]/10 transition-opacity duration-300 group-hover:opacity-90"></div>

              {/* Featured Badge */}
              <div className="absolute top-6 left-6 z-10 flex flex-wrap items-center gap-2 pr-6">
                <span className="bg-secondary text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                  {translateCategory(featuredNews.category)}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                  <FiCalendar className="inline shrink-0" /> {formatDateLocalized(featuredNews.created_at, locale)}
                </span>
              </div>

              {/* Featured Content */}
              <div className="relative z-10 p-5 md:p-10 text-white max-w-4xl">
                <h2 className="text-xl md:text-4xl font-extrabold mb-3 md:mb-4 leading-tight group-hover:text-secondary-container transition-colors duration-300">
                  {featuredNews.title}
                </h2>
                <p className="text-white/90 text-xs md:text-base mb-4 md:mb-6 font-light leading-relaxed line-clamp-3">
                  {featuredNews.excerpt}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <span className="inline-flex items-center gap-2 bg-secondary text-white transition-all duration-300 px-6 py-3 rounded-full font-bold text-xs md:text-sm group-hover:translate-x-1 group-hover:bg-secondary/90">
                    {t("readMore")} <FiArrowRight />
                  </span>
                  <div className="flex items-center gap-4 text-xs text-white/90 z-30">
                    {/* The like button needs to be clickable independently, so it gets z-30 and relative position */}
                    <div className="relative z-30">
                      <LikeButton initialLikes={featuredNews.likes} id={featuredNews.id} table="berita" label={t("likes")} size={16} />
                    </div>
                    <span className="flex items-center gap-1"><FiEye /> {featuredNews.views} {t("views")}</span>
                  </div>
                </div>
              </div>

              {/* Invisible full-card link — makes entire banner clickable */}
              <Link
                href={`/berita/${featuredNews.slug}`}
                className="absolute inset-0 z-20"
                aria-label={featuredNews.title}
              />
            </div>
          </section>
        )}

        {/* Main Grid Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: News Grid (8/12) */}
          <div id="tour-berita-grid" className="lg:col-span-8 flex flex-col gap-6 md:gap-8 order-1 lg:order-1">
            <h3 className="text-base md:text-lg font-bold text-primary pb-2.5 border-b border-outline-variant/30 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-2.5 h-4 bg-primary rounded-full inline-block"></span>
              {t("categoryNews")}
            </h3>
            {isLoading || isSearching || isTranslatingNews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-surface rounded-3xl p-6 shadow-sm border border-outline-variant/20 h-80 flex flex-col justify-between animate-pulse">
                    <div className="w-full h-40 bg-surface-variant/60 rounded-xl" />
                    <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4" />
                    <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            ) : paginatedNews.length > 0 ? (
              <div className="flex flex-row overflow-x-auto gap-6 pb-6 w-full md:grid md:grid-cols-2 md:overflow-visible md:pb-0 scrollbar-hide flex-nowrap md:flex-wrap">
                {paginatedNews.map((news, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    key={news.id}
                    className="w-[280px] sm:w-[320px] md:w-auto shrink-0 md:shrink"
                  >
                    <article className="group relative rounded-3xl overflow-hidden shadow-md cursor-pointer h-[360px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl w-full">
                      {/* Background Image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${news.image_url}')` }}
                      ></div>

                      {/* Gradient Overlay — stronger at bottom, slightly dims whole card on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a5c] via-[#0d2a5c]/80 to-[#1b4086]/20 transition-opacity duration-300 group-hover:opacity-90"></div>

                      {/* Content */}
                      <div className="relative z-10 p-6 flex flex-col items-start text-white w-full">
                        {/* Category Badge + Date Badge + Stats */}
                        <div className="flex items-center justify-between w-full mb-2.5 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/20">
                              {translateCategory(news.category)}
                            </span>
                            <span className="bg-white/15 backdrop-blur-sm text-white/95 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/15 shadow-xs">
                              <FiCalendar size={11} className="shrink-0 text-white/80" />
                              {formatDateLocalized(news.created_at, locale)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/90 font-medium shrink-0">
                            <div className="relative z-30">
                              <LikeButton initialLikes={news.likes} id={news.id} table="berita" size={11} />
                            </div>
                            <span className="flex items-center gap-0.5"><FiEye size={11} /> {news.views}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold mb-2 leading-snug text-white group-hover:text-secondary transition-colors duration-300 line-clamp-2 drop-shadow-md">
                          {news.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-white/80 text-xs mb-4 line-clamp-2 font-light leading-relaxed drop-shadow-sm">
                          {news.excerpt}
                        </p>

                        {/* Read More indicator */}
                        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-secondary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                          {t("readMore").toUpperCase()} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>

                      {/* Invisible full-card link — makes entire card clickable */}
                      <Link
                        href={`/berita/${news.slug}`}
                        className="absolute inset-0 z-20"
                        aria-label={news.title}
                      />
                    </article>
                  </motion.div>
                ))}
              </div>
            ) : (
              (() => {
                const isUserSearching = searchQuery.trim() !== "" || debouncedSearchQuery.trim() !== "" || selectedCategory !== "Semua";
                return (
                  <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 relative -my-3 mx-auto">
                      <SafeLottie
                        src="/animations/Social Media Marketing announcement.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <h3 className="text-lg font-bold text-on-background">
                      {isUserSearching ? t("noNewsSearch") : t("noNewsEmpty")}
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed">
                      {isUserSearching
                        ? searchQuery
                          ? `${t("noNewsSearchDesc")} "${searchQuery}".`
                          : `${t("noNewsSearchDesc")} "${translateCategory(selectedCategory)}".`
                        : t("noNewsEmptyDesc")}
                    </p>
                  </div>
                );
              })()
            )}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <nav className="hidden md:flex justify-center items-center gap-2 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl border border-outline-variant/35 bg-surface text-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label={t("prevPage")}
                >
                  <FiChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === page
                        ? "bg-secondary text-white shadow-glow"
                        : "border border-outline-variant/35 bg-surface text-primary hover:bg-primary-container"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl border border-outline-variant/35 bg-surface text-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label={t("nextPage")}
                >
                  <FiChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>

          {/* Right Column: Sidebar (4/12) */}
          <aside id="tour-berita-popular" className="lg:col-span-4 flex flex-col gap-6 w-full order-2 lg:order-2">

            {/* Sidebar Title */}
            <h3 className="text-base md:text-lg font-bold text-primary pb-2.5 border-b border-outline-variant/30 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-2.5 h-4 bg-secondary rounded-full inline-block"></span>
              {t("sidebarTitle")}
            </h3>

            {/* Popular News Cards - Horizontal scroll on mobile, vertical stack on desktop */}
            <div className="flex flex-row overflow-x-auto gap-4 pb-4 w-full lg:flex-col lg:overflow-visible lg:pb-0 scrollbar-hide flex-nowrap lg:flex-wrap">
              {popularNews.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  key={item.id}
                  className="w-[260px] sm:w-[300px] lg:w-auto shrink-0 lg:shrink"
                >
                  <div
                    className="group relative rounded-3xl overflow-hidden shadow-md cursor-pointer h-[200px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl w-full"
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${item.image_url}')` }}
                    ></div>

                    {/* Gradient Overlay - Stronger bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a5c] via-[#0d2a5c]/80 to-[#1b4086]/20 transition-opacity duration-300 group-hover:opacity-90"></div>

                    {/* Content */}
                    <div className="relative z-10 p-5 flex flex-col items-start text-white w-full">
                      <div className="flex items-center justify-between w-full gap-2 mb-2">
                        <span className="bg-surface text-primary text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
                          {translateCategory(item.category)}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-white/90 font-medium shrink-0">
                          <span className="flex items-center gap-0.5"><FiEye size={10} /> {item.views}</span>
                          <div className="relative z-30">
                            <LikeButton initialLikes={item.likes} id={item.id} table="berita" size={10} />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold leading-snug text-white group-hover:text-secondary transition-colors duration-300 line-clamp-2 drop-shadow-md">
                        {item.title}
                      </h4>
                      <span className="flex items-center gap-1 text-[10px] text-white/90 mt-2 font-medium drop-shadow-sm bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10">
                        <FiCalendar size={10} className="text-white/80 shrink-0" /> {formatDateLocalized(item.created_at, locale)}
                      </span>
                    </div>

                    {/* Invisible full-card link */}
                    <Link
                      href={`/berita/${item.slug}`}
                      className="absolute inset-0 z-20"
                      aria-label={item.title}
                    />
                  </div>
                </motion.div>
              ))}
            </div>


          </aside>

        </div>

      </main>

      <BeritaTourClient />
    </div>
  );
}
