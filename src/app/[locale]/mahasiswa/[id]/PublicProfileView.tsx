"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGithub, FiLinkedin, FiGlobe, FiFolder,
  FiSend, FiShare2, FiCopy, FiCheck, FiX, FiInstagram
} from "react-icons/fi";
import ProjectCard, { ProjectData } from "@/components/mahasiswa/ProjectCard";
import { useTranslations } from "next-intl";

interface PublicProfileViewProps {
  mahasiswa: any;
  projects: ProjectData[];
}

export default function PublicProfileView({ mahasiswa, projects }: PublicProfileViewProps) {
  const router = useRouter();
  const t = useTranslations("ProfileView");
  const tDashboard = useTranslations("DashboardKarya");
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
    return badgeStr;
  };
  
  const [projectFilter, setProjectFilter] = useState(t("filterAll"));
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/mahasiswa/${mahasiswa.id}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const categories = [t("filterAll"), ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
  const filteredProjects = projectFilter === t("filterAll")
    ? projects
    : projects.filter(p => p.category === projectFilter);

  return (
    <>
      {/* Full Screen Overlay – same animation as DashboardBottomNav */}
      <div className="fixed inset-0 z-[100] flex justify-center bg-surface overflow-y-auto">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full h-fit min-h-full flex flex-col"
        >
          {/* ── Top Banner ── */}
          <div className="relative h-48 sm:h-64 w-full bg-primary overflow-hidden flex-shrink-0">
            {/* Animated grid */}
            <motion.div
              animate={{ x: [0, -20], y: [0, -20] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-[150%] h-[150%] opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at center, #ffffff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

            {/* Angkatan badge */}
            {mahasiswa?.angkatan && (
                <div className="absolute top-6 left-6 md:left-12 z-10 flex gap-2 mb-4">
                  <span className="bg-primary/20 text-white px-4 py-1.5 rounded-full font-bold shadow-sm backdrop-blur-md text-xs uppercase tracking-wider border border-white/20">
                    {t("angkatan", { year: mahasiswa.angkatan })}
                  </span>
                </div>
            )}

            {/* Close button */}
            <button
              onClick={() => router.back()}
              className="absolute top-6 right-6 md:right-12 z-20 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 hover:scale-105 transition-all backdrop-blur-md border border-white/20 shadow-lg"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* ── Profile Body ── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 pb-20 flex-1 flex flex-col">

            {/* Header Layout: Avatar + Action Buttons (overlapping banner) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-8 relative z-10">

              {/* Avatar + Badge */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-surface shadow-xl overflow-hidden border-4 border-surface shrink-0">
                  {mahasiswa.avatar_url ? (
                    <Image src={mahasiswa.avatar_url} alt={mahasiswa.full_name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary text-white flex items-center justify-center text-4xl font-bold">
                      {mahasiswa.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pb-2">
                  {(mahasiswa.status_badge || mahasiswa.skills?.[0]) && (
                    <div className="flex items-center gap-1.5 bg-secondary backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md">
                      <span className="text-[13px] text-white font-bold tracking-wide">
                        {mahasiswa.status_badge ? translateStatusBadge(mahasiswa.status_badge) : mahasiswa.skills?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                {mahasiswa.contact_email && (
                  <Link 
                    href={`mailto:${mahasiswa.contact_email}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-primary/20"
                  >
                    <FiSend size={18} />
                    <span className="hidden sm:inline">{t("sendEmail")}</span>
                  </Link>
                )}

                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-variant hover:bg-outline-variant/30 text-on-surface font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm border border-outline-variant/30"
                >
                  <FiShare2 size={18} />
                  <span className="hidden sm:inline">{t("shareProfile")}</span>
                </button>
                {mahasiswa.github_url && (
                  <a href={mahasiswa.github_url} target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-surface-variant hover:bg-outline-variant text-on-surface transition-all border border-outline-variant/30 shadow-sm hover:-translate-y-0.5">
                    <FiGithub size={18} />
                  </a>
                )}
                {mahasiswa.linkedin_url && (
                  <a href={mahasiswa.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-surface-variant hover:bg-outline-variant text-on-surface transition-all border border-outline-variant/30 shadow-sm hover:-translate-y-0.5">
                    <FiLinkedin size={18} />
                  </a>
                )}
                {mahasiswa.website_url && (
                  <a href={mahasiswa.website_url} target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-surface-variant hover:bg-outline-variant text-on-surface transition-all border border-outline-variant/30 shadow-sm hover:-translate-y-0.5">
                    <FiGlobe size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Name & Info */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary leading-tight mb-2">
                {mahasiswa.full_name}
              </h2>
              <p className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                {mahasiswa.prodi}
              </p>
              <div className="flex flex-wrap gap-2">
                {mahasiswa.skills?.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-surface-variant text-on-surface text-xs font-bold shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <p className="text-on-surface-variant text-[15px] leading-relaxed mb-8 bg-surface-variant/30 p-5 md:p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
              {mahasiswa.bio || t("defaultBio")}
            </p>

            {/* Projects Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-outline-variant/30">
              <div className="flex items-center gap-3 font-bold text-base text-primary">
                <FiFolder size={20} />
                <span>{t("projects")} ({projects.length})</span>
              </div>
              {projects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: any) => (
                    <button
                      key={cat}
                      onClick={() => setProjectFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                        projectFilter === cat
                          ? "bg-secondary text-white"
                          : "bg-surface-variant text-on-surface-variant hover:text-primary hover:bg-outline-variant/30"
                      }`}
                    >
                      {cat === t("filterAll") ? cat : cat === "Technology" ? tDashboard("catWeb") : cat === "Programming" ? tDashboard("catMobile") : cat === "Research" ? tDashboard("catResearch") : cat === "IoT" ? tDashboard("catIoT") : cat === "Multimedia" ? tDashboard("catDesign") : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Grid */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProjectCard project={project} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredProjects.length === 0 && (
                  <div className="col-span-2 text-center py-10 bg-surface-variant/20 rounded-2xl border border-dashed border-outline-variant">
                    <p className="text-on-surface-variant text-sm">{t("noProjectsCat")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-3xl bg-surface-variant/20 border-2 border-dashed border-outline-variant">
                <FiFolder size={48} className="mx-auto text-on-surface-variant/30 mb-4" />
                <p className="font-bold text-lg text-on-surface mb-2">{t("noPublicWorks")}</p>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                  {t("otherEmptyDesc")}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-surface p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-outline-variant/30 flex flex-col items-center"
            >
              <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 p-2 bg-surface-variant text-on-surface-variant hover:text-primary rounded-full transition-colors">
                <FiX size={20} />
              </button>
              <div className="p-3 bg-primary/10 text-primary rounded-full mb-3 mt-4">
                <FiShare2 size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-primary mb-2 mt-2 text-center">{t("shareProfile")}</h3>
              <p className="text-sm text-on-surface-variant text-center mb-6">
                {t("shareModalDesc")}
              </p>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/20 mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&margin=0`}
                  alt="QR Code"
                  className="w-40 h-40"
                />
              </div>
              <div className="w-full flex items-center bg-surface-variant/30 border border-outline-variant/50 rounded-xl overflow-hidden p-1.5 gap-2">
                <input type="text" readOnly value={shareUrl} className="flex-1 bg-transparent px-3 py-2 text-xs text-on-surface-variant outline-none" />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copiedLink ? "bg-secondary text-white" : "bg-primary text-white hover:bg-primary/90"}`}
                >
                  {copiedLink ? <FiCheck size={14} /> : <FiCopy size={14} />}
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
