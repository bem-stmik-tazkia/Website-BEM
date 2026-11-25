"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { FiCalendar, FiMapPin, FiClock, FiArrowRight, FiZap, FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SafeLottie from "@/components/ui/SafeLottie";
import Image from "next/image";
import { useTranslatedList } from "@/hooks/useTranslatedContent";


import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo, formatDeadlineWib } from "@/utils/dateFormatter";
import {
  dedupeCategoryLabel,
  getDefaultPosterBgClass,
  getKegiatanPosterUrl,
  isDefaultPosterPath,
  isSvgImageUrl,
} from "@/lib/default-posters";

// --- CAROUSEL POSTER ARROWS ---
function CarouselPosterArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[16/9] z-20 flex items-center justify-between px-3">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="pointer-events-auto w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200"
        aria-label="Sebelumnya"
      >
        <FiChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="pointer-events-auto w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200"
        aria-label="Berikutnya"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
}

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
  const router = useRouter();

  // Auto-translate konten event dari database
  const { data: translatedLive } = useTranslatedList(liveEvents, "agenda_kegiatan", locale, ["title", "description", "category", "location"]);
  const { data: translatedUpcoming } = useTranslatedList(upcomingEvents, "agenda_kegiatan", locale, ["title", "description", "category", "location"]);
  const { data: translatedVolunteer } = useTranslatedList(volunteerOpportunities, "agenda_kegiatan", locale, ["title", "description", "category", "location"]);
  const { data: translatedPast } = useTranslatedList(pastEvents, "agenda_kegiatan", locale, ["title", "description", "category", "location"]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingUpcoming = useRef(false);
  const isDraggingVol = useRef(false);
  const isDraggingPast = useRef(false);

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
      {/*  SECTION 1: LIVE EVENT / ACTIVE SPOTLIGHT   */}
      {/* ============================================ */}
      <section id="tour-event-live" className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-10 md:mb-14">
        {liveEvents.length > 0 ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-on-background">{t("liveEvent")}</h2>
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                <FiZap size={11} /> {t("liveBadge")} ({liveEvents.length})
              </span>
            </div>

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
              <div
                className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg group cursor-pointer h-[280px] sm:h-[300px] md:h-[350px] block"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('a') && !target.closest('button')) {
                    router.push(`/agenda/${liveEvents[activeLive].id}`);
                  }
                }}
              >
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
                    {(() => {
                      const livePoster = getKegiatanPosterUrl(liveEvents[activeLive].image_url, "event");
                      const isDefault = isDefaultPosterPath(livePoster);
                      return (
                        <Image
                          src={livePoster}
                          alt={liveEvents[activeLive].title}
                          fill
                          unoptimized={isSvgImageUrl(livePoster)}
                          sizes="100vw"
                          className={`w-full h-full transition-transform duration-700 group-hover:scale-105 pointer-events-none ${
                            isDefault ? `${getDefaultPosterBgClass("event")} object-cover` : "object-cover"
                          }`}
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/75 to-primary/20 pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10 w-full md:w-3/4">
                      <span className="bg-surface/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm w-fit border border-white/30 mb-3 inline-block">
                        {dedupeCategoryLabel((translatedLive[activeLive] ?? liveEvents[activeLive]).category)}
                      </span>

                      <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-tight drop-shadow-md">{(translatedLive[activeLive] ?? liveEvents[activeLive]).title}</h3>

                      <div className="flex flex-col gap-1 text-white/90 text-xs sm:text-sm mb-5 font-medium">
                        <span className="flex items-center gap-2"><FiCalendar size={14} className="text-white/70" /> {formatDateToIndo(liveEvents[activeLive].date)}</span>
                        <span className="flex items-center gap-2"><FiClock size={14} className="text-white/70" /> {liveEvents[activeLive].time_range}</span>
                        <span className="flex items-center gap-2"><FiMapPin size={14} className="text-white/70" /> {(translatedLive[activeLive] ?? liveEvents[activeLive]).location || "Online"}</span>
                      </div>

                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/agenda/${liveEvents[activeLive].id}`);
                          }}
                          className="bg-secondary text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-secondary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md inline-flex items-center gap-2"
                        >
                          {t("enterLive")} <FiArrowRight size={16} />
                        </button>
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
          </>
        ) : volunteerOpportunities.length > 0 || upcomingEvents.length > 0 ? (
          (() => {
            const isVolSpotlight = volunteerOpportunities.length > 0;
            const rawItem = isVolSpotlight ? volunteerOpportunities[0] : upcomingEvents[0];
            const item = isVolSpotlight
              ? (translatedVolunteer[0] ?? rawItem)
              : (translatedUpcoming[0] ?? rawItem);
            const posterUrl = getKegiatanPosterUrl(rawItem.image_url, isVolSpotlight ? "volunteer" : "event");
            const isDefault = isDefaultPosterPath(posterUrl);
            return (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h2 className="text-base sm:text-xl font-bold text-on-background leading-tight">
                      {isVolSpotlight ? t("spotlightVolunteer") : t("spotlightUpcoming")}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 text-white text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap shrink-0 ${
                      isVolSpotlight ? "bg-emerald-600" : "bg-primary"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      {isVolSpotlight ? t("openNowBadge") : t("upcomingBadge")}
                    </span>
                  </div>
                  <Link
                    href={isVolSpotlight ? "/agenda?tab=volunteer" : "/agenda"}
                    className="group flex items-center gap-1 text-primary hover:text-secondary font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    {t("seeAll")} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                </div>

                <div
                  onClick={() => router.push(`/agenda/${rawItem.id}?from=home`)}
                  className="group bg-surface border border-outline-variant/30 rounded-2xl md:rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12"
                >
                  {/* Poster 16:9 utuh tanpa ditimpa teks */}
                  <div className={`lg:col-span-6 relative aspect-[16/9] overflow-hidden ${isDefault ? getDefaultPosterBgClass(rawItem.type) : "bg-surface-variant"}`}>
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      unoptimized={isSvgImageUrl(posterUrl)}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {rawItem.is_urgent && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <FiClock size={11} /> {t("urgent")}
                      </div>
                    )}
                  </div>

                  {/* Info bersih di sisi kanan */}
                  <div className="lg:col-span-6 p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {item.category && (
                          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-2.5 py-0.5 rounded-full">
                            {dedupeCategoryLabel(item.category)}
                          </span>
                        )}
                        {rawItem.items && rawItem.items.length > 0 && (() => {
                          const filled = rawItem.items.reduce((s, it) => s + (it.filled_count || 0), 0);
                          const quota = rawItem.items.reduce((s, it) => s + (it.quota || 0), 0);
                          const hasUnlim = rawItem.items.some((it) => it.quota == null);
                          const quotaStr = hasUnlim ? `${filled} ${t("filledBadge")}` : `${filled}/${quota} ${t("filledBadge")}`;
                          return (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                              <span>{rawItem.items.length} {isVolSpotlight ? t("positionsBadge") : t("competitionsBadge")}</span>
                              <span>•</span>
                              <span>{quotaStr}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-on-background group-hover:text-primary transition-colors leading-snug mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
                      <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        {isVolSpotlight ? (
                          <>
                            <FiClock size={13} className="text-secondary shrink-0" />
                            <span>
                              {t("deadline")}:{" "}
                              <strong className="text-on-background">{formatDeadlineWib(rawItem.deadline, locale)}</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <FiCalendar size={13} className="text-primary shrink-0" />
                            <strong className="text-on-background">{formatDateToIndo(rawItem.date)}</strong>
                          </>
                        )}
                      </div>
                      <Link
                        href={`/agenda/${rawItem.id}?from=home`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all shadow-md shrink-0"
                      >
                        {isVolSpotlight ? (
                          <>
                            <FiCheckCircle size={14} /> {t("applyPos")}
                          </>
                        ) : (
                          <>
                            {t("detailEvent")} <FiArrowRight size={14} />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-surface border border-outline-variant/30 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-outline-variant shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-on-background">{t("noLiveTitle")}</h3>
                <p className="text-xs text-on-surface-variant">{t("noLiveDesc")}</p>
              </div>
            </div>
            <Link href="/agenda" className="text-xs font-bold text-primary hover:underline shrink-0 inline-flex items-center gap-1">
              {t("seeAll")} <FiArrowRight size={12} />
            </Link>
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
            className="flex flex-col h-full"
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
              <Link href="/agenda" className="group flex-1 bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer">
                <div className="w-24 h-24 relative -my-1">
                  <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background group-hover:text-primary transition-colors">{t("noUpcomingTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noUpcomingDesc")}</p>
                <span className="mt-2 inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full group-hover:bg-primary/95 transition-all shadow-md">
                  {t("viewArchive")} <FiArrowRight />
                </span>
              </Link>
            ) : (
              <div
                className="relative flex-1 flex flex-col"
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
                <div className="relative flex-1 flex flex-col overflow-hidden rounded-3xl shadow-md border border-outline-variant/30 bg-surface">
                  {upcomingEvents.length > 1 && (
                    <div
                      className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full"
                      style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
                    />
                  )}
                  <AnimatePresence custom={direction} mode="wait" initial={false}>
                    <motion.div
                      key={upcomingEvents[active].id}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="cursor-pointer flex-1 flex flex-col"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragStart={() => { isDraggingUpcoming.current = true; }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) next();
                        if (info.offset.x > 40) prev();
                        setTimeout(() => { isDraggingUpcoming.current = false; }, 100);
                      }}
                      onClick={() => {
                        if (!isDraggingUpcoming.current) {
                          router.push(`/agenda/${upcomingEvents[active].id}`);
                        }
                      }}
                    >
                      {(() => {
                        const upcomingPoster = getKegiatanPosterUrl(upcomingEvents[active].image_url, "event");
                        const isDefault = isDefaultPosterPath(upcomingPoster);
                        return (
                          <div className={`relative aspect-[16/9] w-full overflow-hidden ${isDefault ? getDefaultPosterBgClass("event") : "bg-surface-variant"}`}>
                            <Image
                              src={upcomingPoster}
                              alt={upcomingEvents[active].title}
                              fill
                              unoptimized={isSvgImageUrl(upcomingPoster)}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="w-full h-full object-cover select-none"
                              draggable={false}
                            />
                          </div>
                        );
                      })()}
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {dedupeCategoryLabel((translatedUpcoming[active] ?? upcomingEvents[active]).category)}
                        </span>
                        <h3 className="font-extrabold text-sm text-on-background leading-snug line-clamp-2">
                          {(translatedUpcoming[active] ?? upcomingEvents[active]).title}
                        </h3>
                        <div className="flex flex-col gap-1 text-on-surface-variant text-[11px]">
                          <span className="flex items-center gap-1.5"><FiCalendar size={12} className="text-primary shrink-0" /> {formatDateToIndo(upcomingEvents[active].date)}</span>
                          {upcomingEvents[active].time_range && (
                            <span className="flex items-center gap-1.5"><FiClock size={12} className="text-primary shrink-0" /> {upcomingEvents[active].time_range}</span>
                          )}
                          <span className="flex items-center gap-1.5 line-clamp-1"><FiMapPin size={12} className="text-primary shrink-0" /> {(translatedUpcoming[active] ?? upcomingEvents[active]).location || "Online"}</span>
                        </div>
                        {upcomingEvents[active].items && upcomingEvents[active].items.length > 0 && (
                          <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit">
                            {upcomingEvents[active].items.length} {t("competitionsBadge")}
                          </span>
                        )}
                        <div className="mt-auto pt-2">
                          <Link href={`/agenda/${upcomingEvents[active].id}`} className="relative z-30 bg-primary text-white text-[11px] font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-sm inline-flex items-center gap-1.5">
                            {t("detailEvent")} <FiArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {upcomingEvents.length > 1 && <CarouselPosterArrows onPrev={prev} onNext={next} />}
                </div>
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
            className="flex flex-col h-full"
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
              <Link href="/agenda?tab=volunteer" className="group flex items-center gap-1 text-primary hover:text-secondary font-semibold text-xs transition-colors whitespace-nowrap shrink-0">
                {t("seeAll")} <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {volunteerOpportunities.length === 0 ? (
              <Link href="/agenda?tab=volunteer" className="group flex-1 bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer">
                <div className="w-24 h-24 relative -my-1">
                  <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background group-hover:text-primary transition-colors">{t("noVolTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noVolDesc")}</p>
              </Link>
            ) : (
              <div
                className="relative flex-1 flex flex-col"
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
                <div className="relative flex-1 flex flex-col overflow-hidden rounded-3xl shadow-md border border-outline-variant/30 bg-surface">
                  {volunteerOpportunities.length > 1 && (
                    <div className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full" style={{ width: `${progressVol}%`, backgroundColor: "var(--color-primary)" }} />
                  )}
                  <AnimatePresence custom={directionVol} mode="wait" initial={false}>
                    <motion.div
                      key={volunteerOpportunities[activeVol].id}
                      custom={directionVol}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="cursor-pointer flex-1 flex flex-col relative"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragStart={() => { isDraggingVol.current = true; }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) nextVol();
                        if (info.offset.x > 40) prevVol();
                        setTimeout(() => { isDraggingVol.current = false; }, 100);
                      }}
                      onClick={() => {
                        if (!isDraggingVol.current) {
                          setLoadingId(volunteerOpportunities[activeVol].id);
                          router.push(`/agenda/${volunteerOpportunities[activeVol].id}`);
                        }
                      }}
                    >
                      {(() => {
                        const volPoster = getKegiatanPosterUrl(volunteerOpportunities[activeVol].image_url, "volunteer");
                        const isDefault = isDefaultPosterPath(volPoster);
                        return (
                          <div className={`relative aspect-[16/9] w-full overflow-hidden ${isDefault ? getDefaultPosterBgClass("volunteer") : "bg-surface-variant"}`}>
                            <Image
                              src={volPoster}
                              alt={volunteerOpportunities[activeVol].title}
                              fill
                              unoptimized={isSvgImageUrl(volPoster)}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="w-full h-full object-cover select-none"
                              draggable={false}
                            />
                            {volunteerOpportunities[activeVol].is_urgent && (
                              <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
                                <FiClock size={10} /> {t("urgent")}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Loading Overlay */}
                      {loadingId === volunteerOpportunities[activeVol].id && (
                        <div className="absolute inset-0 z-[40] bg-surface/60 backdrop-blur-sm flex flex-col items-center justify-center">
                          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-2" />
                          <span className="text-on-background text-[10px] font-bold tracking-wider">{t("loading") || "Loading..."}</span>
                        </div>
                      )}

                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {dedupeCategoryLabel((translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).category)}
                        </span>
                        <h3 className="font-extrabold text-sm text-on-background leading-snug line-clamp-2">
                          {(translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).title}
                        </h3>
                        <p className="text-on-surface-variant text-[11px] leading-relaxed line-clamp-3">
                          {(translatedVolunteer[activeVol] ?? volunteerOpportunities[activeVol]).description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <FiClock size={11} className="text-secondary shrink-0" />
                            <span>{t("deadline")}: <strong className="text-on-background">{formatDeadlineWib(volunteerOpportunities[activeVol].deadline, locale)}</strong></span>
                          </span>
                          {volunteerOpportunities[activeVol].items && volunteerOpportunities[activeVol].items.length > 0 && (() => {
                            const vItems = volunteerOpportunities[activeVol].items!;
                            const filled = vItems.reduce((s, it) => s + (it.filled_count || 0), 0);
                            const quota = vItems.reduce((s, it) => s + (it.quota || 0), 0);
                            const hasUnlim = vItems.some((it) => it.quota == null);
                            const quotaStr = hasUnlim ? `${filled} ${t("filledBadge")}` : `${filled}/${quota} ${t("filledBadge")}`;
                            return (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                                <span>{vItems.length} {t("positionsBadge")}</span>
                                <span>•</span>
                                <span>{quotaStr}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <div className="mt-auto pt-2">
                          <Link href={`/agenda/${volunteerOpportunities[activeVol].id}`} className="relative z-30 bg-primary text-white text-[11px] font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-sm inline-flex items-center gap-1.5">
                            <FiCheckCircle size={12} /> {t("applyPos")}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {volunteerOpportunities.length > 1 && <CarouselPosterArrows onPrev={prevVol} onNext={nextVol} />}
                </div>
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
            className="flex flex-col h-full"
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
              <Link href="/dokumentasi" className="group flex-1 bg-white border border-outline-variant/30 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer">
                <div className="w-24 h-24 relative -my-1">
                  <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <h3 className="text-base font-bold text-on-background group-hover:text-primary transition-colors">{t("noPastTitle")}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">{t("noPastDesc")}</p>
              </Link>
            ) : (
              <div
                className="relative flex-1 flex flex-col"
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
                <div className="relative flex-1 flex flex-col overflow-hidden rounded-3xl shadow-md border border-outline-variant/30 bg-surface">
                  {pastEvents.length > 1 && (
                    <div className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full" style={{ width: `${progressPast}%`, backgroundColor: "var(--color-primary)" }} />
                  )}
                  <AnimatePresence custom={directionPast} mode="wait" initial={false}>
                    <motion.div
                      key={pastEvents[activePast].id}
                      custom={directionPast}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="cursor-pointer flex-1 flex flex-col"
                      style={{ willChange: "transform" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragStart={() => { isDraggingPast.current = true; }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) nextPast();
                        if (info.offset.x > 40) prevPast();
                        setTimeout(() => { isDraggingPast.current = false; }, 100);
                      }}
                      onClick={() => {
                        if (!isDraggingPast.current) {
                          router.push(`/agenda/${pastEvents[activePast].id}`);
                        }
                      }}
                    >
                      {(() => {
                        const pastPoster = getKegiatanPosterUrl(pastEvents[activePast].image_url, "event", pastEvents[activePast].gallery);
                        const isDefault = isDefaultPosterPath(pastPoster);
                        return (
                          <div className={`relative aspect-[16/9] w-full overflow-hidden ${isDefault ? getDefaultPosterBgClass("event") : "bg-surface-variant"}`}>
                            <Image
                              src={pastPoster}
                              alt={pastEvents[activePast].title}
                              fill
                              unoptimized={isSvgImageUrl(pastPoster)}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="w-full h-full object-cover grayscale select-none"
                              draggable={false}
                            />
                          </div>
                        );
                      })()}
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {dedupeCategoryLabel((translatedPast[activePast] ?? pastEvents[activePast]).category)}
                        </span>
                        <h3 className="font-extrabold text-sm text-on-background leading-snug line-clamp-2">
                          {(translatedPast[activePast] ?? pastEvents[activePast]).title}
                        </h3>
                        <p className="text-on-surface-variant text-[11px] leading-relaxed line-clamp-5">
                          {(translatedPast[activePast] ?? pastEvents[activePast]).description}
                        </p>
                        {pastEvents[activePast].date && (
                          <span className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
                            <FiCalendar size={12} className="text-primary shrink-0" /> {formatDateToIndo(pastEvents[activePast].date)}
                          </span>
                        )}
                        <div className="mt-auto pt-2">
                          <Link href={`/agenda/${pastEvents[activePast].id}`} className="relative z-30 bg-surface-variant text-on-background text-[11px] font-bold px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1.5 border border-outline-variant/40">
                            {t("viewDocs")} <FiArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {pastEvents.length > 1 && <CarouselPosterArrows onPrev={prevPast} onNext={nextPast} />}
                </div>
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[9999] bg-surface text-on-surface border border-outline-variant/30 shadow-2xl px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2"
          >
            <FiClock className="text-secondary" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

