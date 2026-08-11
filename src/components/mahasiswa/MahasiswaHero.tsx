"use client";

import { motion } from "framer-motion";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false }
);

interface MahasiswaHeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAngkatan: number | null;
  setSelectedAngkatan: (angkatan: number | null) => void;
  selectedProdi: string;
  setSelectedProdi: (prodi: string) => void;
  totalMahasiswa: number;
  totalProjects: number;
  availableAngkatan: number[];
  isLoading?: boolean;
}

export default function MahasiswaHero({
  searchQuery,
  setSearchQuery,
  selectedAngkatan,
  setSelectedAngkatan,
  selectedProdi,
  setSelectedProdi,
  totalMahasiswa,
  totalProjects,
  availableAngkatan,
  isLoading = false,
}: MahasiswaHeroProps) {
  const t = useTranslations("MahasiswaPage");
  const prodiOptions = [
    t("filterAll") + " Prodi",
    "Teknik Informatika",
    "Sistem Informasi",
  ];

  return (
    <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 bg-background border-b border-outline-variant/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-10 relative">

        {/* Left Character */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
          className="hidden xl:block absolute bottom-0 left-0 z-0 pointer-events-none"
        >
          <DotLottieReact src="/animations/karakter.lottie" autoplay loop style={{ width: 280, height: 280 }} />
        </motion.div>

        {/* Right Character */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.3 }}
          className="hidden xl:block absolute bottom-12 right-4 z-0 pointer-events-none"
        >
          <DotLottieReact src="/animations/rocket.lottie" autoplay loop style={{ width: 220, height: 220, transform: "scaleX(-1)" }} />
        </motion.div>

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto relative z-10">
          {/* Title */}
          <motion.h1
            id="tour-mahasiswa-header"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-3 md:mb-4 text-primary"
          >
            {t("heroTitlePart1")}{" "}
            <span className="text-secondary">{t("heroTitlePart2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-on-surface-variant text-sm sm:text-lg max-w-2xl leading-relaxed mb-6 md:mb-8"
          >
            {t("heroSubtitle")}
          </motion.p>

          {/* Stats Card */}
          <motion.div
            id="tour-mahasiswa-stats"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="grid grid-cols-3 divide-x divide-outline-variant/30 mb-6 md:mb-8 py-4 px-2 sm:px-4 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm w-full max-w-3xl mx-auto"
          >
            {/* Mahasiswa */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-1 sm:px-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center p-1 sm:p-2 overflow-hidden shrink-0">
                <DotLottieReact src="/animations/people.lottie" autoplay loop />
              </div>
              <div className="text-center sm:text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1">
                    <div className="h-5 w-8 bg-primary/20 rounded-lg mx-auto sm:mx-0" />
                    <div className="h-3 w-16 bg-surface-variant/60 rounded mx-auto sm:mx-0" />
                  </div>
                ) : (
                  <>
                    <p className="text-lg sm:text-2xl font-extrabold text-primary leading-none">{totalMahasiswa}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant mt-1">{t("statStudents")}</p>
                  </>
                )}
              </div>
            </div>

            {/* Proyek */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-1 sm:px-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary/10 flex items-center justify-center p-1 sm:p-2 overflow-hidden shrink-0">
                <DotLottieReact src="/animations/project.lottie" autoplay loop />
              </div>
              <div className="text-center sm:text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1">
                    <div className="h-5 w-8 bg-secondary/20 rounded-lg mx-auto sm:mx-0" />
                    <div className="h-3 w-16 bg-surface-variant/60 rounded mx-auto sm:mx-0" />
                  </div>
                ) : (
                  <>
                    <p className="text-lg sm:text-2xl font-extrabold text-secondary leading-none">{totalProjects}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant mt-1">{t("statProjects")}</p>
                  </>
                )}
              </div>
            </div>

            {/* Angkatan */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-1 sm:px-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center p-1 sm:p-2 overflow-hidden shrink-0">
                <DotLottieReact src="/animations/college.lottie" autoplay loop />
              </div>
              <div className="text-center sm:text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1">
                    <div className="h-5 w-6 bg-primary/20 rounded-lg mx-auto sm:mx-0" />
                    <div className="h-3 w-16 bg-surface-variant/60 rounded mx-auto sm:mx-0" />
                  </div>
                ) : (
                  <>
                    <p className="text-lg sm:text-2xl font-extrabold text-primary leading-none">{availableAngkatan.length}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant mt-1">{t("statBatch")}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Search Box */}
          <motion.div
            id="tour-mahasiswa-search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-2xl relative mb-5 md:mb-6"
          >
            <div className="relative flex items-center">
              <FiSearch className="absolute left-4 text-on-surface-variant/70 text-base pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-11 pr-10 py-3 md:py-4 rounded-full bg-surface border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1.5 text-on-surface-variant hover:text-on-surface rounded-full bg-surface-variant transition-all"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            id="tour-mahasiswa-filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full flex flex-col gap-3 items-start sm:items-center"
          >
            {/* Angkatan */}
            <div className="relative w-full">
              <div className="w-full overflow-x-auto scrollbar-hide pb-1">
                <div className="flex items-center sm:justify-center gap-2 min-w-max px-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <FiFilter size={13} className="text-primary" /> {t("filterBatch")}
                  </span>
                  <button
                    onClick={() => setSelectedAngkatan(null)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                      selectedAngkatan === null
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {t("filterAll")}
                  </button>
                  {isLoading
                    ? [1, 2, 3].map(n => <div key={n} className="w-14 h-7 bg-surface-variant/60 rounded-full animate-pulse shrink-0" />)
                    : availableAngkatan.map((angkatan) => (
                        <button
                          key={angkatan}
                          onClick={() => setSelectedAngkatan(angkatan)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                            selectedAngkatan === angkatan
                              ? "bg-primary text-white shadow-md"
                              : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                          }`}
                        >
                          {angkatan}
                        </button>
                      ))}
                </div>
              </div>
              {/* Fade indicator for scroll */}
              <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            </div>

            {/* Prodi */}
            <div className="relative w-full">
              <div className="w-full overflow-x-auto scrollbar-hide pb-1">
                <div className="flex items-center sm:justify-center gap-2 min-w-max px-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider shrink-0 flex items-center">
                    {t("filterProdi")}
                  </span>
                  {prodiOptions.map((prodi) => (
                    <button
                      key={prodi}
                      onClick={() => setSelectedProdi(prodi)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                        selectedProdi === prodi
                          ? "bg-secondary text-white shadow-sm"
                          : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      {prodi}
                    </button>
                  ))}
                </div>
              </div>
              {/* Fade indicator for scroll */}
              <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
