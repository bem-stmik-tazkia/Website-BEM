"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { FiCalendar, FiMapPin, FiClock, FiArrowRight, FiZap, FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslatedList } from "@/hooks/useTranslatedContent";


import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";

// --- MAIN COMPONENT ---

interface EventVolunteerProps {
  showHeader?: boolean;
  liveEvents?: AgendaKegiatan[];
  upcomingEvents?: AgendaKegiatan[];
  volunteerOpportunities?: AgendaKegiatan[];
  pastEvents?: AgendaKegiatan[];
}

export default function EventVolunteer({
  showHeader = true,
  liveEvents = [],
  upcomingEvents = [],
  volunteerOpportunities = [],
  pastEvents = []
}: EventVolunteerProps) {
  const t = useTranslations("Event");
  const locale = useLocale();

  // Auto-translate konten event dari database
  const { data: translatedLive } = useTranslatedList(liveEvents, "agenda_kegiatan", locale, ["title", "description"]);
  const { data: translatedUpcoming } = useTranslatedList(upcomingEvents, "agenda_kegiatan", locale, ["title", "description"]);
  const { data: translatedVolunteer } = useTranslatedList(volunteerOpportunities, "agenda_kegiatan", locale, ["title", "description"]);
  const { data: translatedPast } = useTranslatedList(pastEvents, "agenda_kegiatan", locale, ["title", "description"]);

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const AUTOPLAY_INTERVAL = 5000;

  const goTo = useCallback((index: number, dir?: number) => {
    if (upcomingEvents.length === 0) return;
    const d = dir ?? (index > active ? 1 : -1);
    setDirection(d);
    setActive(index);
    setProgress(0);
  }, [active]);

  const next = useCallback(() => {
    if (upcomingEvents.length === 0) return;
    goTo((active + 1) % upcomingEvents.length, 1);
  }, [active, goTo]);

  const prev = useCallback(() => {
    if (upcomingEvents.length === 0) return;
    goTo((active - 1 + upcomingEvents.length) % upcomingEvents.length, -1);
  }, [active, goTo]);

  useEffect(() => {
    if (paused || upcomingEvents.length <= 1) return;
    intervalRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(0), 0);
    if (paused || upcomingEvents.length <= 1) return () => clearTimeout(timer);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      clearTimeout(timer);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [active, paused]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, scale: 0.95 }),
  };

  // Live Event Slider States
  const [activeLive, setActiveLive] = useState(0);
  const [directionLive, setDirectionLive] = useState(1);
  const [pausedLive, setPausedLive] = useState(false);
  const [progressLive, setProgressLive] = useState(0);
  const intervalLiveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressLiveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToLive = useCallback((index: number, dir?: number) => {
    if (liveEvents.length === 0) return;
    const d = dir ?? (index > activeLive ? 1 : -1);
    setDirectionLive(d);
    setActiveLive(index);
    setProgressLive(0);
  }, [activeLive, liveEvents.length]);

  const nextLive = useCallback(() => {
    if (liveEvents.length === 0) return;
    goToLive((activeLive + 1) % liveEvents.length, 1);
  }, [activeLive, goToLive, liveEvents.length]);

  const prevLive = useCallback(() => {
    if (liveEvents.length === 0) return;
    goToLive((activeLive - 1 + liveEvents.length) % liveEvents.length, -1);
  }, [activeLive, goToLive, liveEvents.length]);

  useEffect(() => {
    if (pausedLive || liveEvents.length <= 1) return;
    intervalLiveRef.current = setInterval(nextLive, AUTOPLAY_INTERVAL);
    return () => { if (intervalLiveRef.current) clearInterval(intervalLiveRef.current); };
  }, [pausedLive, nextLive, liveEvents.length]);

  useEffect(() => {
    const timer = setTimeout(() => setProgressLive(0), 0);
    if (pausedLive || liveEvents.length <= 1) return () => clearTimeout(timer);
    const start = Date.now();
    progressLiveRef.current = setInterval(() => {
      setProgressLive(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      clearTimeout(timer);
      if (progressLiveRef.current) clearInterval(progressLiveRef.current);
    };
  }, [activeLive, pausedLive, liveEvents.length]);

  // Volunteer Slider States
  const [activeVol, setActiveVol] = useState(0);
  const [directionVol, setDirectionVol] = useState(1);
  const [pausedVol, setPausedVol] = useState(false);
  const [progressVol, setProgressVol] = useState(0);
  const intervalVolRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressVolRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToVol = useCallback((index: number, dir?: number) => {
    if (volunteerOpportunities.length === 0) return;
    const d = dir ?? (index > activeVol ? 1 : -1);
    setDirectionVol(d);
    setActiveVol(index);
    setProgressVol(0);
  }, [activeVol]);

  const nextVol = useCallback(() => {
    if (volunteerOpportunities.length === 0) return;
    goToVol((activeVol + 1) % volunteerOpportunities.length, 1);
  }, [activeVol, goToVol]);

  const prevVol = useCallback(() => {
    if (volunteerOpportunities.length === 0) return;
    goToVol((activeVol - 1 + volunteerOpportunities.length) % volunteerOpportunities.length, -1);
  }, [activeVol, goToVol]);

  useEffect(() => {
    if (pausedVol || volunteerOpportunities.length <= 1) return;
    intervalVolRef.current = setInterval(nextVol, AUTOPLAY_INTERVAL);
    return () => { if (intervalVolRef.current) clearInterval(intervalVolRef.current); };
  }, [pausedVol, nextVol]);

  useEffect(() => {
    const timer = setTimeout(() => setProgressVol(0), 0);
    if (pausedVol || volunteerOpportunities.length <= 1) return () => clearTimeout(timer);
    const start = Date.now();
    progressVolRef.current = setInterval(() => {
      setProgressVol(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      clearTimeout(timer);
      if (progressVolRef.current) clearInterval(progressVolRef.current);
    };
  }, [activeVol, pausedVol]);

  // Past Events Slider States
  const [activePast, setActivePast] = useState(0);
  const [directionPast, setDirectionPast] = useState(1);
  const [pausedPast, setPausedPast] = useState(false);
  const [progressPast, setProgressPast] = useState(0);
  const intervalPastRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressPastRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToPast = useCallback((index: number, dir?: number) => {
    if (pastEvents.length === 0) return;
    const d = dir ?? (index > activePast ? 1 : -1);
    setDirectionPast(d);
    setActivePast(index);
    setProgressPast(0);
  }, [activePast]);

  const nextPast = useCallback(() => {
    if (pastEvents.length === 0) return;
    goToPast((activePast + 1) % pastEvents.length, 1);
  }, [activePast, goToPast]);

  const prevPast = useCallback(() => {
    if (pastEvents.length === 0) return;
    goToPast((activePast - 1 + pastEvents.length) % pastEvents.length, -1);
  }, [activePast, goToPast]);

  useEffect(() => {
    if (pausedPast || pastEvents.length <= 1) return;
    intervalPastRef.current = setInterval(nextPast, AUTOPLAY_INTERVAL);
    return () => { if (intervalPastRef.current) clearInterval(intervalPastRef.current); };
  }, [pausedPast, nextPast]);

  useEffect(() => {
    const timer = setTimeout(() => setProgressPast(0), 0);
    if (pausedPast || pastEvents.length <= 1) return () => clearTimeout(timer);
    const start = Date.now();
    progressPastRef.current = setInterval(() => {
      setProgressPast(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      clearTimeout(timer);
      if (progressPastRef.current) clearInterval(progressPastRef.current);
    };
  }, [activePast, pausedPast]);


  return (
    <div className="bg-surface py-10 md:py-16">

      {/* ============================================ */}
      {/*  HERO HEADER                                */}
      {/* ============================================ */}
      {showHeader && (
        <section id="tour-event-volunteer" className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-10 md:mb-16 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-5">
            <FiCalendar size={13} /> {t("program")}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4 leading-tight">
            {t.rich("title", {
              span: (chunks) => <span className="text-[var(--color-primary)]">{chunks}</span>
            })}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base max-w-2xl mx-auto mb-8">
            {t("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="#upcoming"
              className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all"
            >
              {t("viewEvents")}
            </Link>
            <Link
              href="#volunteer"
              className="border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--color-primary)]/5 hover:-translate-y-0.5 transition-all"
            >
              {t("beVolunteer")}
            </Link>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/*  SECTION 1: LIVE EVENT                      */}
      {/* ============================================ */}
      <section id="tour-event-live" className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-10 md:mb-16">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-on-background">{t("liveEvent")}</h2>
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            <FiZap size={11} /> {t("liveBadge")} ({liveEvents.length})
          </span>
        </div>

        {/* Live Event Card / Slider */}
        {liveEvents.length > 0 ? (
          <div
            className="relative"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedLive(true);
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedLive(false);
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.clientX); }}
            onMouseUp={(e) => {
              const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
              const diff = start - e.clientX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) nextLive();
                else prevLive();
              }
            }}
            onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.touches[0].clientX); }}
            onTouchEnd={(e) => {
              const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
              const diff = start - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) nextLive();
                else prevLive();
              }
            }}
          >
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg group cursor-pointer h-[280px] sm:h-[300px] md:h-[350px]">
              {liveEvents.length > 1 && (
                <div
                  className="absolute top-0 left-0 h-1.5 z-20 transition-none rounded-full"
                  style={{ width: `${progressLive}%`, backgroundColor: "var(--color-primary)" }}
                />
              )}
              <AnimatePresence custom={directionLive} initial={false}>
                <motion.div
                  key={liveEvents[activeLive].id}
                  custom={directionLive}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                  className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-10"
                  style={{ willChange: "transform" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.08}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -40) nextLive();
                    if (info.offset.x > 40) prevLive();
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                    style={{ backgroundImage: `url('${liveEvents[activeLive].image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/75 to-primary/20 pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10 w-full md:w-3/4">
                    <span className="bg-surface/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm w-fit border border-white/30 mb-3 inline-block">
                      {liveEvents[activeLive].category}
                    </span>

                    <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-tight drop-shadow-md">{(translatedLive[activeLive] ?? liveEvents[activeLive]).title}</h3>

                    <div className="flex flex-col gap-1 text-white/90 text-xs sm:text-sm mb-5 font-medium">
                      <span className="flex items-center gap-2"><FiCalendar size={14} className="text-white/70" /> {formatDateToIndo(liveEvents[activeLive].date)}</span>
                      <span className="flex items-center gap-2"><FiClock size={14} className="text-white/70" /> {liveEvents[activeLive].time_range}</span>
                      <span className="flex items-center gap-2"><FiMapPin size={14} className="text-white/70" /> {liveEvents[activeLive].location || "Online"}</span>
                    </div>

                    <div>
                      <Link href={`/agenda/${liveEvents[activeLive].id}`} className="bg-secondary text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-secondary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md inline-flex items-center gap-2">
                        {t("enterLive")} <FiArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {liveEvents.length > 1 && (
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 flex gap-3">
                <button onClick={prevLive} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-primary backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-300 shadow-lg" aria-label="Sebelumnya"><FiChevronLeft size={22} /></button>
                <button onClick={nextLive} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-primary backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-300 shadow-lg" aria-label="Berikutnya"><FiChevronRight size={22} /></button>
              </div>
            )}
            {liveEvents.length > 1 && (
              <div className="absolute top-4 right-6 md:top-6 md:right-10 z-20 flex items-center gap-2">
                {liveEvents.map((p, i) => (
                  <button key={p.id} onClick={() => goToLive(i)} aria-label={`Live Event ${i + 1}`} className="rounded-full transition-all duration-300 shadow-sm" style={{ width: activeLive === i ? 24 : 8, height: 8, backgroundColor: activeLive === i ? "#ffffff" : "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 sm:p-8 text-center shadow-sm text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <div className="w-40 h-40 md:w-52 md:h-52 relative -my-2">
              <DotLottieReact
                src="/animations/Panda sleeping waiting lottie animation.lottie"
                loop
                autoplay
              />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-on-background">{t("noLiveTitle")}</h3>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-md mx-auto">
                {t("noLiveDesc")}
              </p>
            </div>
          </div>
        )}
      </section>


      {/* ============================================ */}
      {/*  SECTIONS 2, 3, 4: 3-COLUMN GRID (desktop) */}
      {/* ============================================ */}
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ---- COLUMN 1: UPCOMING EVENTS ---- */}
          <section
            id="upcoming"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(true);
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(false);
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-on-background flex items-center gap-2">
                  {t("upcomingEvents")}
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{upcomingEvents.length}</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("upcomingSubtitle")}</p>
              </div>
              <Link href="/agenda" className="group flex items-center gap-1 text-primary hover:text-secondary font-semibold text-xs transition-colors whitespace-nowrap shrink-0">
                {t("seeAll")} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                <div className="w-24 h-24 relative -my-1">
                  <DotLottieReact src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background">{t("noUpcomingTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noUpcomingDesc")}</p>
                <Link href="/agenda" className="mt-2 inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-primary/95 transition-all shadow-md">
                  {t("viewArchive")} <FiArrowRight />
                </Link>
              </div>
            ) : (
              <div
                className="relative"
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.clientX); }}
                onMouseUp={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) next();
                    else prev();
                  }
                }}
                onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.touches[0].clientX); }}
                onTouchEnd={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) next();
                    else prev();
                  }
                }}
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg bg-surface-variant/30">
                  {upcomingEvents.length > 1 && (
                    <div
                      className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full"
                      style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
                    />
                  )}
                  <AnimatePresence custom={direction} initial={false}>
                    <motion.div
                      key={upcomingEvents[active].id}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="absolute inset-0"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) next();
                        if (info.offset.x > 40) prev();
                      }}
                    >
                      <img src={upcomingEvents[active].image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} alt={upcomingEvents[active].title} className="w-full h-full object-cover select-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute top-4 left-4 bg-surface/95 backdrop-blur-sm text-secondary text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {(translatedUpcoming[active] ?? upcomingEvents[active]).category}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-extrabold text-sm leading-tight mb-2">{(translatedUpcoming[active] ?? upcomingEvents[active]).title}</h3>
                        <div className="flex flex-col gap-0.5 text-white/80 text-[10px] mb-3">
                          <span className="flex items-center gap-1.5"><FiCalendar size={11} className="text-secondary" /> {formatDateToIndo(upcomingEvents[active].date)}</span>
                          <span className="flex items-center gap-1.5"><FiClock size={11} className="text-secondary" /> {upcomingEvents[active].time_range}</span>
                          <span className="flex items-center gap-1.5"><FiMapPin size={11} className="text-secondary" /> {upcomingEvents[active].location || "Online"}</span>
                        </div>
                        <Link href={`/agenda/${upcomingEvents[active].id}`} className="bg-primary text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md inline-flex items-center gap-1.5">
                          {t("detailEvent")} <FiArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {upcomingEvents.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Sebelumnya"><FiChevronLeft size={15} /></button>
                    <button onClick={next} className="absolute right-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Berikutnya"><FiChevronRight size={15} /></button>
                  </>
                )}
                {upcomingEvents.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {upcomingEvents.map((p, i) => (
                      <button key={p.id} onClick={() => goTo(i)} aria-label={`Event ${i + 1}`} className="rounded-full transition-all duration-300" style={{ width: active === i ? 20 : 6, height: 6, backgroundColor: active === i ? "var(--color-primary)" : "#c5c6d0" }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---- COLUMN 2: VOLUNTEER OPPORTUNITIES ---- */}
          <section
            id="volunteer"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedVol(true);
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedVol(false);
            }}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-on-background flex items-center gap-2">
                  {t("volOpportunities")}
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{volunteerOpportunities.length}</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("volSubtitle")}</p>
              </div>
              <Link href="/volunteer" className="group flex items-center gap-1 text-primary hover:text-secondary font-semibold text-xs transition-colors whitespace-nowrap shrink-0">
                {t("seeAll")} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {volunteerOpportunities.length === 0 ? (
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                <div className="w-24 h-24 relative -my-1">
                  <DotLottieReact src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background">{t("noVolTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noVolDesc")}</p>
              </div>
            ) : (
              <div
                className="relative"
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.clientX); }}
                onMouseUp={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) nextVol();
                    else prevVol();
                  }
                }}
                onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.touches[0].clientX); }}
                onTouchEnd={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) nextVol();
                    else prevVol();
                  }
                }}
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg bg-surface-variant/30">
                  {volunteerOpportunities.length > 1 && (
                    <div className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full" style={{ width: `${progressVol}%`, backgroundColor: "var(--color-primary)" }} />
                  )}
                  <AnimatePresence custom={directionVol} initial={false}>
                    <motion.div
                      key={volunteerOpportunities[activeVol].id}
                      custom={directionVol}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="absolute inset-0"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) nextVol();
                        if (info.offset.x > 40) prevVol();
                      }}
                    >
                      <img src={volunteerOpportunities[activeVol].image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} alt={volunteerOpportunities[activeVol].title} className="w-full h-full object-cover select-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                      {volunteerOpportunities[activeVol].is_urgent && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <FiClock size={10} /> {t("urgent")}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                         <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">{(translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).category}</span>
                         <h3 className="font-extrabold text-sm leading-tight mb-1">{(translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).title}</h3>
                         <p className="text-white/80 text-[10px] mb-2 leading-relaxed line-clamp-2">{(translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-white/70 mb-3">
                          <FiClock size={11} className="text-secondary" />
                          <span>{t("deadline")}: <span className="font-semibold text-white">{formatDateToIndo(volunteerOpportunities[activeVol].deadline)}</span></span>
                        </div>
                        <Link href={`/agenda/${volunteerOpportunities[activeVol].id}`} className="bg-primary text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md inline-flex items-center gap-1.5">
                          <FiCheckCircle size={12} /> {t("applyPos")}
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {volunteerOpportunities.length > 1 && (
                  <>
                    <button onClick={prevVol} className="absolute left-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Sebelumnya"><FiChevronLeft size={15} /></button>
                    <button onClick={nextVol} className="absolute right-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Berikutnya"><FiChevronRight size={15} /></button>
                  </>
                )}
                {volunteerOpportunities.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {volunteerOpportunities.map((p, i) => (
                      <button key={p.id} onClick={() => goToVol(i)} aria-label={`Volunteer ${i + 1}`} className="rounded-full transition-all duration-300" style={{ width: activeVol === i ? 20 : 6, height: 6, backgroundColor: activeVol === i ? "var(--color-primary)" : "#c5c6d0" }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---- COLUMN 3: PAST EVENTS ---- */}
          <section
            id="past-events"
            onMouseEnter={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedPast(true);
            }}
            onMouseLeave={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) setPausedPast(false);
            }}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-on-background flex items-center gap-2">
                  {t("pastEvents")}
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{pastEvents.length}</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("pastSubtitle")}</p>
              </div>
              <Link href="/agenda" className="group flex items-center gap-1 text-on-surface-variant hover:text-primary font-semibold text-xs transition-colors whitespace-nowrap shrink-0">
                {t("seeAll")} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {pastEvents.length === 0 ? (
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                <div className="w-24 h-24 relative -my-1">
                  <DotLottieReact src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background">{t("noPastTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noPastDesc")}</p>
              </div>
            ) : (
              <div
                className="relative"
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.clientX); }}
                onMouseUp={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) nextPast();
                    else prevPast();
                  }
                }}
                onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.dragX = String(e.touches[0].clientX); }}
                onTouchEnd={(e) => {
                  const start = Number((e.currentTarget as HTMLElement).dataset.dragX);
                  const diff = start - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) nextPast();
                    else prevPast();
                  }
                }}
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg bg-surface-variant/30">
                  {pastEvents.length > 1 && (
                    <div className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full" style={{ width: `${progressPast}%`, backgroundColor: "var(--color-primary)" }} />
                  )}
                  <AnimatePresence custom={directionPast} initial={false}>
                    <motion.div
                      key={pastEvents[activePast].id}
                      custom={directionPast}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="absolute inset-0"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) nextPast();
                        if (info.offset.x > 40) prevPast();
                      }}
                    >
                      <img src={pastEvents[activePast].image_url || pastEvents[activePast].gallery?.[0] || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"} alt={pastEvents[activePast].title} className="w-full h-full object-cover grayscale select-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                      <div className="absolute top-4 left-4 bg-surface/95 backdrop-blur-sm text-secondary text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {(translatedPast[activePast] ?? pastEvents[activePast]).category}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-extrabold text-sm leading-tight mb-3">{(translatedPast[activePast] ?? pastEvents[activePast]).title}</h3>
                        <Link href={`/agenda/${pastEvents[activePast].id}`} className="bg-surface/20 text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-surface/30 transition-all duration-300 inline-flex items-center gap-1.5 border border-white/20 backdrop-blur-sm">
                          {t("viewDocs")} <FiArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {pastEvents.length > 1 && (
                  <>
                    <button onClick={prevPast} className="absolute left-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Sebelumnya"><FiChevronLeft size={15} /></button>
                    <button onClick={nextPast} className="absolute right-3 top-[38%] -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200" aria-label="Berikutnya"><FiChevronRight size={15} /></button>
                  </>
                )}
                {pastEvents.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {pastEvents.map((p, i) => (
                      <button key={p.id} onClick={() => goToPast(i)} aria-label={`Arsip ${i + 1}`} className="rounded-full transition-all duration-300" style={{ width: activePast === i ? 20 : 6, height: 6, backgroundColor: activePast === i ? "var(--color-primary)" : "#c5c6d0" }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

