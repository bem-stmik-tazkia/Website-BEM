"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiZap,
  FiCamera,
  FiUsers,
  FiStar,
} from "react-icons/fi";

// ─── DATA ───────────────────────────────────────────────────────────────────

const volunteer = [
  {
    id: 1,
    category: "KOORDINASI ACARA",
    title: "Sponsorship Liaison",
    desc: "Mengamankan pendanaan & kemitraan untuk event mahasiswa.",
    deadline: "31 Jan 2025",
    isUrgent: true,
    imgUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=80",
  },
  {
    id: 2,
    category: "KREATIF & KONTEN",
    title: "Content Creator",
    desc: "Membuat konten visual menarik untuk media sosial BEM.",
    deadline: "15 Feb 2025",
    isUrgent: false,
    imgUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80",
  },
  {
    id: 3,
    category: "TEKNOLOGI & WEB",
    title: "Web Developer Assistant",
    desc: "Membantu pengembangan fitur website BEM STMIK Tazkia.",
    deadline: "20 Feb 2025",
    isUrgent: false,
    imgUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
  },
];

const events = [
  {
    id: 1,
    category: "Workshop",
    title: "BEM Leadership Training 2024",
    date: "20–21 Agustus 2024",
    time: "08:00 – 15:00 WIB",
    location: "Auditorium STMIK",
    isLive: true,
    imgUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  },
  {
    id: 2,
    category: "Workshop",
    title: "UI/UX Design Bootcamp 2024",
    date: "24 Agustus 2024",
    time: "09:00 – 14:00 WIB",
    location: "Auditorium STMIK",
    isLive: false,
    imgUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80",
  },
  {
    id: 3,
    category: "Kompetisi",
    title: "Tazkia IT Hackathon 2024",
    date: "10 September 2024",
    time: "08:00 – 20:00 WIB",
    location: "Lab Komputer Terpadu",
    isLive: false,
    imgUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  },
];

const dokumentasi = [
  {
    id: 1,
    title: "Malam Apresiasi Mahasiswa 2024",
    imgUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    category: "Festival",
  },
  {
    id: 2,
    title: "Annual Hackathon 2024",
    imgUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    category: "Kompetisi",
  },
  {
    id: 3,
    title: "Mental Health Awareness Week",
    imgUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    category: "Seminar",
  },
  {
    id: 4,
    title: "BEM Leadership Training",
    imgUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    category: "Workshop",
  },
];

// ─── PANEL DEFINITIONS ──────────────────────────────────────────────────────

const panels = [
  {
    id: "dokumentasi",
    label: "Dokumentasi",
    icon: <FiCamera size={14} />,
    accent: "#7c3aed",
    accentLight: "#ede9fe",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    icon: <FiUsers size={14} />,
    accent: "#f2791e",
    accentLight: "#ffdbca",
  },
  {
    id: "event",
    label: "Event",
    icon: <FiZap size={14} />,
    accent: "#006684",
    accentLight: "#bce9ff",
  },
];

const AUTOPLAY_INTERVAL = 5000;

// ─── PANEL CONTENT COMPONENTS ───────────────────────────────────────────────

function KaryaPanel() {
  return null;
}

function VolunteerPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-extrabold text-secondary leading-tight">Volunteer</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Bergabung & tinggalkan jejak nyata</p>
        </div>
        <Link href="/volunteer" className="group flex items-center gap-1 text-secondary text-xs font-bold hover:text-primary transition-colors whitespace-nowrap">
          Lihat Semua <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" size={12} />
        </Link>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        {volunteer.map((vol) => (
          <div
            key={vol.id}
            className="group flex gap-3 items-center p-3 rounded-2xl bg-surface border border-outline-variant/20 hover:border-secondary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-variant/30 relative">
              <img src={vol.imgUrl} alt={vol.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {vol.isUrgent && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">SEGERA</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-secondary/70 uppercase tracking-wider">{vol.category}</span>
              <p className="font-bold text-sm text-on-background group-hover:text-secondary transition-colors leading-tight">{vol.title}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Deadline: <span className="font-semibold">{vol.deadline}</span></p>
            </div>
            <Link href={`/volunteer/${vol.id}`} className="shrink-0 bg-secondary text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full hover:bg-secondary/90 transition-colors">
              Apply
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-extrabold text-tertiary leading-tight">Event</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Kegiatan & agenda terkini BEM</p>
        </div>
        <Link href="/agenda" className="group flex items-center gap-1 text-tertiary text-xs font-bold hover:text-primary transition-colors whitespace-nowrap">
          Lihat Semua <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" size={12} />
        </Link>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/agenda/${ev.id}`}
            className="group flex gap-3 items-center p-3 rounded-2xl bg-surface border border-outline-variant/20 hover:border-tertiary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-variant/30 relative">
              <img src={ev.imgUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {ev.isLive && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <FiZap size={7} /> LIVE
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-tertiary/70 uppercase tracking-wider">{ev.category}</span>
              <p className="font-bold text-sm text-on-background group-hover:text-tertiary transition-colors leading-tight line-clamp-1">{ev.title}</p>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><FiCalendar size={9} /> {ev.date}</span>
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><FiMapPin size={9} /> {ev.location}</span>
              </div>
            </div>
            <FiArrowRight size={14} className="text-outline shrink-0 group-hover:text-tertiary group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DokumentasiPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-extrabold" style={{ color: "#7c3aed" }}>Dokumentasi</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Momen & kenangan terbaik BEM</p>
        </div>
        <Link href="/dokumentasi" className="group flex items-center gap-1 text-xs font-bold transition-colors whitespace-nowrap" style={{ color: "#7c3aed" }}>
          Lihat Semua <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {dokumentasi.map((doc, i) => (
          <Link
            key={doc.id}
            href="/dokumentasi"
            className={`group relative overflow-hidden rounded-2xl bg-surface-variant/30 ${i === 0 ? "row-span-2" : ""}`}
            style={{ minHeight: i === 0 ? "100%" : "80px" }}
          >
            <img
              src={doc.imgUrl}
              alt={doc.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              style={{ position: "absolute", inset: 0 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-2">
              <span className="text-[9px] font-bold text-purple-300 uppercase block">{doc.category}</span>
              <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{doc.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const panelComponents = [DokumentasiPanel, VolunteerPanel, EventPanel];

// ─── MAIN CAROUSEL ──────────────────────────────────────────────────────────

export default function HomepageCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStart = useRef<number | null>(null);

  const goTo = useCallback((index: number, dir?: number) => {
    const d = dir ?? (index > active ? 1 : -1);
    setDirection(d);
    setActive(index);
    setProgress(0);
  }, [active]);

  const next = useCallback(() => {
    goTo((active + 1) % panels.length, 1);
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + panels.length) % panels.length, -1);
  }, [active, goTo]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next]);

  // Progress bar
  useEffect(() => {
    setProgress(0);
    if (paused) return;
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100));
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [active, paused]);

  // Drag / swipe
  const handleDragStart = (clientX: number) => { dragStart.current = clientX; };
  const handleDragEnd = (clientX: number) => {
    if (dragStart.current === null) return;
    const diff = dragStart.current - clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    dragStart.current = null;
  };

  const PanelComponent = panelComponents[active];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section
      className="py-10 md:py-16 bg-surface-container-lowest"
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(true);
      }}
      onMouseLeave={() => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(false);
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-background leading-tight">
              Jelajahi BEM
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Geser untuk menjelajahi karya, event, volunteer & dokumentasi</p>
          </div>
          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Sebelumnya"
              className="w-9 h-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Berikutnya"
              className="w-9 h-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {panels.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border"
              style={
                active === i
                  ? { backgroundColor: p.accent, color: "#fff", borderColor: p.accent }
                  : { backgroundColor: "#fff", color: "#44474f", borderColor: "#c5c6d0" }
              }
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Carousel window */}
        <div
          className="relative overflow-hidden rounded-3xl bg-[#f3f3fa] border border-outline-variant/20 shadow-sm"
          style={{ minHeight: 340 }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseUp={(e) => handleDragEnd(e.clientX)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-0.5 z-20" style={{ width: `${progress}%`, backgroundColor: panels[active].accent, transition: "width 50ms linear" }} />

          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 36, mass: 0.8 }}
              className="p-5 sm:p-7 md:p-8"
              style={{ willChange: "transform" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40) next();
                if (info.offset.x > 40) prev();
              }}
            >
              <PanelComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {panels.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              aria-label={p.label}
              className="transition-all duration-300 rounded-full"
              style={{
                width: active === i ? 24 : 8,
                height: 8,
                backgroundColor: active === i ? p.accent : "#c5c6d0",
              }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
