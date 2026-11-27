"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FiHome,
  FiFileText,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiAward,
  FiImage,
  FiMessageSquare,
  FiTool,
  FiBookOpen,
  FiExternalLink,
  FiX,
  FiShield,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { fetchAdminSidebarBadges } from "./badge-actions";

const mainNavItems = [
  { name: "Dashboard", href: "/admin", icon: FiHome, badge: null },
  { name: "Profil Kabinet", href: "/admin/kabinet", icon: FiAward, badge: null },
  { name: "Moderasi Artikel", href: "/admin/artikel", icon: FiBookOpen, badge: "moderation" },
  { name: "Kelola Berita", href: "/admin/berita", icon: FiFileText, badge: null },
  { name: "Kelola Kegiatan", href: "/admin/kegiatan", icon: FiCalendar, badge: "kegiatan" },
  { name: "Kelola Dokumentasi", href: "/admin/dokumentasi", icon: FiImage, badge: null },
  { name: "E-Sertifikat", href: "/admin/sertifikat", icon: FiShield, badge: null },
  { name: "Kotak Saran", href: "/admin/saran-aduan", icon: FiMessageSquare, badge: "saran" },
];

const settingsItems = [
  { name: "Pengaturan Sistem", href: "/admin/system-settings", icon: FiTool, badge: null },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  const [unreadSaranCount, setUnreadSaranCount] = useState(0);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);
  const [pendingRegCount, setPendingRegCount] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  // Reset navigating state when pathname changes
  useEffect(() => {
    setNavigatingHref(null);
    setIsMobileOpen(false);
  }, [pathname]);

  // Listen to mobile toggle events from Topbar
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener("admin:toggle-mobile-sidebar", handleToggle);
    window.addEventListener("admin:close-mobile-sidebar", handleClose);
    return () => {
      window.removeEventListener("admin:toggle-mobile-sidebar", handleToggle);
      window.removeEventListener("admin:close-mobile-sidebar", handleClose);
    };
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const lastViewedSaran =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_saran_last_viewed") ||
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const summary = await fetchAdminSidebarBadges(lastViewedSaran);
      setPendingModerationCount(summary.pendingModeration);
      setPendingRegCount(summary.pendingRegistrations);
      setUnreadSaranCount(summary.unreadSaran);

      const totalPending =
        summary.pendingModeration + summary.pendingRegistrations + summary.unreadSaran;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:badge-summary", { detail: { total: totalPending } })
        );
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  useEffect(() => {
    refreshBadges();

    const channelAdminBadges = supabase
      .channel(`admin_sidebar_badges_${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "saran_aduan" }, () => {
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => {
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "article_revisions" }, () => {
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_applications" }, () => {
        refreshBadges();
      })
      .subscribe();

    window.addEventListener("saran_read", refreshBadges);
    window.addEventListener("articles_moderation_updated", refreshBadges);
    window.addEventListener("volunteer_status_updated", refreshBadges);

    return () => {
      supabase.removeChannel(channelAdminBadges);
      window.removeEventListener("saran_read", refreshBadges);
      window.removeEventListener("articles_moderation_updated", refreshBadges);
      window.removeEventListener("volunteer_status_updated", refreshBadges);
    };
  }, [supabase, refreshBadges]);

  const renderNavItem = (item: (typeof mainNavItems)[0]) => {
    let isActive =
      pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));

    if (item.href === "/admin/kegiatan" && fromParam === "dokumentasi") {
      isActive = false;
    }
    if (item.href === "/admin/dokumentasi" && fromParam === "dokumentasi") {
      isActive = true;
    }

    const isPending = navigatingHref === item.href;
    const Icon = item.icon;

    const count =
      item.badge === "saran"
        ? unreadSaranCount
        : item.badge === "moderation"
        ? pendingModerationCount
        : item.badge === "kegiatan"
        ? pendingRegCount
        : 0;

    return (
      <Link
        key={item.name}
        href={item.href}
        prefetch={true}
        onClick={() => {
          if (!isActive) setNavigatingHref(item.href);
          setIsMobileOpen(false);
        }}
        title={isCollapsed ? item.name : undefined}
        className={`group relative flex items-center rounded-xl font-medium text-sm transition-all duration-200 select-none ${
          isCollapsed ? "justify-center py-3 px-0 mx-2" : "gap-3 px-3.5 py-2.5 mx-3"
        } ${
          isActive
            ? "bg-primary text-white font-semibold shadow-md shadow-primary/25"
            : isPending
            ? "bg-primary/10 text-primary animate-pulse"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
        }`}
      >
        {/* Active Pill Indicator for Left Border */}
        {isActive && !isCollapsed && (
          <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-white/70" />
        )}

        <Icon
          size={19}
          className={`shrink-0 transition-transform duration-200 ${
            isActive
              ? "text-white"
              : "text-slate-500 group-hover:text-primary group-hover:scale-110"
          }`}
        />

        {!isCollapsed && (
          <span className="truncate flex-1 flex items-center justify-between gap-2">
            <span className={isActive ? "text-white font-semibold truncate" : "truncate"}>
              {item.name}
            </span>

            {/* Notification Badge */}
            {count > 0 && (
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs ${
                  isActive
                    ? "bg-white text-red-600"
                    : "bg-red-500 text-white animate-pulse"
                }`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
        )}

        {/* Collapsed Badge Dot */}
        {isCollapsed && count > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-surface" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden print:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col print:hidden bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 shadow-xl md:shadow-none transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-68"}`}
      >
        {/* Toggle Collapse Button for Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-7 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full items-center justify-center text-slate-500 hover:text-primary hover:scale-105 transition-all cursor-pointer z-60"
          aria-label={isCollapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
        >
          {isCollapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={15} />}
        </button>

        {/* Header Logo */}
        <div
          className={`pt-5 pb-4 px-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
              <img src="/images/logo2.webp" alt="Logo BEM" className="w-8 h-8 object-contain p-0.5" />
            </div>

            {!isCollapsed && (
              <div className="leading-tight overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate">
                    Admin BEM
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  STMIK Tazkia
                </p>
              </div>
            )}
          </div>

          {/* Close Button on Mobile Drawer */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin">
          {/* Main Menu Section */}
          <div>
            {!isCollapsed ? (
              <p className="px-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Menu Utama
              </p>
            ) : (
              <div className="h-2" />
            )}
            <div className="space-y-1">{mainNavItems.map(renderNavItem)}</div>
          </div>

          {/* Settings Section */}
          <div>
            {!isCollapsed ? (
              <p className="px-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Pengaturan
              </p>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-4" />
            )}
            <div className="space-y-1">{settingsItems.map(renderNavItem)}</div>
          </div>
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Kunjungi Website Publik BEM"
            className={`flex items-center rounded-xl p-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors ${
              isCollapsed ? "justify-center" : "gap-2.5"
            }`}
          >
            <FiExternalLink size={16} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Lihat Website BEM</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
