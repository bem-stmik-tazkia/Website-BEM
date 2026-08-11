"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { FiSearch, FiArrowRight, FiHeart, FiEye, FiUpload, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { createClient } from "@/utils/supabase/client";
import ProjectCard, { ProjectData } from "@/components/mahasiswa/ProjectCard";
import KaryaTourClient from "@/components/karya/KaryaTourClient";
import { useTranslatedList } from "@/hooks/useTranslatedContent";

function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setLiked(!liked);
      }}
      className="flex items-center gap-1.5 group/stat cursor-pointer hover:text-red-500 transition-colors"
    >
      <div className="w-5 h-5 flex items-center justify-center -ml-1 shrink-0">
        {liked ? (
          <DotLottieReact src="/animations/Heart Animated.lottie" autoplay loop={false} />
        ) : (
          <FiHeart className="text-on-surface-variant/70 group-hover/stat:text-red-500 transition-colors" />
        )}
      </div>
      <span className={liked ? "text-red-500 font-bold" : "text-on-surface-variant"}>
        {initialLikes + (liked ? 1 : 0)}
      </span>
    </div>
  );
}

const getCategoryLabel = (id: string, t: any) => {
  if (id === "Technology") return t("catWeb");
  if (id === "Programming") return t("catMobile");
  if (id === "Research") return t("catResearch");
  if (id === "IoT") return t("catIoT");
  if (id === "Multimedia") return t("catDesign");
  return id;
};


const categories = [
  "All Projects",
  "Technology",
  "Programming",
  "Research",
  "IoT",
  "Multimedia",
];

export default function KaryaInovasiPage() {
  const t = useTranslations("KaryaPage");
  const tCard = useTranslations("ProjectCard");
  const locale = useLocale();
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState("All Projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-translate konten karya
  const { data: translatedProjects, isTranslating } = useTranslatedList(
    projects,
    "karya",
    locale,
    ["title", "description"]
  );

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
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('karya')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();

    const channel = supabase
      .channel('realtime_public_karya')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karya' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Filter projects based on category and search (dari data yg sudah diterjemahkan)
  const filteredProjects = translatedProjects.filter((project) => {
    const matchesCategory =
      activeCategory === "All Projects" ||
      project.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination Logic
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <main className="min-h-screen bg-[var(--color-background)] pt-28 pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div id="tour-karya-header" className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-primary)] mb-3 md:mb-4">
              {t("pageTitle")}
            </h1>
            <p className="text-[var(--color-on-surface-variant)] text-sm md:text-lg max-w-2xl leading-relaxed">
              {t("pageSubtitle")}
            </p>
          </div>

          {/* ── CTA BANNER ──────────────────────────────── */}
          <motion.div
            id="tour-karya-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 md:mb-14 relative overflow-hidden rounded-3xl bg-[var(--color-primary)] px-6 py-8 md:px-16 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-lg"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-surface/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-surface/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)]/20 rounded-full blur-2xl pointer-events-none" />

            {/* Lottie Animation */}
            <div className="shrink-0 w-20 h-20 md:w-28 md:h-28">
              <DotLottieReact
                src="/animations/Marketing Campaign - Creative 3D Animation.lottie"
                autoplay
                loop
              />
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left relative z-10">
              <span className="inline-block text-xs font-bold tracking-widest uppercase text-white/60 mb-1.5">{t("ctaBadge")}</span>
              <h2 className="text-xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
                {t("ctaTitle")}<br />
                <span className="text-white/70 font-normal text-sm md:text-lg">{t("ctaDesc1")}</span>
              </h2>
              <p className="text-white/60 text-xs md:text-sm max-w-xl">
                {t("ctaDesc2")}
              </p>
            </div>

            {/* CTA Button */}
            <div className="shrink-0 relative z-10 w-full md:w-auto">
              <Link
                href="/dashboard/upload"
                className="group flex items-center justify-center gap-3 w-full md:w-auto px-8 py-3.5 bg-surface text-[var(--color-primary)] font-extrabold rounded-2xl hover:bg-surface/90 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-sm whitespace-nowrap"
              >
                <FiUpload className="group-hover:-translate-y-0.5 transition-transform" size={18} />
                {t("ctaBtn")}
              </Link>
              <p className="text-[10px] md:text-xs text-white/70 text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                <FiInfo size={12} className="shrink-0" />
                {t("ctaNote")}
              </p>
            </div>
          </motion.div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12">

            {/* Categories */}
            <div id="tour-karya-categories" className="flex flex-row gap-2 overflow-x-auto pb-3 md:pb-0 w-full md:w-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeCategory === category
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "bg-surface text-[var(--color-on-surface-variant)] border border-outline-variant/30 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    }`}
                >
                  {category === "All Projects" ? t("catAll") : getCategoryLabel(category, t)}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div id="tour-karya-search" className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className={`transition-colors ${isSearching ? "text-[var(--color-primary)]" : "text-on-surface-variant/70"}`} />
              </div>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 md:py-3 bg-surface border border-outline-variant/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          {loading || isSearching || isTranslating ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/20 h-80 flex flex-col justify-between animate-pulse">
                  <div className="w-full h-44 bg-surface-variant/60 rounded-xl" />
                  <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4" />
                  <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : paginatedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {paginatedProjects.map((project, index) => {
                const mappedProject: ProjectData = {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  tech_stack: project.tech_stack || [],
                  demo_url: project.live_url,
                  github_url: project.github_url,
                  cover_image: project.image_url,
                  likes_count: project.likes || 0,
                  views_count: project.views || 0,
                  category: project.category,
                  created_at: project.created_at,
                };
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ProjectCard project={mappedProject} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            (() => {
              const isUserSearching = searchQuery.trim() !== "" || debouncedSearchQuery.trim() !== "" || activeCategory !== "All Projects";
              return (
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center gap-2 my-8">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative -my-4">
                    <DotLottieReact
                      src="/animations/Developer.lottie"
                      loop
                      autoplay
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-on-background">
                    {isUserSearching ? t("noKaryaSearch") : t("noKaryaEmpty")}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                    {isUserSearching
                      ? searchQuery
                        ? `${t("noKaryaSearchDesc")} "${searchQuery}".`
                        : `${t("noKaryaSearchDesc")} "${activeCategory}".`
                      : t("noKaryaEmptyDesc")}
                  </p>
                  {isUserSearching ? (
                    <button
                      onClick={() => {
                        setActiveCategory("All Projects");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="mt-3 inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-[var(--color-primary)]/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md"
                    >
                      {t("resetBtn")}
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/upload"
                      className="mt-3 inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-[var(--color-primary)]/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md"
                    >
                      {t("uploadFirstBtn")} <FiArrowRight />
                    </Link>
                  )}
                </div>
              );
            })()
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-[var(--color-primary)] disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
              >
                {tCard("previous")}
              </button>
              {getPageNumbers().map((page, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-[var(--color-primary)] disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
              >
                {tCard("next")}
              </button>
            </div>
          )}

        </div>
      </main>
      <KaryaTourClient />
    </>
  );
}
