"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MahasiswaHero from "@/components/mahasiswa/MahasiswaHero";
import MahasiswaCard, { MahasiswaProfile } from "@/components/mahasiswa/MahasiswaCard";
import MahasiswaProfileDrawer from "@/components/mahasiswa/MahasiswaProfileDrawer";
import ProfileOverlay from "@/components/mahasiswa/ProfileOverlay";
import { ProjectData } from "@/components/mahasiswa/ProjectCard";
import { createClient } from "@/utils/supabase/client";
import Footer from "@/components/layout/Footer";
import MahasiswaTourClient from "@/components/mahasiswa/MahasiswaTourClient";
import { FiUserX, FiUsers, FiFolder, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslations, useLocale } from "next-intl";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
import { ALL_PRODI_VALUE, getProdiDisplayLabel, isAllProdi } from "@/utils/prodiOptions";

function MahasiswaShowcaseContent() {
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaProfile[]>([]);
  const [projectList, setProjectList] = useState<(ProjectData & { mahasiswa_id: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAngkatan, setSelectedAngkatan] = useState<number | null>(null);
  const [selectedProdi, setSelectedProdi] = useState(ALL_PRODI_VALUE);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<MahasiswaProfile | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const router = useRouter();
  const autoOpenedRef = useRef(false);
  const gridRef = useRef<HTMLElement>(null);
  const t = useTranslations("MahasiswaPage");
  const locale = useLocale();

  // Auto-translate status_badge saja; bio & prodi tetap asli (bio = bahasa pengguna, prodi = i18n statis)
  const { data: translatedMahasiswaList, isTranslating: isTranslatingMhs } = useTranslatedList(
    mahasiswaList,
    "mahasiswa_profiles",
    locale,
    ["status_badge"]
  );

  // Auto-translate title & description proyek dari database
  const { data: translatedProjectList } = useTranslatedList(
    projectList,
    "karya",
    locale,
    ["title", "description"]
  );


  const supabase = createClient();

  // Fetch Data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const { data: profiles, error: profileErr } = await supabase
          .from("mahasiswa_profiles")
          .select("*")
          .order("angkatan", { ascending: false });

        const { data: projects, error: projErr } = await supabase
          .from("karya")
          .select("*")
          .eq("status", "approved");

        let mappedProjects: any[] = [];
        if (projects && projects.length > 0) {
          mappedProjects = projects.map(p => {
             const mhsId = profiles?.find(prof => prof.user_id === p.user_id)?.id || "";
             return {
               id: p.id,
               title: p.title,
               description: p.description,
               tech_stack: p.tech_stack || [],
               demo_url: p.live_url,
               github_url: p.github_url,
               cover_image: p.image_url,
               likes_count: p.likes || 0,
               views_count: p.views || 0,
               category: p.category,
               mahasiswa_id: mhsId,
             }
          });
        }

        if (profiles && profiles.length > 0) {
          // Count projects per mahasiswa
          const formattedProfiles = profiles.map((p) => {
            const count = mappedProjects.filter((proj) => proj.mahasiswa_id === p.id).length || 0;
            return { ...p, projects_count: count };
          });
          setMahasiswaList(formattedProfiles);
        }

        setProjectList(mappedProjects);
      } catch (err) {
        console.error("Error fetching mahasiswa data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Auto select from URL – gunakan ref agar tidak loop saat close
  useEffect(() => {
    if (idFromUrl && mahasiswaList.length > 0 && !autoOpenedRef.current) {
      const match = mahasiswaList.find(m => m.id === idFromUrl || m.user_id === idFromUrl);
      if (match) {
        autoOpenedRef.current = true;
        setSelectedMahasiswa(match);
        setShowFullProfile(true); // Langsung buka full profile, bukan drawer
      }
    }
  }, [idFromUrl, mahasiswaList]);

  // Extract available Angkatan dynamically
  const availableAngkatan = useMemo(() => {
    const years = Array.from(new Set(mahasiswaList.map((m) => m.angkatan))).sort((a, b) => a - b);
    return years;
  }, [mahasiswaList]);

  const filteredMahasiswa = useMemo(() => {
    return translatedMahasiswaList.filter((m) => {
      // Filter by Angkatan
      if (selectedAngkatan !== null && m.angkatan !== selectedAngkatan) {
        return false;
      }
      // Filter by Prodi — bandingkan nilai kanonik dari database
      if (!isAllProdi(selectedProdi)) {
        const orig = mahasiswaList.find((orig) => orig.id === m.id) ?? m;
        if (orig.prodi !== selectedProdi) return false;
      }
      // Filter by Search Query (gunakan teks asli dari mahasiswaList agar search tidak terpengaruh terjemahan)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const orig = mahasiswaList.find((orig) => orig.id === m.id) ?? m;
        const matchesName = orig.full_name.toLowerCase().includes(query);
        const matchesNIM = false;
        const matchesBio = orig.bio?.toLowerCase().includes(query) || false;
        const matchesSkills = orig.skills?.some((s) => s.toLowerCase().includes(query));

        // Check if any project title/tech stack matches
        const studentProjects = projectList.filter((p) => p.mahasiswa_id === m.id);
        const matchesProject = studentProjects.some(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.tech_stack?.some((t) => t.toLowerCase().includes(query))
        );

        return matchesName || matchesNIM || matchesBio || matchesSkills || matchesProject;
      }

      return true;
    });
  }, [translatedMahasiswaList, mahasiswaList, projectList, searchQuery, selectedAngkatan, selectedProdi]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredMahasiswa.length / ITEMS_PER_PAGE) || 1;
  const paginatedMahasiswa = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMahasiswa.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMahasiswa, currentPage]);

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAngkatan, selectedProdi]);

  // Active student's projects for drawer modal
  const selectedStudentProjects = useMemo(() => {
    if (!selectedMahasiswa) return [];
    return projectList.filter((p) => p.mahasiswa_id === selectedMahasiswa.id);
  }, [selectedMahasiswa, projectList]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Hero Section with Search & Filters */}
      <MahasiswaHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedAngkatan={selectedAngkatan}
        setSelectedAngkatan={setSelectedAngkatan}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        totalMahasiswa={mahasiswaList.length}
        totalProjects={projectList.length}
        availableAngkatan={availableAngkatan}
        isLoading={isLoading || (isTranslatingMhs && translatedMahasiswaList.length === 0)}
      />

      {/* Main Grid Content */}
      <main ref={gridRef} className="max-w-7xl mx-auto px-4 md:px-10 py-8 flex-1 w-full pb-40 lg:pb-12">
        {/* Section Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            {isLoading || (isTranslatingMhs && translatedMahasiswaList.length === 0) ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-surface-variant/60 rounded-xl w-64" />
                <div className="h-4 bg-surface-variant/40 rounded-lg w-36" />
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface flex items-center gap-2">
                  <FiUsers className="text-primary" />
                  {selectedAngkatan ? t("titleFiltered", { angkatan: selectedAngkatan }) : t("titleAll")}
                </h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  {t("foundCount", { count: filteredMahasiswa.length })}
                  {!isAllProdi(selectedProdi) ? ` (${getProdiDisplayLabel(selectedProdi, t)})` : ""}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Skeleton Loading Grid */}
        {isLoading || (isTranslatingMhs && translatedMahasiswaList.length === 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-surface border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                {/* Avatar/Cover area */}
                <div className="h-32 bg-surface-variant/60" />
                {/* Avatar circle */}
                <div className="px-4 -mt-8 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-surface-variant/80 border-4 border-surface" />
                </div>
                {/* Name & role */}
                <div className="px-4 pb-4 space-y-2">
                  <div className="h-4 bg-surface-variant/70 rounded-md w-3/4" />
                  <div className="h-3 bg-surface-variant/40 rounded-md w-1/2" />
                  <div className="h-3 bg-surface-variant/40 rounded-md w-2/3" />
                  {/* Tags */}
                  <div className="flex gap-2 pt-1">
                    <div className="h-5 w-14 bg-surface-variant/50 rounded-full" />
                    <div className="h-5 w-16 bg-surface-variant/50 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMahasiswa.length > 0 ? (
          <>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
          >
            <AnimatePresence>
              {paginatedMahasiswa.map((mahasiswa) => (
                <MahasiswaCard
                  key={mahasiswa.id}
                  mahasiswa={mahasiswa}
                  searchQuery={searchQuery}
                  onSelect={(m) => setSelectedMahasiswa(m)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 flex justify-center items-center gap-2 w-full"
            >
              <button
                onClick={() => goToPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:text-on-surface-variant transition-colors"
                aria-label={t("previous")}
              >
                <FiChevronLeft size={18} />
                <span className="hidden sm:inline">{t("previous")}</span>
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    currentPage === page
                      ? "bg-primary text-white shadow-md"
                      : "bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary hover:text-primary"
                  }`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:text-on-surface-variant transition-colors"
                aria-label={t("next")}
              >
                <span className="hidden sm:inline">{t("next")}</span>
                <FiChevronRight size={18} />
              </button>
            </motion.div>
          )}
          </>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6 rounded-3xl bg-surface-container/50 border border-outline-variant/30 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <FiUserX size={32} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{t("emptyTitle")}</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              {t("emptyDesc")}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAngkatan(null);
                setSelectedProdi(ALL_PRODI_VALUE);
              }}
              className="px-6 py-2.5 rounded-full bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-all shadow-md"
            >
              {t("resetFilter")}
            </button>
          </motion.div>
        )}
      </main>

      {/* Student Profile Drawer */}
      <MahasiswaProfileDrawer
        mahasiswa={selectedMahasiswa}
        projects={selectedMahasiswa ? translatedProjectList.filter((p) => p.mahasiswa_id === selectedMahasiswa.id) : []}
        onClose={() => {
          setSelectedMahasiswa(null);
          setShowFullProfile(false);
        }}
        onShowFullProfile={() => setShowFullProfile(true)}
      />

      {/* Full-screen Profile Overlay (when "+ Karya Lainnya" diklik) */}
      <AnimatePresence>
        {showFullProfile && selectedMahasiswa && (
          <ProfileOverlay
            key="public-profile-overlay"
            profile={selectedMahasiswa}
            projects={translatedProjectList.filter((p) => p.mahasiswa_id === selectedMahasiswa.id)}
            onClose={() => setShowFullProfile(false)}
            isOwnProfile={false}
          />
        )}
      </AnimatePresence>

      <MahasiswaTourClient />
    </div>
  );
}

export default function MahasiswaShowcasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-bold">Memuat...</div>}>
      <MahasiswaShowcaseContent />
    </Suspense>
  );
}
