"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiBriefcase
} from "react-icons/fi";
import SafeLottie from "@/components/ui/SafeLottie";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";
import AgendaCalendarView from "@/components/agenda/AgendaCalendarView";
import AgendaUpcomingPast from "@/components/agenda/AgendaUpcomingPast";
import AgendaTourClient from "@/components/agenda/AgendaTourClient";
import { useTranslatedList } from "@/hooks/useTranslatedContent";

// Helper: parse tanggal sebagai local date agar tidak terkena UTC timezone shift
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function AgendaPageContent({ data }: { data: AgendaKegiatan[] }) {
  const t = useTranslations("AgendaPage");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTabState] = React.useState<"event" | "volunteer">(tabParam === "volunteer" ? "volunteer" : "event");

  // Pisahkan agenda & volunteer
  const rawAgendas = React.useMemo(() => data.filter((d) => d.type !== "volunteer"), [data]);
  const rawVolunteers = React.useMemo(() => data.filter((d) => d.type === "volunteer"), [data]);

  // Auto-translate konten agenda
  const { data: translatedAgendas, isTranslating: isTranslatingAgendas } = useTranslatedList(
    rawAgendas, "agenda_kegiatan", locale, ["title", "description", "category", "location"]
  );
  // Auto-translate konten volunteer (dengan TTL jika ada deadline)
  const { data: translatedVolunteers, isTranslating: isTranslatingVolunteers } = useTranslatedList(
    rawVolunteers, "agenda_kegiatan", locale, ["title", "description", "category", "location"]
  );

  // Gabungkan kembali
  const translatedData = useMemo(() => [...translatedAgendas, ...translatedVolunteers], [translatedAgendas, translatedVolunteers]);

  React.useEffect(() => {
    setActiveTabState(tabParam === "volunteer" ? "volunteer" : "event");
  }, [tabParam]);

  const setActiveTab = (tab: "event" | "volunteer") => {
    setActiveTabState(tab);
    setSelectedCategory("ALL");
    setCurrentPage(1);
    window.history.replaceState(null, '', `/agenda?tab=${tab}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState("");
  const [debouncedVolunteerQuery, setDebouncedVolunteerQuery] = useState("");
  const [isSearchingVol, setIsSearchingVol] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const EVENT_CATEGORIES = [t("catAll"), t("catCadre"), t("catTech"), t("catSocial"), t("catAcademic"), t("catSport"), t("catArt"), t("catReligion"), t("catEntrepreneur"), t("catOther")];
  const VOLUNTEER_CATEGORIES = [t("catAll"), t("catCommittee"), t("catBoard"), t("catVolunteer"), t("catIntern"), t("catDelegation"), t("catOther")];
  
  const categories = activeTab === 'event' ? EVENT_CATEGORIES : VOLUNTEER_CATEGORIES;

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

  React.useEffect(() => {
    if (!volunteerSearchQuery) {
      setDebouncedVolunteerQuery("");
      setIsSearchingVol(false);
      return;
    }
    setIsSearchingVol(true);
    const timer = setTimeout(() => {
      setDebouncedVolunteerQuery(volunteerSearchQuery);
      setIsSearchingVol(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [volunteerSearchQuery]);

  const getEventStatusType = (dateStr?: string | null, endDateStr?: string | null, timeRange?: string | null): "done" | "live" | "upcoming" => {
    if (!dateStr) return "upcoming";
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const eventDateNorm = parseDateLocal(dateStr);
    const endDateNorm = endDateStr ? parseDateLocal(endDateStr) : parseDateLocal(dateStr);

    // Sudah lewat tanggal terakhir
    if (endDateNorm < today) return "done";

    // Event multi-hari yang sedang berlangsung (hari ini di antara start & end)
    const isMultiDay = endDateStr && endDateStr !== dateStr;
    if (isMultiDay && eventDateNorm < today && today <= endDateNorm) return "live";

    // Event 1 hari: cek jam jika ada time_range
    if (eventDateNorm.getTime() === today.getTime()) {
      if (timeRange) {
        const timeMatch = timeRange.match(/(\d{1,2})[:.](\d{2})\s*(?:-|s\/d|to)\s*(\d{1,2})[:.](\d{2})/i);
        if (timeMatch) {
          const startHour = parseInt(timeMatch[1], 10);
          const startMin  = parseInt(timeMatch[2], 10);
          const endHour   = parseInt(timeMatch[3], 10);
          const endMin    = parseInt(timeMatch[4], 10);
          const eventStart = new Date(today); eventStart.setHours(startHour, startMin, 0, 0);
          const eventEnd   = new Date(today); eventEnd.setHours(endHour, endMin, 0, 0);
          if (now < eventStart) return "upcoming";
          if (now > eventEnd)   return "done";
          return "live";
        }
      }
      return "live";
    }

    return "upcoming";
  };

  const getEventStatus = (dateStr?: string | null, endDateStr?: string | null, timeRange?: string | null) => {
    const st = getEventStatusType(dateStr, endDateStr, timeRange);
    if (st === "done") return t("statusDone");
    if (st === "live") return t("statusLive");
    return t("statusUpcoming");
  };

  const getVolunteerStatusType = (deadlineStr?: string | null): "open" | "closed" => {
    if (!deadlineStr) return "open";
    const deadlineDate = parseDateLocal(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate >= today ? "open" : "closed";
  };

  // Kumpulan semua agenda & volunteer yang dipublikasikan (termasuk yang sudah lewat)
  const allPublishedAgendas = useMemo(() => {
    return translatedData.filter(item => item.type === 'event' && item.is_published);
  }, [translatedData]);

  const allPublishedVolunteers = useMemo(() => {
    return translatedData.filter(item => item.type === 'volunteer' && item.is_published);
  }, [translatedData]);

  // Statistik Event
  const { upcomingCount, pastCount, totalEventCount } = useMemo(() => {
    let up = 0;
    let past = 0;
    allPublishedAgendas.forEach((item) => {
      const st = getEventStatusType(item.date, item.end_date, item.time_range);
      if (st === "done") past++;
      else up++;
    });
    return { upcomingCount: up, pastCount: past, totalEventCount: allPublishedAgendas.length };
  }, [allPublishedAgendas]);

  // Statistik Volunteer
  const { openVolCount, closedVolCount, totalVolCount } = useMemo(() => {
    let open = 0;
    let closed = 0;
    allPublishedVolunteers.forEach((v) => {
      const st = getVolunteerStatusType(v.deadline);
      if (st === "closed") closed++;
      else open++;
    });
    return { openVolCount: open, closedVolCount: closed, totalVolCount: allPublishedVolunteers.length };
  }, [allPublishedVolunteers]);

  // Filter & Sort Logic untuk Agenda
  const filteredAgendas = useMemo(() => {
    return allPublishedAgendas
      .filter((item) => {
        const matchesSearch =
          (item.title || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          (item.description || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        
        const isAllCat = selectedCategory === "ALL" || selectedCategory === t("catAll") || selectedCategory === "Semua";
        const matchesCategory = isAllCat || item.category === selectedCategory;

        const st = getEventStatusType(item.date, item.end_date, item.time_range);
        let matchesStatus = true;
        if (statusFilter === "upcoming") {
          matchesStatus = st === "upcoming" || st === "live";
        } else if (statusFilter === "past") {
          matchesStatus = st === "done";
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const stA = getEventStatusType(a.date, a.end_date, a.time_range);
        const stB = getEventStatusType(b.date, b.end_date, b.time_range);
        const isDoneA = stA === "done";
        const isDoneB = stB === "done";

        const timeA = a.date ? parseDateLocal(a.date).getTime() : 0;
        const timeB = b.date ? parseDateLocal(b.date).getTime() : 0;

        if (statusFilter === "past") {
          return timeB - timeA; // Selesai: terbaru lebih dulu
        }
        if (statusFilter === "upcoming") {
          return timeA - timeB; // Mendatang: paling dekat lebih dulu
        }

        // Default "all": Live/Upcoming dulu (date asc), baru Past (date desc)
        if (!isDoneA && isDoneB) return -1;
        if (isDoneA && !isDoneB) return 1;
        if (!isDoneA && !isDoneB) return timeA - timeB;
        return timeB - timeA;
      });
  }, [debouncedSearchQuery, allPublishedAgendas, selectedCategory, statusFilter, t]);

  // Filter & Sort Logic untuk Volunteer
  const filteredVolunteers = useMemo(() => {
    return allPublishedVolunteers
      .filter((vol) => {
        const matchesSearch =
          (vol.title || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase()) ||
          (vol.category || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase()) ||
          (vol.description || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase());
        
        const isAllCat = selectedCategory === "ALL" || selectedCategory === t("catAll") || selectedCategory === "Semua";
        const matchesCategory = isAllCat || vol.category === selectedCategory;

        const st = getVolunteerStatusType(vol.deadline);
        let matchesStatus = true;
        if (volunteerStatusFilter === "open") matchesStatus = st === "open";
        else if (volunteerStatusFilter === "closed") matchesStatus = st === "closed";

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const stA = getVolunteerStatusType(a.deadline);
        const stB = getVolunteerStatusType(b.deadline);
        const isClosedA = stA === "closed";
        const isClosedB = stB === "closed";

        const timeA = a.deadline ? parseDateLocal(a.deadline).getTime() : 0;
        const timeB = b.deadline ? parseDateLocal(b.deadline).getTime() : 0;

        if (volunteerStatusFilter === "closed") return timeB - timeA;
        if (volunteerStatusFilter === "open") return timeA - timeB;

        if (!isClosedA && isClosedB) return -1;
        if (isClosedA && !isClosedB) return 1;
        if (!isClosedA && !isClosedB) return timeA - timeB;
        return timeB - timeA;
      });
  }, [debouncedVolunteerQuery, allPublishedVolunteers, selectedCategory, volunteerStatusFilter, t]);

  const volunteerOpportunitiesWithDate = useMemo(() => {
    return allPublishedVolunteers.map(vol => ({
      ...vol,
      date: vol.deadline,
      end_date: vol.deadline || undefined
    })) as AgendaKegiatan[];
  }, [allPublishedVolunteers]);

  // Pagination Logic
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredAgendas.length / ITEMS_PER_PAGE) || 1;
  const paginatedAgendas = filteredAgendas.slice(
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
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-20 font-sans overflow-x-hidden w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">

        {/* Header */}
        <header id="tour-agenda-header" className="mb-6 md:mb-10 text-left">
          <h1 className="font-display-lg text-3xl md:text-5xl text-primary mb-2 md:mb-4 font-black tracking-tight leading-tight">
            {t("pageTitle")}
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl text-sm md:text-lg font-light leading-relaxed">
            {t("pageSubtitle")}
          </p>
        </header>

        {/* Tab Navigation */}
        <div id="tour-agenda-tabs" className="flex items-center gap-4 mb-6 md:mb-8 border-b border-outline-variant/30 pb-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("event")}
            className={`pb-2 px-2 text-sm sm:text-base md:text-lg font-bold transition-all whitespace-nowrap ${activeTab === "event" ? "text-primary border-b-4 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
          >
            <span className="hidden sm:inline">{t("tabEventDesk")}</span>
            <span className="sm:hidden">{t("tabEventMob")}</span>
          </button>
          <button
            onClick={() => setActiveTab("volunteer")}
            className={`pb-2 px-2 text-sm sm:text-base md:text-lg font-bold transition-all whitespace-nowrap ${activeTab === "volunteer" ? "text-primary border-b-4 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
          >
            <span className="hidden sm:inline">{t("tabVolDesk")}</span>
            <span className="sm:hidden">{t("tabVolMob")}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div id="tour-agenda-search" className="flex-1 bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 relative">
            <FiSearch size={17} className={`shrink-0 transition-colors ${isSearching || isSearchingVol ? "text-primary" : "text-on-surface-variant"}`} />
            {activeTab === "event" ? (
              <input
                type="text"
                placeholder={t("searchEventPlaceholder")}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="flex-1 bg-transparent text-sm text-on-background placeholder-on-surface-variant/60 focus:outline-none"
              />
            ) : (
              <input
                type="text"
                placeholder={t("searchVolPlaceholder")}
                value={volunteerSearchQuery}
                onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-on-background placeholder-on-surface-variant/60 focus:outline-none"
              />
            )}
            {(isSearching || isSearchingVol) && (
              <div className="flex items-center gap-2 text-xs font-bold text-primary animate-pulse shrink-0 bg-primary/10 px-2.5 py-1 rounded-full">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">{t("searching")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter Tabs (Semua / Akan Datang / Selesai) */}
        {activeTab === "event" && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span>{t("statusFilterAll")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                statusFilter === "all" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {totalEventCount}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter("upcoming"); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "upcoming"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("statusFilterUpcoming")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                statusFilter === "upcoming" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter("past"); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "past"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <FiCheckCircle size={13} className={statusFilter === "past" ? "text-white" : "text-emerald-600"} />
              <span>{t("statusFilterPast")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                statusFilter === "past" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {pastCount}
              </span>
            </button>
          </div>
        )}

        {/* Status Filter Tabs untuk Volunteer (Semua / Dibuka / Ditutup) */}
        {activeTab === "volunteer" && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => { setVolunteerStatusFilter("all"); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                volunteerStatusFilter === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span>{t("statusFilterAll")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                volunteerStatusFilter === "all" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {totalVolCount}
              </span>
            </button>

            <button
              onClick={() => { setVolunteerStatusFilter("open"); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                volunteerStatusFilter === "open"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("statusFilterOpen")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                volunteerStatusFilter === "open" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {openVolCount}
              </span>
            </button>

            <button
              onClick={() => { setVolunteerStatusFilter("closed"); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                volunteerStatusFilter === "closed"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <FiCheckCircle size={13} className={volunteerStatusFilter === "closed" ? "text-white" : "text-on-surface-variant"} />
              <span>{t("statusFilterClosed")}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                volunteerStatusFilter === "closed" ? "bg-white/20 text-white" : "bg-surface-variant/60 text-on-surface-variant"
              }`}>
                {closedVolCount}
              </span>
            </button>
          </div>
        )}

        {/* Category Filter */}
        <div id="tour-agenda-filters" className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat, idx) => {
            const isAllCat = selectedCategory === "ALL" || selectedCategory === t("catAll") || selectedCategory === "Semua";
            const isSelected = idx === 0 ? isAllCat : selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(idx === 0 ? "ALL" : cat); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-secondary text-white shadow-md"
                    : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-secondary hover:text-secondary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Spacer for volunteer tab */}
        {activeTab === "volunteer" && <div className="mb-2" />}

        {activeTab === "event" && (
          <div className="flex flex-col lg:flex-row gap-8 mt-4 mb-16 items-start">
            {/* Left Column: Grid */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {isSearching || isTranslatingAgendas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 h-80 flex flex-col justify-between animate-pulse">
                    <div className="w-full h-44 bg-surface-variant/60 rounded-xl" />
                    <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4" />
                    <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
                    <div className="h-4 bg-surface-variant/40 rounded-md w-1/3 mt-2" />
                  </div>
                ))}
              </div>
            ) : filteredAgendas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedAgendas.map((agenda, index) => {
                  const eventStatus = getEventStatus(agenda.date, agenda.end_date, agenda.time_range);
                  const statusType = getEventStatusType(agenda.date, agenda.end_date, agenda.time_range);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      key={agenda.id}
                    >
                      <Link
                        href={`/agenda/${agenda.id}?from=agenda-event`}
                        className={`group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col h-full ${
                          statusType === "done" ? "opacity-90 hover:opacity-100" : ""
                        }`}
                      >
                        {/* Image */}
                        <div className="h-44 md:h-48 overflow-hidden bg-surface-variant relative shrink-0">
                          <Image
                            src={agenda.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"}
                            alt={agenda.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              statusType === "done" ? "grayscale-[25%] group-hover:grayscale-0" : ""
                            }`}
                          />
                          <div className="absolute top-3.5 left-3.5 bg-surface/90 backdrop-blur-sm text-secondary text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider">
                            {agenda.category}
                          </div>
                          {statusType === "live" && (
                            <div className="absolute top-3.5 right-3.5 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> {t("statusLive").toUpperCase()}
                            </div>
                          )}
                          {statusType === "done" && (
                            <div className="absolute top-3.5 right-3.5 bg-surface/90 backdrop-blur-md text-on-surface-variant border border-outline-variant/30 text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <FiCheckCircle size={12} className="text-emerald-500" /> {t("statusDone")}
                            </div>
                          )}
                          {statusType === "upcoming" && (
                            <div className="absolute top-3.5 right-3.5 bg-primary/90 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <FiClock size={12} /> {t("statusUpcoming")}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6 flex flex-col flex-grow">
                          <h4 className="font-bold text-base md:text-xl text-on-background group-hover:text-primary transition-colors mb-3 md:mb-4 line-clamp-2">
                            {agenda.title}
                          </h4>

                          <div className="flex flex-col gap-1.5 md:gap-2 text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6 flex-grow">
                            <span className="flex items-center gap-2">
                              <FiCalendar className="text-[var(--color-secondary)] shrink-0" size={16} />
                              {agenda.end_date && agenda.end_date !== agenda.date
                                ? `${new Date(agenda.date!).getDate()} - ${formatDateToIndo(agenda.end_date)}`
                                : formatDateToIndo(agenda.date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <FiClock size={13} className="text-primary shrink-0" /> {agenda.time_range}
                            </span>
                            <span className="flex items-center gap-2">
                              <FiMapPin size={13} className="text-primary shrink-0" /> {agenda.location}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 mt-auto">
                            <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                              {statusType === "done" && <FiCheckCircle size={11} className="text-emerald-500" />}
                              {statusType === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                              {statusType === "upcoming" && <FiClock size={11} className="text-primary" />}
                              {eventStatus}
                            </span>
                            <span className="text-primary text-xs md:text-sm font-bold group-hover:text-secondary transition-colors flex items-center gap-1.5">
                              {statusType === "done" && agenda.gallery && agenda.gallery.length > 0
                                ? t("viewDocs")
                                : t("detailEvent")
                              }
                              <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              debouncedSearchQuery ? (
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2 w-full">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                    <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-on-background">
                    {t("noEventSearchTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                    {`${t("noEventSearchDesc")} "${debouncedSearchQuery}".`}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2 w-full">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                    <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-on-background">
                    {statusFilter === "upcoming" ? t("emptyUpcomingEvent") : statusFilter === "past" ? t("emptyPastEvent") : t("noEventEmptyTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                    {statusFilter === "upcoming" ? t("noUpcomingDesc") : statusFilter === "past" ? t("noPastDesc") : t("noEventEmptyDesc")}
                  </p>
                </div>
              )
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
                >
                  {t("previous")}
                </button>
                {getPageNumbers().map((page, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
                >
                  {t("next")}
                </button>
              </div>
            )}
            
            {/* Upcoming and Past Events Overview */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-on-background flex items-center gap-2">
                    <FiCalendar className="text-primary" />
                    {t("overviewTitle")}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t("upcomingTitle")} &bull; {t("pastTitle")}
                  </p>
                </div>
              </div>
              <AgendaUpcomingPast agendas={allPublishedAgendas} />
            </div>
            </div>

            {/* Right Column: Calendar */}
            <div className="w-full lg:w-1/3 sticky top-24">
              <AgendaCalendarView agendas={allPublishedAgendas} />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB VOLUNTEER                                             */}
        {/* ========================================================= */}
        {activeTab === "volunteer" && (
          <div className="flex flex-col lg:flex-row gap-8 mt-4 mb-16 items-start">
            {/* Left Column: Grid */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isSearchingVol || isTranslatingVolunteers ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 h-80 flex flex-col justify-between animate-pulse">
                  <div className="w-full h-44 bg-surface-variant/60 rounded-xl" />
                  <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4" />
                  <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
                  <div className="h-4 bg-surface-variant/40 rounded-md w-1/3 mt-2" />
                </div>
              ))
            ) : filteredVolunteers.length === 0 ? (
              debouncedVolunteerQuery ? (
                <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2 w-full">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                    <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-on-background">
                    {t("noVolSearchTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                    {`${t("noVolSearchDesc")} "${debouncedVolunteerQuery}".`}
                  </p>
                </div>
              ) : (
                <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2 w-full">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                    <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-on-background">
                    {volunteerStatusFilter === "closed" ? t("emptyPastDeadline") : t("noVolEmptyTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                    {t("noVolEmptyDesc")}
                  </p>
                </div>
              )
            ) : (
              filteredVolunteers.map((vol, index) => {
                const isClosed = getVolunteerStatusType(vol.deadline) === "closed";
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    key={vol.id}
                  >
                    <div className={`group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col ${
                      isClosed ? "opacity-85 hover:opacity-100" : ""
                    }`}>
                      {/* Image */}
                      <div className="relative aspect-[4/3] rounded-t-3xl overflow-hidden bg-surface-variant group-hover:shadow-inner">
                        <Image
                          src={vol.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"}
                          alt={vol.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isClosed ? "grayscale-[25%] group-hover:grayscale-0" : ""
                          }`}
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        {vol.is_urgent && !isClosed && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <FiClock size={10} /> {t("urgent")}
                          </span>
                        )}
                        {isClosed && (
                          <span className="absolute top-3 right-3 bg-surface/90 backdrop-blur-md text-on-surface-variant border border-outline-variant/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <FiCheckCircle size={10} className="text-emerald-500" /> {t("closedPosition")}
                          </span>
                        )}
                      </div>

                      <div className="p-4 md:p-6 flex flex-col flex-grow">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1 md:mb-2">{vol.category}</span>
                        <h4 className="font-bold text-base md:text-lg text-on-background group-hover:text-primary transition-colors mb-1 md:mb-2">{vol.title}</h4>
                        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mb-4 md:mb-6 flex-grow line-clamp-3">{vol.description}</p>

                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4 md:mb-5">
                          <FiClock size={13} className={isClosed ? "text-on-surface-variant" : "text-primary"} />
                          <span>{t("deadline")} <span className="font-semibold text-on-background">{vol.deadline}</span></span>
                        </div>

                        <Link
                          href={`/agenda/${vol.id}?from=agenda-volunteer`}
                          className={`w-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold py-2.5 md:py-3 rounded-xl transition-all duration-300 mt-auto ${
                            isClosed
                              ? "bg-surface-variant/60 text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant"
                              : "bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md"
                          }`}
                        >
                          <FiCheckCircle size={15} className={isClosed ? "text-on-surface-variant" : "text-white"} />
                          {isClosed ? t("closedPosition") : t("applyPosition")}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
              </div>
              
              {/* Upcoming and Past Deadlines Overview */}
              <div className="mt-8 pt-6 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-on-background flex items-center gap-2">
                      <FiBriefcase className="text-primary" />
                      {t("overviewVolunteerTitle")}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t("upcomingDeadlineTitle")} &bull; {t("pastDeadlineTitle")}
                    </p>
                  </div>
                </div>
                <AgendaUpcomingPast agendas={volunteerOpportunitiesWithDate} isVolunteer />
              </div>
            </div>

            {/* Right Column: Calendar */}
            <div className="w-full lg:w-1/3 sticky top-24">
              <AgendaCalendarView agendas={volunteerOpportunitiesWithDate} isVolunteer />
            </div>
          </div>
        )}

      </main>
      
      <AgendaTourClient />
    </div>
  );
}

export default function AgendaClient({ data }: { data: AgendaKegiatan[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">Memuat...</div>}>
      <AgendaPageContent data={data} />
    </Suspense>
  );
}
