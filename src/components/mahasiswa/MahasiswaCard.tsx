"use client";

import React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiFolder, FiChevronRight } from "react-icons/fi";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getProdiDisplayLabel } from "@/utils/prodiOptions";

export interface MahasiswaProfile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  contact_email?: string;
  angkatan: number;
  prodi: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  status_badge?: string;
  github_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  website_url?: string;
  skills: string[];
  is_featured?: boolean;
  projects_count?: number;
}

export interface MahasiswaCardProps {
  mahasiswa: MahasiswaProfile;
  onSelect: (mahasiswa: MahasiswaProfile) => void;
  searchQuery?: string;
  editButton?: React.ReactNode;
}

export default function MahasiswaCard({ mahasiswa, onSelect, searchQuery = "", editButton }: MahasiswaCardProps) {
  const [imgError, setImgError] = useState(false);
  const t = useTranslations("MahasiswaCard");
  const tPage = useTranslations("MahasiswaPage");
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

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(mahasiswa)}
      className="group cursor-pointer relative bg-surface rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Card Banner */}
      <div className="relative h-24 sm:h-28 w-full bg-primary overflow-hidden p-2.5 sm:p-3">
        {/* Dot grid */}
        <motion.div
          animate={{ x: [0, -20], y: [0, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-[150%] h-[150%] opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at center, #ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />
        {/* Shimmer */}
        <motion.div
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Angkatan pill */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-white/20">
            {t("batch")} {mahasiswa.angkatan}
          </span>
          {mahasiswa.status_badge && (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-secondary text-white text-[9px] sm:text-[10px] font-bold">
              {translateStatusBadge(mahasiswa.status_badge)}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 relative flex-1 flex flex-col">
        {/* Avatar + Email */}
        <div className="relative -mt-6 sm:-mt-8 mb-2 sm:mb-3 flex items-end justify-between">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-[10px] sm:rounded-2xl p-0.5 bg-surface shadow-lg overflow-hidden border-2 border-white group-hover:border-secondary transition-all duration-300 shrink-0">
            {mahasiswa.avatar_url && !imgError ? (
              <Image
                src={mahasiswa.avatar_url}
                alt={mahasiswa.full_name}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-secondary text-white flex items-center justify-center text-xl sm:text-2xl font-bold">
                {mahasiswa.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Right Side: Email */}
          <div className="flex items-end justify-end">
            {/* Email Button - Only on desktop */}
            <a
              href={`mailto:${mahasiswa.contact_email || mahasiswa.email}`}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm bg-surface-variant hover:bg-primary/10 text-on-surface hover:text-primary border border-outline-variant/30"
            >
              <FiMail size={13} className="text-secondary" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Name & Prodi */}
        <div className="mb-1.5 sm:mb-2">
          <h3 className="text-sm sm:text-base font-extrabold text-primary group-hover:text-secondary transition-colors line-clamp-1">
            {mahasiswa.full_name}
          </h3>
          <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant mt-0.5 line-clamp-1">
            {getProdiDisplayLabel(mahasiswa.prodi, tPage)}
          </p>
        </div>

        {/* Skills - Placed under Name & Prodi for cleaner look */}
        {mahasiswa.skills && mahasiswa.skills.length > 0 && (
          <div className="flex items-center gap-1 mb-2 sm:mb-3">
            {(() => {
              let displaySkills = [...mahasiswa.skills];
              if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const matchIdx = displaySkills.findIndex(s => s.toLowerCase().includes(query));
                if (matchIdx > 0) {
                  const matched = displaySkills.splice(matchIdx, 1)[0];
                  displaySkills.unshift(matched);
                }
              }
              return (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] sm:text-[10px] font-bold border border-primary/20 max-w-[120px] sm:max-w-[150px] truncate">
                    {displaySkills[0]}
                  </span>
                  {displaySkills.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[9px] sm:text-[10px] font-bold">
                      +{displaySkills.length - 1}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Bio */}
        <p className="hidden sm:block text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4 flex-1">
          {mahasiswa.bio || t("defaultBio")}
        </p>
        
        {/* Mobile spacing flex-1 when bio is hidden */}
        <div className="flex-1 sm:hidden"></div>

        {/* Footer */}
        <div className="pt-2 sm:pt-3 border-t border-outline-variant/30 flex items-center justify-between mt-2 sm:mt-0">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-on-surface-variant">
            <FiFolder size={12} className="text-secondary sm:w-[13px] sm:h-[13px]" />
            <span>{mahasiswa.projects_count ?? 0} {t("projects")}</span>
          </div>
          {editButton ? (
            <div onClick={(e) => e.stopPropagation()}>{editButton}</div>
          ) : (
            <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              <span className="hidden sm:inline">{t("view")}</span>{t("portfolio")}
              <FiChevronRight size={12} className="sm:w-[14px] sm:h-[14px]" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
