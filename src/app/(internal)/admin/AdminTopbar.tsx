"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiHome, FiLogOut, FiMenu, FiChevronRight } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import AdminNotificationBell from "./AdminNotificationBell";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";

interface AdminTopbarProps {
  user?: any;
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

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [imgError, setImgError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari Admin Dashboard?")) {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  };

  const fullName = user?.user_metadata?.full_name || "Admin BEM";
  const avatarUrl = user?.user_metadata?.avatar_url;
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
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Buka Menu"
          >
            <FiMenu size={20} />
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
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 group-hover:border-primary/50 transition-colors shadow-2xs"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shadow-primary/20">
                {initial}
              </div>
            )}
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
        userProfile={user}
        onProfileUpdated={() => {
          router.refresh();
        }}
      />
    </>
  );
}
