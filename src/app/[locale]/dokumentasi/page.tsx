"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";

import { getKegiatans } from "@/app/(internal)/admin/kegiatan/actions";
import { useTranslations, useLocale } from "next-intl";

// ============================================================
// DATA (Now fetched dynamically)
// ============================================================



const ITEMS_PER_PAGE = 6;

// ============================================================
// COMPONENTS
// ============================================================

function MediaBadge({ count }: { count: number | string }) {
  const t = useTranslations("DokumentasiPage");
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      {count} {t("photoCount")}
    </div>
  );
}

function KategoriChip({ kategori }: { kategori: string }) {
  const colorMap: Record<string, string> = {
    Event: "text-[#f2791e]",
    Seminar: "text-[#f2791e]",
    Sosial: "text-[#f2791e]",
    Internal: "text-[#1b4086]",
    Galeri: "text-[#006684]",
  };
  return (
    <span className={`text-xs font-bold uppercase tracking-wider ${colorMap[kategori] ?? "text-secondary"}`}>
      {kategori}
    </span>
  );
}

import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import DokumentasiTourClient from "@/components/dokumentasi/DokumentasiTourClient";

function DocCard({ item }: { item: any }) {
  const t = useTranslations("DokumentasiPage");
  let cat = item.kategori;
  const catKey = `category${cat}` as any;
  try {
    if (t.has(catKey)) {
      const tr = t(catKey);
      if (!tr.includes("DokumentasiPage.category")) cat = tr;
    }
  } catch {
    // ignore
  }

  return (
    <Link href={`/agenda/${item.id}?from=dokumentasi`} className="block w-full">
      <div className="group relative rounded-2xl overflow-hidden shadow-md cursor-pointer h-[260px] md:h-[300px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

        {/* Full-bleed Image */}
        <Image
          src={item.image}
          alt={item.judul}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Media badge top-right */}
        <div className="absolute top-3 right-3 z-10">
          <MediaBadge count={item.mediaCount} />
        </div>

        {/* Category badge top-left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-surface/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/20">
            {cat}
          </span>
        </div>

        {/* Text content at bottom */}
        <div className="relative z-10 p-4 md:p-5">
          <h3 className="font-bold text-white text-sm md:text-base leading-snug mb-2 line-clamp-2 group-hover:text-secondary transition-colors duration-200">
            {item.judul}
          </h3>
          <div className="flex items-center gap-1.5 text-white/70 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {item.tanggal}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {/* Prev */}
      <button
        onClick={() => onPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Halaman sebelumnya"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-on-surface-variant text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`w-9 h-9 rounded-full text-sm font-bold transition-all duration-200 ${currentPage === p
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "border border-outline-variant/40 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary"
              }`}
            aria-label={`Halaman ${p}`}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Halaman berikutnya"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function DokumentasiPage() {
  const t = useTranslations("DokumentasiPage");
  const locale = useLocale();
  const { useTranslatedList } = require("@/hooks/useTranslatedContent");
  const [activeFilter, setActiveFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dokumentasiData, setDokumentasiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
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

  const [rawFilteredData, setRawFilteredData] = useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const data = await getKegiatans();
        const filtered = data.filter(item => {
          if (!item.is_published) return false;
          const isFinished = item.date && (new Date(item.date).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0));
          if (!isFinished) return false;
          return Array.isArray(item.gallery) && item.gallery.length > 0;
        });
        setRawFilteredData(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const { data: translatedRawData, isTranslating } = useTranslatedList(
    rawFilteredData, "agenda_kegiatan", locale, ["title", "category"]
  );

  React.useEffect(() => {
    if (translatedRawData.length > 0 || (rawFilteredData.length === 0 && !isLoading)) {
      const mapped = translatedRawData.map((item: any) => ({
        id: item.id,
        kategori: item.category || "Event",
        subKategori: item.category || "General",
        judul: item.title,
        tanggal: item.date ? new Date(item.date).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'ja' ? 'ja-JP' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "",
        mediaCount: item.gallery?.length || 0,
        image: item.image_url || ((item.gallery && item.gallery.length > 0) ? item.gallery[0] : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"),
        tags: [(item.category || "event").toLowerCase(), "semua"]
      }));
      setDokumentasiData(mapped);
    }
  }, [translatedRawData, locale, isLoading, rawFilteredData.length]);

  const dynamicFilterTabs = useMemo(() => {
    const uniqueCategories = new Set<string>();
    dokumentasiData.forEach((item) => {
      if (item.kategori) {
        uniqueCategories.add(item.kategori);
      }
    });

    const tabs = [{ label: t("categoryAll"), value: "semua" }];

    Array.from(uniqueCategories).sort().forEach((cat) => {
      // Map category name if exists, else keep original
      const catKey = `category${cat}` as any;
      let mappedLabel = cat;
      try {
        if (t.has(catKey)) {
          const tr = t(catKey);
          if (!tr.includes("DokumentasiPage.category")) mappedLabel = tr;
        }
      } catch {
        // ignore
      }
      tabs.push({ label: mappedLabel, value: cat.toLowerCase() });
    });

    return tabs;
  }, [dokumentasiData, t]);

  const filtered = useMemo(() => {
    return dokumentasiData.filter((item) => {
      const matchFilter = item.tags.includes(activeFilter);
      const matchSearch =
        debouncedSearchQuery === "" ||
        item.judul.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.kategori.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activeFilter, debouncedSearchQuery, dokumentasiData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleFilter = (val: string) => {
    setActiveFilter(val);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const totalPhotos = useMemo(() => {
    return dokumentasiData.reduce((acc, item) => acc + (typeof item.mediaCount === 'number' ? item.mediaCount : 0), 0);
  }, [dokumentasiData]);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-background overflow-hidden">
      {/* ── HERO ── */}
      <section id="tour-dokumentasi-header" className="relative px-5 md:px-10 max-w-7xl mx-auto pt-12 pb-16 text-center">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-on-background mb-5 animate-init-fade-up anim-delay-100 leading-tight">
          <span className="text-secondary">{t("heroTitlePart1")}</span>{" "}
          <span className="text-primary">{t("heroTitlePart2")}</span>
        </h1>

        {/* Sub */}
        <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed text-base md:text-lg animate-init-fade-up anim-delay-200">
          {t("heroSubtitle")}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-8 animate-init-fade-up anim-delay-300">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {totalPhotos} {t("photoCount")}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent mb-12" />

      {/* ── FILTER & SEARCH BAR ── */}
      <section id="tour-dokumentasi-search" className="px-5 md:px-10 max-w-7xl mx-auto mb-8">
        {/* Scrollable filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          {dynamicFilterTabs.map((tab) => (
            <button
              key={tab.value}
              id={`filter-${tab.value}`}
              onClick={() => handleFilter(tab.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${activeFilter === tab.value
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-surface text-on-surface-variant border border-outline-variant/40 hover:border-primary hover:text-primary"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isSearching ? "text-primary" : "text-on-surface-variant"}`}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="search-dokumentasi"
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl border border-outline-variant/40 bg-surface text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          {isSearching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>

      {/* ── GRID ── */}
      <section id="tour-dokumentasi-grid" className="px-5 md:px-10 max-w-7xl mx-auto">
        {isLoading || isSearching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/20 h-72 flex flex-col justify-between animate-pulse">
                <div className="w-full h-44 bg-surface-variant/60 rounded-xl" />
                <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-3" />
                <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          (() => {
            const isUserSearching = searchQuery.trim() !== "" || debouncedSearchQuery.trim() !== "" || activeFilter !== "semua";
            return (
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center gap-2 my-8">
                <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                  <DotLottieReact
                    src="/animations/Calendar.lottie"
                    loop
                    autoplay
                  />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-on-background">
                  {isUserSearching ? t("notFoundTitle") : t("emptyTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                  {isUserSearching
                    ? searchQuery
                      ? t("notFoundDescSearch", { query: searchQuery })
                      : t("notFoundDescFilter", { filter: activeFilter })
                    : t("emptyDesc")}
                </p>
                {isUserSearching && (
                  <button
                    onClick={() => {
                      setActiveFilter("semua");
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="mt-3 inline-flex items-center gap-2 bg-primary text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md"
                  >
                    {t("resetBtn")}
                  </button>
                )}
              </div>
            );
          })()
        ) : (
          <div className="flex flex-row overflow-x-auto gap-5 pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0 flex-nowrap sm:flex-wrap">
            {paginated.map((item) => (
              <div key={item.id} className="w-[75vw] sm:w-auto shrink-0 sm:shrink">
                <DocCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination — hidden on mobile (cards are swipeable) */}
        {totalPages > 1 && (
          <div className="hidden sm:block">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
          </div>
        )}
      </section>

      <DokumentasiTourClient />
    </div>
  );
}
