"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiGrid
} from "react-icons/fi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";
import AgendaCalendarView from "@/components/agenda/AgendaCalendarView";



function AgendaPageContent({ data }: { data: AgendaKegiatan[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTabState] = React.useState<"event" | "volunteer">(tabParam === "volunteer" ? "volunteer" : "event");

  React.useEffect(() => {
    setActiveTabState(tabParam === "volunteer" ? "volunteer" : "event");
  }, [tabParam]);

  const setActiveTab = (tab: "event" | "volunteer") => {
    setActiveTabState(tab);
    window.history.replaceState(null, '', `/agenda?tab=${tab}`);
  };

  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState("");
  const [debouncedVolunteerQuery, setDebouncedVolunteerQuery] = useState("");
  const [isSearchingVol, setIsSearchingVol] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const EVENT_CATEGORIES = ['Semua', 'Kaderisasi', 'Teknologi', 'Sosial Masyarakat', 'Akademik & Pendidikan', 'Olahraga', 'Seni & Budaya', 'Keagamaan', 'Kewirausahaan', 'Lainnya'];
  const VOLUNTEER_CATEGORIES = ['Semua', 'Kepanitiaan', 'Pengurus BEM', 'Relawan / Volunteer', 'Magang / Internship', 'Delegasi / Lomba', 'Lainnya'];
  
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

  const agendas = data.filter(item => {
    if (item.type !== 'event' || !item.is_published) return false;

    // Sembunyikan event yang sudah selesai (akan dipindahkan ke Dokumentasi)
    if (item.date) {
      const eventDate = new Date(item.date);
      const today = new Date();
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) return false;
    }

    return true;
  });

  const volunteerOpportunities = data.filter(item => {
    if (item.type !== 'volunteer' || !item.is_published) return false;
    if (!item.deadline) return true;
    const deadlineDate = new Date(item.deadline);
    const today = new Date();
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return deadlineDate >= today;
  });

  const getEventStatus = (dateStr?: string | null) => {
    if (!dateStr) return "Akan Datang";
    const eventDate = new Date(dateStr);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) return "Selesai";
    if (eventDate.getTime() === today.getTime()) return "Live";
    return "Akan Datang";
  };

  // Filter Logic untuk Agenda
  const filteredAgendas = useMemo(() => {
    return agendas.filter((item) => {
      const matchesSearch =
        (item.title || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchQuery, agendas, selectedCategory]);

  // Filter Logic untuk Volunteer
  const filteredVolunteers = useMemo(() => {
    return volunteerOpportunities.filter((vol) => {
      const matchesSearch =
        (vol.title || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase()) ||
        (vol.category || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase()) ||
        (vol.description || "").toLowerCase().includes(debouncedVolunteerQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "Semua" || vol.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [debouncedVolunteerQuery, volunteerOpportunities, selectedCategory]);

  const volunteerOpportunitiesWithDate = volunteerOpportunities.map(vol => ({
    ...vol,
    date: vol.deadline
  }));

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
        <header className="mb-6 md:mb-10 text-left">
          <h1 className="font-display-lg text-3xl md:text-5xl text-primary mb-2 md:mb-4 font-black tracking-tight leading-tight">
            Agenda Kegiatan BEM
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl text-sm md:text-lg font-light leading-relaxed">
            Ikuti berbagai acara, kompetisi, dan program rekrutmen terbaru yang diselenggarakan oleh BEM STMIK Tazkia.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-outline-variant/30 pb-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("event")}
            className={`pb-2 px-2 text-sm sm:text-base md:text-lg font-bold transition-all whitespace-nowrap ${activeTab === "event" ? "text-primary border-b-4 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
          >
            <span className="hidden sm:inline">Agenda & Event</span>
            <span className="sm:hidden">Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab("volunteer")}
            className={`pb-2 px-2 text-sm sm:text-base md:text-lg font-bold transition-all whitespace-nowrap ${activeTab === "volunteer" ? "text-primary border-b-4 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
          >
            <span className="hidden sm:inline">Open Recruitment & Volunteer</span>
            <span className="sm:hidden">Oprec & Volunteer</span>
          </button>
        </div>

        {/* Search Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <div className="flex-1 bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 relative">
            <FiSearch size={17} className={`shrink-0 transition-colors ${isSearching || isSearchingVol ? "text-primary" : "text-on-surface-variant"}`} />
            {activeTab === "event" ? (
              <input
                type="text"
                placeholder="Cari agenda atau event..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="flex-1 bg-transparent text-sm text-on-background placeholder-on-surface-variant/60 focus:outline-none"
              />
            ) : (
              <input
                type="text"
                placeholder="Cari posisi volunteer atau rekrutmen..."
                value={volunteerSearchQuery}
                onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-on-background placeholder-on-surface-variant/60 focus:outline-none"
              />
            )}
            {(isSearching || isSearchingVol) && (
              <div className="flex items-center gap-2 text-xs font-bold text-primary animate-pulse shrink-0 bg-primary/10 px-2.5 py-1 rounded-full">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Mencari...</span>
              </div>
            )}
          </div>
          {/* View Mode Toggle Removed */}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-secondary text-white shadow-md"
                  : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-secondary hover:text-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>


        {/* Spacer for volunteer tab */}
        {activeTab === "volunteer" && <div className="mb-6" />}

        {activeTab === "event" && (
          <div className="flex flex-col lg:flex-row gap-8 mt-4 mb-16 items-start">
            {/* Left Column: Grid */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {isSearching ? (
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
                  const eventStatus = getEventStatus(agenda.date);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      key={agenda.id}
                    >
                      <Link
                        href={`/agenda/${agenda.id}?from=agenda-event`}
                        className="group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col h-full"
                      >
                        {/* Image */}
                        <div className="h-44 md:h-48 overflow-hidden bg-surface-variant relative shrink-0">
                          <img src={agenda.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} alt={agenda.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute top-3.5 left-3.5 bg-surface/90 backdrop-blur-sm text-secondary text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider">
                            {agenda.category}
                          </div>
                          {eventStatus === 'Live' && (
                            <div className="absolute top-3.5 right-3.5 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                            </div>
                          )}
                          {eventStatus === 'Selesai' && (
                            <div className="absolute top-3.5 right-3.5 bg-surface-variant/90 text-on-surface-variant text-[10px] md:text-xs font-bold px-2.5 py-1 md:py-1.5 rounded-full uppercase tracking-wider">
                              Selesai
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
                              <FiCalendar className="text-[var(--color-secondary)] shrink-0" size={16} /> {formatDateToIndo(agenda.date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <FiClock size={13} className="text-primary shrink-0" /> {agenda.time_range}
                            </span>
                            <span className="flex items-center gap-2">
                              <FiMapPin size={13} className="text-primary shrink-0" /> {agenda.location}
                            </span>
                          </div>

                          <div className="flex items-center justify-end pt-3 border-t border-outline-variant/20 mt-auto">
                            <span className="text-primary text-xs md:text-sm font-bold group-hover:text-secondary transition-colors flex items-center gap-1.5">
                              {eventStatus === 'Selesai' && agenda.gallery && agenda.gallery.length > 0
                                ? "Lihat Dokumentasi"
                                : "Detail Event"
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
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2">
                <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                  <DotLottieReact src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-on-background">
                  {searchQuery ? "Agenda Tidak Ditemukan" : "Belum Ada Agenda & Event"}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                  {searchQuery
                    ? `Tidak ada agenda atau event yang sesuai dengan pencarian "${searchQuery}".`
                    : "Belum ada agenda kegiatan yang dijadwalkan saat ini. Pantau terus halaman ini!"}
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:hover:text-on-surface-variant transition-colors"
                >
                  Previous
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
                  Next
                </button>
              </div>
            )}
            </div>

            {/* Right Column: Calendar */}
            <div className="w-full lg:w-1/3 sticky top-24">
              <AgendaCalendarView agendas={agendas} />
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
            {isSearchingVol ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 h-80 flex flex-col justify-between animate-pulse">
                  <div className="w-full h-44 bg-surface-variant/60 rounded-xl" />
                  <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4" />
                  <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2" />
                  <div className="h-4 bg-surface-variant/40 rounded-md w-1/3 mt-2" />
                </div>
              ))
            ) : filteredVolunteers.length === 0 ? (
              <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2 w-full">
                <div className="w-36 h-36 sm:w-44 sm:h-44 relative -my-3">
                  <DotLottieReact src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-on-background">
                  {volunteerSearchQuery ? "Posisi Tidak Ditemukan" : "Belum Ada Lowongan Volunteer"}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
                  {volunteerSearchQuery
                    ? `Tidak ada posisi volunteer yang sesuai dengan pencarian "${volunteerSearchQuery}".`
                    : "Saat ini belum ada posisi rekrutmen atau relawan terbuka. Pantau terus halaman ini!"}
                </p>
              </div>
            ) : (
              filteredVolunteers.map((vol, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={vol.id}
                >
                  <div className="group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-[4/3] rounded-t-3xl overflow-hidden bg-surface-variant group-hover:shadow-inner">
                      <img src={vol.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} alt={vol.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      {vol.is_urgent && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <FiClock size={10} /> SEGERA
                        </span>
                      )}
                    </div>

                    <div className="p-4 md:p-6 flex flex-col flex-grow">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1 md:mb-2">{vol.category}</span>
                      <h4 className="font-bold text-base md:text-lg text-on-background group-hover:text-primary transition-colors mb-1 md:mb-2">{vol.title}</h4>
                      <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mb-4 md:mb-6 flex-grow line-clamp-3">{vol.description}</p>

                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4 md:mb-5">
                        <FiClock size={13} className="text-primary" />
                        <span>Deadline: <span className="font-semibold text-on-background">{vol.deadline}</span></span>
                      </div>

                      <Link href={`/agenda/${vol.id}?from=agenda-volunteer`}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs md:text-sm font-bold py-2.5 md:py-3 rounded-xl hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 mt-auto"
                      >
                        <FiCheckCircle size={15} /> Apply Posisi
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
              </div>
            </div>

            {/* Right Column: Calendar */}
            <div className="w-full lg:w-1/3 sticky top-24">
              <AgendaCalendarView agendas={volunteerOpportunitiesWithDate} isVolunteer />
            </div>
          </div>
        )}

      </main>
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
