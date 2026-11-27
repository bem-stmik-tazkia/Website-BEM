"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiHome, FiLogOut, FiMenu, FiChevronRight } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import AdminNotificationBell from "./AdminNotificationBell";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";
import UserAvatar from "@/components/ui/UserAvatar";

interface AdminTopbarProps {
  user?: any;
  profile?: { full_name?: string | null; avatar_url?: string | null; bio?: string | null } | null;
}

const PAGE_NAMES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/kabinet": "Profil Kabinet",
  "/admin/artikel": "Moderasi Artikel",
  "/admin/berita": "Kelola Berita",
  "/admin/berita/new": "Tulis Berita",
  "/admin/kegiatan": "Kelola Kegiatan",
  "/admin/dokumentasi": "Kelola Dokumentasi",
  "/admin/saran-aduan": "Kotak Saran & Aspirasi",
  "/admin/system-settings": "Pengaturan Sistem",
};

export default function AdminTopbar({ user, profile }: AdminTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuBadgeTotal, setMobileMenuBadgeTotal] = useState(0);
  const [localProfileOverride, setLocalProfileOverride] = useState<{
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } | null>(null);

  useEffect(() => {
    const handleSummary = (e: Event) => {
      const total = (e as CustomEvent<{ total?: number }>).detail?.total;
      if (typeof total === "number") {
        setMobileMenuBadgeTotal(total);
      }
    };
    window.addEventListener("admin:badge-summary", handleSummary);
    return () => window.removeEventListener("admin:badge-summary", handleSummary);
  }, []);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari Admin Dashboard?")) {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  };

  const effectiveProfile = localProfileOverride || profile;
  const fullName =
    effectiveProfile?.full_name || user?.user_metadata?.full_name || "Admin BEM";
  const avatarUrl =
    effectiveProfile && "avatar_url" in effectiveProfile
      ? effectiveProfile.avatar_url
      : user?.user_metadata?.avatar_url;
  const bio = effectiveProfile?.bio ?? "";
  const mergedProfileForModal = user
    ? {
        ...user,
        role: "admin",
        full_name: fullName,
        avatar_url: avatarUrl ?? null,
        bio,
      }
    : null;
  const initial = (fullName.charAt(0) || "A").toUpperCase();

  // Find page title
  const currentTitle =
    PAGE_NAMES[pathname || ""] ||
    (pathname?.includes("/berita/") ? "Detail Berita" : "Portal Admin");

  return (
    <>
      <header className="w-full print:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
        {/* Left Side: Mobile Menu Button + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("admin:toggle-mobile-sidebar"));
            }}
            className="relative md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Buka Menu"
          >
            <FiMenu size={20} />
            {mobileMenuBadgeTotal > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Breadcrumb Display */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Admin</span>
            <FiChevronRight size={14} className="text-slate-300 dark:text-slate-600 hidden sm:inline" />
            <h2 className="font-bold text-slate-900 dark:text-white truncate">
              {currentTitle}
            </h2>
          </div>
        </div>

        {/* Right Side: Quick Tools, Notifications & User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Public Web Link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Lihat Website Publik"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/70 dark:border-slate-700/70"
          >
            <FiHome size={17} />
          </Link>

          {/* Notification Bell */}
          <AdminNotificationBell />

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* User Profile Pill */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group text-left"
            title="Ubah Profil Admin"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 group-hover:border-primary/50 transition-colors shadow-2xs bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              <UserAvatar
                src={avatarUrl}
                alt={fullName}
                size={36}
                fallback={initial}
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-primary transition-colors">
                {fullName}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Administrator
              </p>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Keluar (Logout)"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all border border-red-200/60 dark:border-red-900/40"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* Modal Pengaturan Profil Admin */}
      <ProfileSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={mergedProfileForModal}
        onProfileUpdated={(updated) => {
          setLocalProfileOverride({
            full_name: updated.full_name,
            avatar_url: updated.avatar_url,
            bio: updated.bio,
          });
          router.refresh();
        }}
      />
    </>
  );
}
