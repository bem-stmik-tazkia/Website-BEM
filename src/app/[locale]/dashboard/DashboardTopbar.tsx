"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { FiX } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import MahasiswaCard from "@/components/mahasiswa/MahasiswaCard";
import { useRouter } from "@/i18n/routing";
import UserNotificationBell from "@/components/layout/UserNotificationBell";
import { useTranslations } from "next-intl";

export default function DashboardTopbar({ user }: { user?: any }) {
  const t = useTranslations("Dashboard");
  const supabase = createClient();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [hideProfileTooltip, setHideProfileTooltip] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { data: profileData, error } = await supabase
        .from('mahasiswa_profiles')
        .select('full_name, contact_email, angkatan, prodi, avatar_url, bio, skills, github_url, linkedin_url')
        .eq('user_id', user.id)
        .single();
        
        setHasCompletedProfile(!!profileData?.angkatan);
        if (profileData) setProfileData(profileData);
      }
    };
    checkProfile();
  }, [user, supabase]);

  useEffect(() => {
    if (hasCompletedProfile === false) {
      const hasSeen = localStorage.getItem("hasSeenProfileTooltip");
      if (!hasSeen) {
        setHideProfileTooltip(false);
        const timer = setTimeout(() => {
          setHideProfileTooltip(true);
          localStorage.setItem("hasSeenProfileTooltip", "true");
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [hasCompletedProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCard(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fullName = user?.user_metadata?.full_name || user?.raw_user_meta_data?.full_name || "Mahasiswa";
  const authAvatarUrl = user?.user_metadata?.avatar_url || user?.raw_user_meta_data?.avatar_url || user?.user_metadata?.picture || user?.raw_user_meta_data?.picture;
  // Prioritaskan avatar kustom dari database, jika kosong baru pakai avatar dari Google/Github
  const displayAvatar = profileData?.avatar_url || authAvatarUrl;
  const initial = fullName.charAt(0).toUpperCase();

  const dummyProfile = {
    id: user?.id || '1',
    full_name: profileData?.full_name || fullName,
    contact_email: profileData?.contact_email || t("notFilled"),
    email: user?.email || "",
    angkatan: profileData?.angkatan || t("notFilled"),
    prodi: profileData?.prodi || t("notFilled"),
    avatar_url: displayAvatar,
    bio: profileData?.bio || t("defaultBio"),
    skills: profileData?.skills || [],
    status_badge: profileData?.status_badge || "🚀 Open for Collab",
    github_url: profileData?.github_url,
    linkedin_url: profileData?.linkedin_url,
    instagram_url: profileData?.instagram_url,
    website_url: profileData?.website_url,
  };

  // Gamifikasi Profil (Progress Ring)
  let profileScore = 0;
  if (profileData) {
    if (profileData.contact_email) profileScore += 20;
    if (profileData.prodi) profileScore += 20;
    if (profileData.bio && profileData.bio.length > 10) profileScore += 20;
    if (profileData.skills && profileData.skills.length > 0) profileScore += 20;
    if (profileData.github_url || profileData.linkedin_url) profileScore += 20;
  }
  const completionPercentage = profileData ? profileScore : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <>
      {/* Topbar floating buttons - no background mask needed */}
      
      <div className="fixed top-6 right-4 md:top-8 md:right-8 z-50 flex items-center justify-end pointer-events-none">
      
      {/* Profile Info Bubble */}
      <div className="flex items-center gap-3 md:gap-5 relative pointer-events-auto bg-white/80 dark:bg-surface/80 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(27,64,134,0.15)] border border-[var(--color-primary)]/30 pl-3 md:pl-6 pr-2.5 py-2 transition-all hover:shadow-[0_8px_25px_rgba(27,64,134,0.25)] hover:border-[var(--color-secondary)]/50" ref={dropdownRef}>
        
        {/* Lonceng Notifikasi */}
        <UserNotificationBell isScrolled={true} isHome={false} />

        {/* Garis Pembatas */}
        <div className="w-px h-6 bg-outline-variant/30 mx-1 hidden sm:block"></div>

        {/* Nama Akun */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-on-surface leading-tight drop-shadow-sm">{fullName}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("topbarMahasiswa")}</span>
            {completionPercentage < 100 && (
              <span className="text-[9px] font-black bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">
                {t("topbarComplete", { percentage: completionPercentage })}
              </span>
            )}
          </div>
        </div>

        <div onClick={() => setShowCard(!showCard)} className="block relative cursor-pointer select-none">
          
          {/* Progress Ring */}
          <div className="absolute -inset-1.5 pointer-events-none">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
              <circle
                className="text-outline-variant/30"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="25"
                cy="25"
              />
              <circle
                className={`${completionPercentage === 100 ? 'text-green-500' : 'text-[var(--color-primary)]'} transition-all duration-1000 ease-out`}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="25"
                cy="25"
              />
            </svg>
          </div>

          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 object-cover transition-transform duration-300 ${showCard ? 'scale-90' : 'hover:scale-105'} ${completionPercentage !== 100 && !showCard ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>
            {displayAvatar && !imgError ? (
              <img 
                src={displayAvatar} 
                alt="Avatar" 
                className={`w-full h-full rounded-full object-cover transition-colors border border-outline-variant/30`}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`w-full h-full rounded-full text-white flex items-center justify-center font-bold transition-colors bg-primary`}>
                {initial}
              </div>
            )}
          </div>

          {/* Bubble Chat Tooltip */}
          <AnimatePresence>
            {!hideProfileTooltip && hasCompletedProfile === false && !showCard && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-full right-0 mt-4 z-50 animate-bounce cursor-pointer w-max"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHideProfileTooltip(true); localStorage.setItem("hasSeenProfileTooltip", "true"); }}
              >
                <div className="bg-[var(--color-secondary)] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-secondary/30 relative flex items-center gap-2">
                  <span>{t("topbarTooltip")}</span>
                  <button className="text-white/80 hover:text-white" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHideProfileTooltip(true); localStorage.setItem("hasSeenProfileTooltip", "true"); }}>
                    <FiX size={14} />
                  </button>
                  {/* Triangle Pointer */}
                  <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[var(--color-secondary)] rotate-45 rounded-sm"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Dropdown */}
          <AnimatePresence>
            {showCard && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-4 z-50 w-[340px]"
              >
                <div className="absolute -top-2 right-4 w-4 h-4 bg-surface border-t border-l border-outline-variant/30 rotate-45 z-0"></div>
                <div className="relative z-10 drop-shadow-2xl">
                  <MahasiswaCard 
                    mahasiswa={dummyProfile}
                    onSelect={() => {
                      setShowCard(false);
                      router.push("/mahasiswa");
                    }}
                  />
                  <div className="absolute top-3 right-3 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push("/dashboard/profile"); setShowCard(false); }}
                      className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>{t("topbarEditProfile")}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
    </>
  );
}
