"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { FiMonitor, FiSmartphone, FiBookOpen, FiCpu, FiGrid, FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);

const KATEGORI_KARYA = [
  {
    id: "Technology",
    titleKey: "catTechTitle",
    descKey: "catTechDesc",
    icon: <FiMonitor size={24} />,
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-500",
    lottie: "/animations/Developer.lottie",
  },
  {
    id: "Programming",
    titleKey: "catProgTitle",
    descKey: "catProgDesc",
    icon: <FiSmartphone size={24} />,
    color: "from-green-500/20 to-green-600/5",
    iconColor: "text-green-500",
    lottie: "/animations/mobile.lottie",
  },
  {
    id: "Research",
    titleKey: "catResTitle",
    descKey: "catResDesc",
    icon: <FiBookOpen size={24} />,
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-500",
    lottie: "/animations/Learning.lottie",
  },
  {
    id: "IoT",
    titleKey: "catIotTitle",
    descKey: "catIotDesc",
    icon: <FiCpu size={24} />,
    color: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-500",
    lottie: "/animations/robot.lottie",
  },
  {
    id: "Multimedia",
    titleKey: "catMultiTitle",
    descKey: "catMultiDesc",
    icon: <FiGrid size={24} />,
    color: "from-pink-500/20 to-pink-600/5",
    iconColor: "text-pink-500",
    lottie: "/animations/kalkun.lottie",
    lottieStyle: { scale: 1.1 }, 
  },
];

export default function UploadLandingPage() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations("UploadKarya");

  // Mencegah hydration error: deteksi layar HP hanya setelah render di sisi client
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Store DotLottie instances per card id
  const lottieRefs = useRef<Record<string, any>>({});

  const handleDotLottieRef = useCallback((id: string) => (dotLottie: any) => {
    lottieRefs.current[id] = dotLottie;
  }, []);

  // Automatically play active card, stop others
  useEffect(() => {
    const activeId = KATEGORI_KARYA[activeIndex].id;
    
    // Iterate over refs and play/stop based on active state
    Object.keys(lottieRefs.current).forEach((id) => {
      const dl = lottieRefs.current[id];
      if (!dl) return;
      
      if (id === activeId) {
        dl.play();
      } else {
        dl.stop();
      }
    });
  }, [activeIndex]);

  const handleCardClick = (index: number, id: string) => {
    if (index === activeIndex) {
      router.push(`/dashboard/upload/form?type=${encodeURIComponent(id)}`);
    } else {
      setActiveIndex(index);
    }
  };

  const nextCard = () => {
    if (activeIndex < KATEGORI_KARYA.length - 1) setActiveIndex(activeIndex + 1);
  };

  const prevCard = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col justify-start pt-8 pb-12 md:pb-4 -mt-8 md:-mt-16 relative z-10 overflow-x-clip overflow-y-visible w-full">
      
      {/* Tombol Kembali */}
      <button
        onClick={() => window.history.length > 2 ? router.back() : router.push('/dashboard/karya')}
        className="fixed top-6 left-4 md:top-8 md:left-8 z-[60] flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-white/80 dark:bg-surface/80 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(27,64,134,0.15)] border border-[var(--color-primary)]/30 text-on-surface-variant hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/50 hover:shadow-[0_8px_25px_rgba(27,64,134,0.25)] transition-all text-xs md:text-sm font-bold"
      >
        <FiChevronLeft size={16} /> {t("back")}
      </button>

      <div className="text-center mb-2 mt-4 md:mt-0 px-4 md:px-0">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] mb-2"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-on-surface-variant max-w-xl mx-auto"
        >
          {t("desc")}
        </motion.p>
      </div>

      <div className="relative h-[410px] md:h-[460px] w-full flex items-center justify-center -mt-2 md:mt-2">

        {/* Navigation Arrows */}
        <button
          onClick={prevCard}
          disabled={activeIndex === 0}
          className="absolute left-1 sm:left-4 md:left-8 z-50 p-2.5 md:p-4 rounded-full bg-surface shadow-xl border border-outline-variant/30 text-on-surface hover:text-[var(--color-primary)] disabled:opacity-0 transition-all hover:scale-110"
        >
          <FiChevronLeft size={24} />
        </button>
        <button
          onClick={nextCard}
          disabled={activeIndex === KATEGORI_KARYA.length - 1}
          className="absolute right-1 sm:right-4 md:right-8 z-50 p-2.5 md:p-4 rounded-full bg-surface shadow-xl border border-outline-variant/30 text-on-surface hover:text-[var(--color-primary)] disabled:opacity-0 transition-all hover:scale-110"
        >
          <FiChevronRight size={24} />
        </button>

        {KATEGORI_KARYA.map((item, index) => {
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;
          const isVisible = absOffset <= 1; // only render nearby cards

          const xOffsetBase = isMobile ? 120 : 220;

          // Gunakan scale untuk efek 3D kedalaman (depth)
          const cardOpacity = isActive ? 1 : absOffset === 1 ? 0.6 : 0;
          const cardY = isActive ? 0 : 20;
          const cardScale = isActive ? 1 : 0.85;

          return (
            <motion.div
              key={item.id}
              onClick={() => handleCardClick(index, item.id)}
              initial={false}
              animate={{
                x: `calc(-50% + ${offset * xOffsetBase}px)`,
                y: `calc(-50% + ${cardY}px)`,
                opacity: cardOpacity,
                scale: cardScale,
                zIndex: 20 - absOffset,
              }}
              whileHover={isActive ? { scale: 1.03, y: `calc(-50% - 4px)` } : { scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`absolute top-1/2 left-1/2 w-[280px] sm:w-[320px] md:w-[340px] h-[400px] md:h-[420px] bg-surface rounded-3xl cursor-pointer select-none flex flex-col overflow-hidden
                ${isActive
                  ? 'border-2 border-[var(--color-primary)] shadow-2xl'
                  : 'border border-outline-variant/40 shadow-md'
                }
              `}
              style={{ pointerEvents: absOffset > 1 ? 'none' : 'auto' }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl pointer-events-none`} />

              {/* Lottie area — fixed height, no scale transform */}
              <div className="relative w-full h-[160px] md:h-[180px] flex-shrink-0 overflow-hidden">
                {item.lottie && isVisible && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-[160px] h-[160px] md:w-[190px] md:h-[190px]"
                      style={item.lottieStyle ? {
                        transform: `translateX(${(item.lottieStyle as any).translateX || '0'}) scale(${(item.lottieStyle as any).scale || 1})`,
                        mixBlendMode: 'multiply' as const,
                      } : undefined}
                    >
                      <DotLottieReact
                        key={item.id}
                        src={item.lottie}
                        loop
                        autoplay={isActive}
                        dotLottieRefCallback={handleDotLottieRef(item.id)}
                      />
                    </div>
                  </div>
                )}
                {!item.lottie && (
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <div className={`w-14 h-14 rounded-2xl bg-surface-variant/70 flex items-center justify-center ${item.iconColor} border border-outline-variant/20`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { size: 26 })}
                    </div>
                  </div>
                )}
              </div>


              {/* Text content */}
              <div className={`relative z-10 flex flex-col flex-grow px-5 pb-4 pt-4 md:px-6 md:pb-5 md:pt-5 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex-grow flex flex-col justify-center">
                  <h3 className={`text-xl sm:text-2xl font-extrabold mb-1 sm:mb-2 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-on-surface'}`}>
                    {t((item as any).titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed line-clamp-2">
                    {t((item as any).descKey)}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-outline-variant/20">
                  <button
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                      ${isActive ? 'bg-[var(--color-primary)] text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:brightness-110 active:scale-95' : 'opacity-0'}
                    `}
                  >
                    {t("startUpload")} <FiArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Hover shimmer for non-active */}
              {!isActive && (
                <div className="absolute inset-0 z-20 rounded-3xl bg-surface/20 hover:bg-transparent transition-colors duration-200" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
