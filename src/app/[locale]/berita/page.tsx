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
import { createClient } from "@/utils/supabase/client";
import LikeButton from "@/components/ui/LikeButton";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import BeritaTourClient from "@/components/berita/BeritaTourClient";
import { useTranslatedList, useTranslatedContent } from "@/hooks/useTranslatedContent";

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

export default function BeritaPage() {
  const t = useTranslations("BeritaPage");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('created_at', { ascending: false });

      setAllNews(data || []);
      setIsLoading(false);
    }
    fetchNews();

    const supabaseClient = createClient();
    const channel = supabaseClient
      .channel('realtime_public_berita')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'berita' }, () => {
        fetchNews();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Auto-translate konten dinamis dari database
  const { data: translatedNews, isTranslating: isTranslatingNews } = useTranslatedList(
    allNews,
    "berita",
    locale,
    ["title", "excerpt"]
  );

  // Compute featured, popular, and grid news dynamically (dari data yang sudah diterjemahkan)
  const featuredNews = translatedNews.length > 0 ? translatedNews[0] : null;
  const newsList = translatedNews.length > 1 ? translatedNews.slice(1) : [];
  const popularNews = [...translatedNews].sort((a, b) => b.views - a.views).slice(0, 3);

  // Categories list
  const categories = ["Semua", "Berita", "Artikel", "Rilis", "Kampus", "Pendidikan"];
  
  const translateCategory = (cat: string) => {
    if (cat === "Semua") return t("catAll");
    if (cat === "Berita") return t("categoryNews");
    if (cat === "Artikel") return t("categoryArticle");
    if (cat === "Rilis") return t("categoryRelease");
    if (cat === "Kampus") return t("categoryCampus");
    if (cat === "Pendidikan") return t("categoryEducation");
    return cat;
  };

  // Filter & Search Logic
  const filteredNews = useMemo(() => {
    const listToFilter = selectedCategory === "Semua" && debouncedSearchQuery === "" ? newsList : allNews;
    return listToFilter.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "Semua" || 
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [allNews, newsList, debouncedSearchQuery, selectedCategory]);

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
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container text-secondary font-semibold text-xs uppercase tracking-wider mb-4">
            {t("latestNews")}
          </div>
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
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === category
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
            <div className="group relative rounded-3xl overflow-hidden shadow-md border border-outline-variant/20 bg-surface min-h-[350px] md:min-h-[400px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${featuredNews.image_url}')` }}
              ></div>
              {/* Gradient Overlay for Text Visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent"></div>
              
              {/* Featured Badge */}
              <div className="absolute top-6 left-6 z-10 flex flex-wrap items-center gap-2 pr-6">
                <span className="bg-secondary text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                  {translateCategory(featuredNews.category)}
                </span>
                <span className="bg-surface/20 backdrop-blur-md text-white text-[10px] md:text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                  <FiCalendar className="inline shrink-0" /> {new Date(featuredNews.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>

              {/* Featured Content */}
              <div className="relative z-10 p-5 md:p-10 text-white max-w-4xl">
                <h2 className="text-xl md:text-4xl font-extrabold mb-3 md:mb-4 leading-tight group-hover:text-secondary-container transition-colors duration-300">
                  {featuredNews.title}
                </h2>
                <p className="text-white/85 text-xs md:text-base mb-4 md:mb-6 font-light leading-relaxed line-clamp-3">
                  {featuredNews.excerpt}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <Link 
                    href={`/berita/${featuredNews.slug}`}
                    className="inline-flex items-center gap-2 bg-secondary text-white hover:bg-secondary/90 transition-all duration-300 px-6 py-3 rounded-full font-bold text-xs md:text-sm hover:translate-x-1"
                  >
                    {t("readMore")} <FiArrowRight />
                  </Link>
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <LikeButton initialLikes={featuredNews.likes} id={featuredNews.id} table="berita" label="Suka" size={16} />
                    <span className="flex items-center gap-1"><FiEye /> {featuredNews.views} {t("views")}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Grid Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: News Grid (8/12) */}
          <div id="tour-berita-grid" className="lg:col-span-8 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">
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
                    <article
                      className="group relative rounded-3xl overflow-hidden shadow-md cursor-pointer h-[360px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl w-full h-full"
                    >
                      {/* Background Image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${news.image_url}')` }}
                      ></div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1b4086]/95 via-[#1b4086]/45 to-transparent"></div>

                      {/* Content */}
                      <div className="relative z-10 p-6 flex flex-col items-start text-white">
                        {/* Category Badge + Stats */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-surface text-primary text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                            {translateCategory(news.category)}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-white/90 font-medium">
                            <LikeButton initialLikes={news.likes} id={news.id} table="berita" size={11} />
                            <span className="flex items-center gap-0.5"><FiEye size={11} /> {news.views}</span>
                          </div>
                        </div>

                        {/* Date */}
                        <span className="flex items-center gap-1 text-[10px] text-white/70 mb-2 font-medium">
                          <FiCalendar size={10} /> {new Date(news.created_at).toLocaleDateString('id-ID')}
                        </span>

                        {/* Title */}
                        <h3 className="text-base font-bold mb-2 leading-snug text-white group-hover:text-secondary transition-colors duration-300 line-clamp-2">
                          {news.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-white/75 text-xs mb-4 line-clamp-2 font-light leading-relaxed">
                          {news.excerpt}
                        </p>

                        {/* Read More */}
                        <Link
                          href={`/berita/${news.slug}`}
                          className="flex items-center gap-1.5 text-xs font-bold tracking-wider hover:text-secondary transition-colors"
                        >
                          {t("readMore").toUpperCase()} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </article>
                  </motion.div>
                ))}
              </div>
            ) : (
              (() => {
                const isUserSearching = searchQuery.trim() !== "" || debouncedSearchQuery.trim() !== "" || selectedCategory !== "Semua";
                return (
                  <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 relative -my-3">
                      <DotLottieReact
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
                          : `${t("noNewsSearchDesc")} "${selectedCategory}".`
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
                  aria-label="Halaman Sebelumnya"
                >
                  <FiChevronLeft size={18} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      currentPage === page
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
                  aria-label="Halaman Selanjutnya"
                >
                  <FiChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>

          {/* Right Column: Sidebar (4/12) */}
          <aside id="tour-berita-popular" className="lg:col-span-4 flex flex-col gap-6 w-full order-1 lg:order-2">
            
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
                  <Link
                    href={`/berita/${item.slug}`}
                    className="group relative rounded-3xl overflow-hidden shadow-md cursor-pointer h-[200px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl block h-full"
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${item.image_url}')` }}
                    ></div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1b4086]/95 via-[#1b4086]/45 to-transparent"></div>

                    {/* Content */}
                    <div className="relative z-10 p-5 flex flex-col items-start text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-surface text-primary text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
                          {translateCategory(item.category)}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-white/80 font-medium">
                          <span className="flex items-center gap-0.5"><FiEye size={10} /> {item.views}</span>
                          <LikeButton initialLikes={item.likes} id={item.id} table="berita" size={10} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold leading-snug text-white group-hover:text-secondary transition-colors duration-300 line-clamp-2">
                        {item.title}
                      </h4>
                      <span className="flex items-center gap-1 text-[9px] text-white/60 mt-1.5 font-medium">
                        <FiCalendar size={9} /> {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </Link>
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
