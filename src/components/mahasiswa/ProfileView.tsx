"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  FiGithub, FiLinkedin, FiGlobe, FiFolder,
  FiSend, FiShare2, FiCopy, FiCheck, FiX,
  FiEdit2, FiAward, FiCode, FiExternalLink, FiDownload
} from "react-icons/fi";
import { FaWhatsapp, FaTelegram, FaXTwitter } from "react-icons/fa6";
import ProjectCard, { ProjectData } from "@/components/mahasiswa/ProjectCard";
import { useTranslations, useLocale } from "next-intl";
import { useTranslatedContent, useTranslatedList } from "@/hooks/useTranslatedContent";
import { downloadTransparentQr } from "@/utils/qrDownload";

export interface ProfileViewData {
  id?: string;
  full_name: string;
  prodi?: string;
  angkatan?: number | string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  status_badge?: string;
  github_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  website_url?: string;
  contact_email?: string;
  email?: string;
}

interface ProfileViewProps {
  profile: ProfileViewData;
  projects: ProjectData[];
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  Technology: "Web & Sistem",
  Programming: "Mobile",
  Research: "KTI & Jurnal",
  IoT: "IoT",
  Multimedia: "Desain",
};

export default function ProfileView({
  profile: rawProfile,
  projects: rawProjects,
  isOwnProfile = false,
  onEditProfile,
}: ProfileViewProps) {
  const t = useTranslations("ProfileView");
  const locale = useLocale();
  
  const { data: profileObj, isTranslating: isTranslatingProfile } = useTranslatedContent(
    rawProfile,
    "mahasiswa_profiles",
    locale,
    ["bio", "prodi"],
    "id"
  );
  const profile = profileObj || rawProfile;

  const { data: projects, isTranslating: isTranslatingProjects } = useTranslatedList(
    rawProjects,
    "karya",
    locale,
    ["title", "description", "category"],
    "id"
  );

  const tStatus = useTranslations("StatusBadge");
  const translateStatusBadge = (badgeStr: string) => {
    if (!badgeStr) return badgeStr;
    const isMatched = (key: string) => badgeStr.toLowerCase().includes(key.toLowerCase());
    if (isMatched("Open for Collab")) return `🚀 ${tStatus("openForCollab")}`;
    if (isMatched("Mencari Magang")) return `💼 ${tStatus("lookingForInternship")}`;
    if (isMatched("Siap Freelance")) return `🤝 ${tStatus("readyForFreelance")}`;
    if (isMatched("Fokus Belajar")) return `📚 ${tStatus("focusOnStudy")}`;
    if (isMatched("Bekerja Full-time")) return `💻 ${tStatus("workingFullTime")}`;
    if (isMatched("Punya Ide Startup")) return `💡 ${tStatus("haveStartupIdea")}`;
    if (isMatched("Mencari Mentor")) return `🔍 ${tStatus("lookingForMentor")}`;
    return badgeStr; // fallback if no match
  };

  const isTranslating = isTranslatingProfile || isTranslatingProjects;
  const [projectFilter, setProjectFilter] = useState("Semua");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [downloadedQR, setDownloadedQR] = useState(false);
  const [qrTheme, setQrTheme] = useState<"light" | "dark">("light");

  const SKILL_COLORS = [
    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600",
    "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600",
    "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600",
    "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600",
  ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (filteredProjects.length === 0) return;
    const cardWidth = el.scrollWidth / filteredProjects.length;
    const newIdx = Math.min(
      filteredProjects.length - 1,
      Math.max(0, Math.round(el.scrollLeft / cardWidth))
    );
    if (newIdx !== activeProjectIdx) setActiveProjectIdx(newIdx);
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/mahasiswa/${profile.id}`
      : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      await downloadTransparentQr(
        shareUrl,
        qrTheme,
        `QR_Profile_${profile.full_name.replace(/\s+/g, "_")}.png`
      );

      setDownloadedQR(true);
      setTimeout(() => setDownloadedQR(false), 3000);
    } catch (error) {
      console.error("Error downloading QR:", error);
      alert(t("qrFail"));
    }
  };

  const categories: string[] = [
    "Semua",
    ...Array.from(
      new Set(
        projects
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  const filteredProjects =
    projectFilter === "Semua"
      ? projects
      : projects.filter((p) => p.category === projectFilter);

  return (
    <>
      <div className={`relative min-h-full pb-8 w-full transition-opacity duration-300 ${isTranslating ? "opacity-70" : "opacity-100"}`}>
          {/* ── TOP HEADER STRIP (Banner) ── */}
          <div className="relative h-40 sm:h-52 bg-primary overflow-hidden">
            {/* Animated dot grid */}
            <motion.div
              animate={{ x: [0, -28], y: [0, -28] }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-[170%] h-[170%] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)",
                backgroundSize: "26px 26px",
              }}
            />
            {/* Shimmer */}
            <motion.div
              animate={{ x: ["-140%", "400%"] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
              className="absolute top-0 bottom-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-12 pointer-events-none"
            />
            {/* Bottom fade into surface */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent pointer-events-none" />

            {/* CTA Kolaborasi — inside banner, only public view */}
            {!isOwnProfile && (
              <div className="absolute top-6 sm:top-8 right-[72px] md:right-[90px] z-10 hidden sm:flex items-center gap-3">
                <p className="text-white/90 text-sm font-semibold hidden md:block">{t("interestedCollab")}</p>
                <a
                  href={`mailto:${profile.contact_email || profile.email}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white font-extrabold text-xs hover:bg-secondary/90 hover:scale-105 transition-all shadow-md shadow-secondary/20 border border-secondary"
                >
                  <FiSend size={14} />
                  {t("sendEmail")}
                </a>
              </div>
            )}
          </div>

          {/* ── MAIN BODY ── */}
          <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">

            {/* ════ LEFT SIDEBAR ════ */}
            <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 relative">
              
              <div className="lg:sticky lg:top-28 lg:pb-10">
                {/* Avatar — negative margin to overlap banner */}
                <div className="-mt-16 sm:-mt-24 mb-5 relative">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-[6px] border-surface shadow-lg bg-surface">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-[#F97316] text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold">
                        {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                </div>

              {/* Info Text */}
              <div className="mb-6">
                {profile.status_badge && (
                  <span className="inline-block mb-3 px-3 py-1 rounded-md bg-secondary/10 text-secondary text-[11px] font-extrabold tracking-widest uppercase border border-secondary/20">
                    {translateStatusBadge(profile.status_badge)}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight mb-2">
                  {profile.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/60" />
                    {profile.prodi}
                  </span>
                  {profile.angkatan && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-outline-variant/60 mx-1" />
                      <span className="text-primary/90">{t("angkatan", { year: profile.angkatan })}</span>
                    </>
                  )}
                </div>

                {/* Stats mini row */}
                <div className="flex items-center gap-3 mt-4 text-sm text-on-surface-variant font-bold">
                  <div className="flex items-center gap-1.5">
                    <FiAward size={14} className="text-primary" />
                    {t("karyaCount", { count: projects.length })}
                  </div>
                  {profile.skills && profile.skills.length > 0 && (
                    <>
                      <div className="w-px h-3 bg-outline-variant/50" />
                      <div className="flex items-center gap-1.5">
                        <FiCode size={14} className="text-primary" />
                        {t("skillsCount", { count: profile.skills.length })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-8 flex flex-col gap-3">
                {isOwnProfile ? (
                  <Link
                    href="/dashboard/profile"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-secondary text-secondary font-bold text-sm hover:bg-secondary hover:text-white transition-all shadow-sm"
                  >
                    <FiEdit2 size={16} />
                    {t("editProfile")}
                  </Link>
                ) : (
                  <a
                    href={`mailto:${profile.contact_email || profile.email}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary/90 transition-all shadow-md shadow-secondary/20"
                  >
                    <FiSend size={16} />
                    {t("sendEmail")}
                  </a>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:border-secondary/50 hover:text-secondary transition-all"
                >
                  <FiShare2 size={15} />
                  {t("shareProfile")}
                </button>
              </div>

              {/* Social Links */}
              {(profile.github_url || profile.linkedin_url || profile.website_url) && (
                <div className="mb-8 space-y-2">
                  <p className="text-[11px] font-extrabold text-on-surface-variant/70 uppercase tracking-[0.15em] mb-4">{t("links")}</p>
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-bold text-on-surface hover:bg-primary/8 hover:text-primary border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <FiGithub size={18} className="shrink-0 text-on-surface-variant group-hover:text-primary" />
                      <span className="truncate">GitHub</span>
                      <FiExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-bold text-on-surface hover:bg-primary/8 hover:text-primary border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <FiLinkedin size={18} className="shrink-0 text-on-surface-variant group-hover:text-primary" />
                      <span className="truncate">LinkedIn</span>
                      <FiExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-bold text-on-surface hover:bg-primary/8 hover:text-primary border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <FiGlobe size={18} className="shrink-0 text-on-surface-variant group-hover:text-primary" />
                      <span className="truncate">Website</span>
                      <FiExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              )}

              {/* Bio */}
              <div className="mb-8">
                <p className="text-[11px] font-extrabold text-on-surface-variant/70 uppercase tracking-[0.15em] mb-3">
                  {t("about")}
                </p>
                <p className="text-[15px] text-on-surface-variant leading-relaxed">
                  {profile.bio || t("defaultBio")}
                </p>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-8">
                  <p className="text-[11px] font-extrabold text-on-surface-variant/70 uppercase tracking-[0.15em] mb-3">
                    {t("skills")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-default transition-colors shadow-sm ${SKILL_COLORS[idx % SKILL_COLORS.length]}`}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </aside>

            {/* ════ RIGHT CONTENT: Projects ════ */}
            <main className="flex-1 lg:pt-5 pb-10">

              {/* CTA Kolaborasi — mobile only (banner has it on desktop) */}
              {!isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 sm:hidden rounded-2xl border border-secondary/20 bg-secondary/5 p-4 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-extrabold text-secondary">{t("interestedCollab")}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("collabDesc")}
                    </p>
                  </div>
                  <a
                    href={`mailto:${profile.contact_email || profile.email}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/90 transition-all shadow-md shadow-secondary/20 shrink-0"
                  >
                    <FiSend size={12} />
                    {t("emailBtn")}
                  </a>
                </motion.div>
              )}

              {/* Projects header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <FiFolder size={20} className="text-primary" />
                  <h2 className="text-lg font-extrabold text-on-surface">
                    {t("projects")}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold ml-1">
                    {projects.length}
                  </span>
                </div>

                {/* Filter chips */}
                {projects.length > 0 && categories.length > 1 && (
                  <div className="flex flex-row gap-2 overflow-x-auto pb-3 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 scrollbar-hide snap-x scroll-pl-5 relative">
                    <div className="w-0 shrink-0 md:hidden" /> {/* Spacer for left edge */}
                    {categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setProjectFilter(cat);
                          setActiveProjectIdx(0);
                        }}
                        className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                          projectFilter === cat
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-surface-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {cat === "Semua" ? t("filterAll") : (cat in CATEGORY_LABEL ? CATEGORY_LABEL[cat] : cat)}
                      </button>
                    ))}
                    <div className="w-4 shrink-0 md:hidden" /> {/* Spacer for right edge */}
                  </div>
                )}
              </div>

              {/* Project Grid */}
              {projects.length > 0 ? (
                <>
                <div 
                  onScroll={handleScroll}
                  className="flex xl:grid xl:grid-cols-2 gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-pl-5 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0 md:overflow-visible md:pb-0 md:snap-none md:flex-wrap"
                >
                  <div className="w-0 shrink-0 md:hidden" /> {/* Spacer for left edge */}
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project, idx) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="w-[85vw] sm:w-[320px] snap-center shrink-0 xl:w-auto xl:shrink flex-none"
                      >
                        <ProjectCard project={project} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="w-1 shrink-0 md:hidden" /> {/* Spacer for right edge */}

                  {filteredProjects.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-surface-variant/20 rounded-2xl border border-dashed border-outline-variant/50">
                      <p className="text-on-surface-variant text-sm font-medium">
                        {t("noProjectsCat")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile Indicators */}
                {filteredProjects.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-2 mb-6 xl:hidden">
                    {filteredProjects.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === activeProjectIdx 
                            ? "w-4 bg-primary" 
                            : "w-1.5 bg-outline-variant/50"
                        }`} 
                      />
                    ))}
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-20 px-4 rounded-3xl bg-surface-variant/20 border-2 border-dashed border-outline-variant/40">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4 text-primary/40">
                    <FiFolder size={32} />
                  </div>
                  <p className="font-bold text-xl text-on-surface mb-2">
                    {t("noPublicWorks")}
                  </p>
                  <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                    {isOwnProfile
                      ? t("ownEmptyDesc")
                      : t("otherEmptyDesc")}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/dashboard/upload"
                      className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                      {t("uploadFirst")}
                    </Link>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowShareModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-surface p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-outline-variant/30 flex flex-col items-center z-10"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 bg-surface-variant text-on-surface-variant hover:text-primary rounded-full transition-colors"
              >
                <FiX size={18} />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 mt-1">
                <FiShare2 size={22} />
              </div>
              <h3 className="text-xl font-extrabold text-primary mb-1 text-center">
                {t("shareProfile")}
              </h3>
              <p className="text-sm text-on-surface-variant text-center mb-5">
                {t("shareModalDesc")}
              </p>
              
              {/* QR Code */}
              <div className={`p-3 rounded-2xl shadow-sm border border-outline-variant/20 mb-4 flex flex-col items-center w-full transition-colors ${qrTheme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                {/* Theme Toggle */}
                <div className="flex w-full mb-3 bg-surface-variant/40 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setQrTheme('light')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      qrTheme === 'light' 
                        ? 'bg-white text-on-surface shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => setQrTheme('dark')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      qrTheme === 'dark' 
                        ? 'bg-[#2a2a2a] text-white shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
                
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&margin=0${qrTheme === 'dark' ? '&color=ffffff&bgcolor=1a1a1a' : ''}`}
                  alt="QR Code"
                  className="w-40 h-40 mb-3 rounded-lg"
                  id="qr-code-img"
                />
                <button
                  onClick={handleDownloadQR}
                  className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                    downloadedQR 
                      ? "bg-secondary/10 border-secondary/30 text-secondary" 
                      : "bg-surface-variant hover:bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {downloadedQR ? <FiCheck size={14} /> : <FiDownload size={14} />}
                  {downloadedQR ? t("qrSuccess") : t("qrDownload")}
                </button>
              </div>

              {/* Social Share Buttons */}
              <div className="flex gap-2 w-full mb-4">
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Lihat profil portofolio ${profile.full_name} di: ${shareUrl}`)}`, '_blank')}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                  title="Bagikan ke WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </button>
                <button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Lihat profil portofolio ${profile.full_name}`)}`, '_blank')}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
                  title="Bagikan ke Telegram"
                >
                  <FaTelegram size={18} />
                </button>
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Lihat profil portofolio ${profile.full_name}`)}`, '_blank')}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-surface-variant text-on-surface hover:bg-outline-variant transition-colors"
                  title="Bagikan ke X (Twitter)"
                >
                  <FaXTwitter size={16} />
                </button>
              </div>

              {/* Copy Link Input */}
              <div className="w-full flex items-center bg-surface-variant/30 border border-outline-variant/50 rounded-xl overflow-hidden p-1.5 gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-on-surface-variant outline-none min-w-0"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    copiedLink
                      ? "bg-secondary text-white"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {copiedLink ? <FiCheck size={13} /> : <FiCopy size={13} />}
                  {copiedLink ? t("copied") : t("copyLink")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
