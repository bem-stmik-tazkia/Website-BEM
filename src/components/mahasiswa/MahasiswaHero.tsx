"use client";

import { motion } from "framer-motion";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import dynamic from "next/dynamic";

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
  const prodiOptions = [
    "Semua Prodi",
    "Teknik Informatika",
    "Sistem Informasi",
    "Bisnis Digital",
  ];

  return (
    <section className="relative pt-28 pb-10 md:pt-36 md:pb-12 bg-background border-b border-outline-variant/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-10 relative">
        
        {/* Left Character - karakter.lottie */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
          className="hidden xl:block absolute bottom-0 left-0 z-0 pointer-events-none"
        >
          <DotLottieReact
            src="/animations/karakter.lottie"
            autoplay
            loop
            style={{ width: 280, height: 280 }}
          />
        </motion.div>

        {/* Right Character - rocket.lottie (flipped) */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.3 }}
          className="hidden xl:block absolute bottom-12 right-4 z-0 pointer-events-none"
        >
          <DotLottieReact
            src="/animations/rocket.lottie"
            autoplay
            loop
            style={{ width: 220, height: 220, transform: "scaleX(-1)" }}
          />
        </motion.div>

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto relative z-10">
          {/* Main Title - Pure 2 Brand Colors (Primary & Secondary) */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-primary"
          >
            Direktori Mahasiswa &{" "}
            <span className="text-secondary">
              Karya Per Angkatan
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-on-surface-variant text-sm sm:text-lg max-w-2xl leading-relaxed mb-8"
          >
            Temukan profil pengembang, desainer, dan inovator STMIK Tazkia. Jelajahi portofolio dan repositori karya per angkatan.
          </motion.p>

          {/* Stats Summary Card - Interactive 3D Lottie Animations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-8 p-4 md:px-8 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm"
          >
            {/* Left: People Lottie */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                <DotLottieReact
                  src="/animations/people.lottie"
                  autoplay
                  loop
                />
              </div>
              <div className="text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1.5">
                    <div className="h-6 w-10 bg-primary/20 rounded-lg" />
                    <div className="h-3 w-16 bg-surface-variant/60 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-primary">{totalMahasiswa}</p>
                    <p className="text-xs font-medium text-on-surface-variant">Mahasiswa</p>
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-8 bg-outline-variant/30 hidden sm:block" />

            {/* Middle: Project Lottie */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                <DotLottieReact
                  src="/animations/project.lottie"
                  autoplay
                  loop
                />
              </div>
              <div className="text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1.5">
                    <div className="h-6 w-10 bg-secondary/20 rounded-lg" />
                    <div className="h-3 w-20 bg-surface-variant/60 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-secondary">{totalProjects}</p>
                    <p className="text-xs font-medium text-on-surface-variant">Proyek Diupload</p>
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-8 bg-outline-variant/30 hidden sm:block" />

            {/* Right: College Lottie */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                <DotLottieReact
                  src="/animations/college.lottie"
                  autoplay
                  loop
                />
              </div>
              <div className="text-left">
                {isLoading ? (
                  <div className="animate-pulse space-y-1.5">
                    <div className="h-6 w-8 bg-primary/20 rounded-lg" />
                    <div className="h-3 w-20 bg-surface-variant/60 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-primary">{availableAngkatan.length}</p>
                    <p className="text-xs font-medium text-on-surface-variant">Angkatan Aktif</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Real-time Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-2xl relative mb-6"
          >
            <div className="relative flex items-center">
              <FiSearch className="absolute left-5 text-on-surface-variant/70 text-lg pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama mahasiswa, skill (Next.js, Python), atau judul proyek..."
                className="w-full pl-13 pr-12 py-3.5 md:py-4 rounded-full bg-surface border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 p-1.5 text-on-surface-variant hover:text-on-surface rounded-full bg-surface-variant transition-all"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filter Pills (Angkatan & Prodi) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full flex flex-col gap-3 items-center"
          >
            {/* Angkatan Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5 mr-2">
                <FiFilter size={14} className="text-primary" /> Angkatan:
              </span>
              <button
                onClick={() => setSelectedAngkatan(null)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  selectedAngkatan === null
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                }`}
              >
                Semua
              </button>
              {isLoading ? (
                [1, 2, 3, 4].map(n => (
                  <div key={n} className="w-16 h-8 md:h-9 bg-surface-variant/60 rounded-full animate-pulse" />
                ))
              ) : (
                availableAngkatan.map((angkatan) => (
                  <button
                    key={angkatan}
                    onClick={() => setSelectedAngkatan(angkatan)}
                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                      selectedAngkatan === angkatan
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {angkatan}
                  </button>
                ))
              )}
            </div>

            {/* Prodi Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mr-2">Prodi:</span>
              {prodiOptions.map((prodi) => (
                <button
                  key={prodi}
                  onClick={() => setSelectedProdi(prodi)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedProdi === prodi
                      ? "bg-secondary text-white font-bold shadow-sm"
                      : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-secondary hover:text-secondary"
                  }`}
                >
                  {prodi}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
