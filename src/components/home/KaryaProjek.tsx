"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiEye, FiHeart, FiChevronLeft, FiChevronRight, FiTrendingUp } from "react-icons/fi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslatedList } from "@/hooks/useTranslatedContent";

const AUTOPLAY_INTERVAL = 4500;
const rankLabel = ["🥇", "🥈", "🥉"];
const categoryColors: Record<string, { badge: string, accent: string }> = {
  TECHNOLOGY: { badge: "bg-blue-50 text-blue-600", accent: "#1b4086" },
  "UI/UX": { badge: "bg-purple-50 text-purple-600", accent: "#9333ea" },
  RESEARCH: { badge: "bg-green-50 text-green-600", accent: "#16a34a" },
  PROGRAMMING: { badge: "bg-orange-50 text-orange-600", accent: "#ea580c" },
  "COMMUNITY SERVICE": { badge: "bg-pink-50 text-pink-600", accent: "#db2777" },
  MULTIMEDIA: { badge: "bg-yellow-50 text-yellow-700", accent: "#ca8a04" },
};

export default function KaryaProjek({ karyaList = [] }: { karyaList?: any[] }) {
  const t = useTranslations("Project");
  const locale = useLocale();

  // Use original user-submitted title & description
  const projects = karyaList.map((k, idx) => ({
    id: k.id,
    rank: idx + 1,
    badge: k.category || "UMUM",
    title: k.title,
    desc: k.description,
    imgUrl: k.image_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    likes: k.likes || 0,
    viewsLabel: (k.views || 0).toLocaleString(),
    date: new Date(k.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
    badgeColor: categoryColors[k.category]?.badge || "bg-gray-50 text-gray-600",
    accentColor: categoryColors[k.category]?.accent || "#4b5563",
  }));
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number, dir?: number) => {
    const d = dir ?? (index > active ? 1 : -1);
    setDirection(d);
    setActive(index);
    setProgress(0);
  }, [active]);

  const next = useCallback(() => goTo((active + 1) % projects.length, 1), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + projects.length) % projects.length, -1), [active, goTo]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(0), 0);
    if (paused) return () => clearTimeout(timer);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      clearTimeout(timer);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [active, paused]);

  const item = projects[active] || projects[0];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0, scale: 0.95 }),
  };

  return (
    <section
      className="py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-background overflow-hidden"
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(true);
      }}
      onMouseLeave={() => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) setPaused(false);
      }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div id="tour-karya-projek" className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <FiTrendingUp size={13} /> {t("bestProject")}
            </div>
            <Link
              href="/karya"
              className="group flex items-center gap-1.5 text-primary font-semibold text-sm hover:text-secondary transition-colors whitespace-nowrap shrink-0"
            >
              {t("seeAll")} <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">
              {t("title")}
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {t("subtitle", { count: projects.length })}
            </p>
          </div>
        </div>

        {/* Empty State when 0 Projects */}
        {projects.length === 0 ? (
          <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 sm:p-10 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center gap-2">
            <div className="w-44 h-44 sm:w-56 sm:h-56 relative -my-4">
              <DotLottieReact
                src="/animations/Developer.lottie"
                loop
                autoplay
              />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-on-background">{t("noProjectTitle")}</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
              {t("noProjectDesc")}
            </p>
            <Link
              href="/dashboard/upload"
              className="mt-3 inline-flex items-center gap-2 bg-primary text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md"
            >
              {t("uploadFirst")} <FiArrowRight />
            </Link>
          </div>
        ) : (
          <>
            {/* ===== DESKTOP: Dynamic Grid ===== */}
            <div className={`hidden lg:grid gap-6 ${projects.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : projects.length === 2
                ? "grid-cols-2 max-w-4xl mx-auto"
                : "grid-cols-3"
              }`}>
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/karya/${p.id}`}
                  className="group relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg bg-surface-variant/30 block"
                >
                  <img
                    src={p.imgUrl}
                    alt={p.title}
                    className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 text-2xl drop-shadow-lg">{rankLabel[p.rank - 1] || "🎖️"}</div>
                  {/* accent top bar */}
                  <div className="absolute top-0 left-0 w-full h-1 rounded-full" style={{ backgroundColor: p.accentColor }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{p.badge}</span>
                    <h3 className="text-white font-extrabold text-base leading-tight mt-0.5">{p.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-white/70 text-xs"><FiEye size={12} /> {p.viewsLabel} {t("views")}</span>
                      <span className="flex items-center gap-1 text-white/70 text-xs"><FiHeart size={12} /> {p.likes} {t("likes")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ===== MOBILE: Slider/Carousel ===== */}
            <div className="lg:hidden max-w-2xl mx-auto w-full">
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
                {/* Card */}
                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg bg-surface-variant/30">
                  {/* Progress bar */}
                  <div
                    className="absolute top-0 left-0 h-1 z-20 transition-none rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: item.accentColor }}
                  />

                  <AnimatePresence custom={direction} initial={false}>
                    <motion.div
                      key={item.id}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                      className="absolute inset-0"
                      style={{ willChange: "transform" }}
                      drag={projects.length > 1 ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.08}
                      onDragEnd={(_, info) => {
                        if (projects.length <= 1) return;
                        if (info.offset.x < -40) next();
                        if (info.offset.x > 40) prev();
                      }}
                    >
                      <img
                        src={item.imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover select-none"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 text-2xl drop-shadow-lg">{rankLabel[item.rank - 1] || "🎖️"}</div>
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{item.badge}</span>
                        <h3 className="text-white font-extrabold text-lg leading-tight mt-0.5">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-white/70 text-xs"><FiEye size={12} /> {item.viewsLabel} {t("views")}</span>
                          <span className="flex items-center gap-1 text-white/70 text-xs"><FiHeart size={12} /> {item.likes} {t("likes")}</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Prev / Next (Hidden if only 1 project) */}
                {projects.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-6 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200"
                      aria-label="Sebelumnya"
                    >
                      <FiChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-6 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur-sm shadow-md flex items-center justify-center text-on-background hover:bg-surface hover:scale-110 transition-all duration-200"
                      aria-label="Berikutnya"
                    >
                      <FiChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {projects.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {projects.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => goTo(i)}
                        aria-label={`Karya ${i + 1}`}
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: active === i ? 24 : 8,
                          backgroundColor: active === i ? item.accentColor : "#c5c6d0",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
