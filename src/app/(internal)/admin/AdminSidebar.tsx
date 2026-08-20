"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiHome, FiFileText, FiBriefcase, FiCalendar, FiChevronLeft, FiChevronRight, FiUsers, FiAward, FiImage, FiMessageSquare, FiSettings, FiTool } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

const mainNavItems = [
  { name: "Dashboard", href: "/admin", icon: FiHome },
  { name: "Kelola Mahasiswa", href: "/admin/mahasiswa", icon: FiUsers },
  { name: "Profil Kabinet", href: "/admin/kabinet", icon: FiAward },
  { name: "Kelola Berita", href: "/admin/berita", icon: FiFileText },
  { name: "Kelola Karya", href: "/admin/karya", icon: FiBriefcase },
  { name: "Kelola Kegiatan", href: "/admin/kegiatan", icon: FiCalendar },
  { name: "Kelola Dokumentasi", href: "/admin/dokumentasi", icon: FiImage },
  { name: "Kotak Saran", href: "/admin/saran-aduan", icon: FiMessageSquare },
];

const settingsItems = [
  { name: "Master Data", href: "/admin/master-data", icon: FiSettings },
  { name: "Pengaturan Sistem", href: "/admin/system-settings", icon: FiTool },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingKaryaCount, setPendingKaryaCount] = useState(0);
  const [unreadSaranCount, setUnreadSaranCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('karya')
          .select('*', { count: 'exact', head: true })
          .or('status.in.(pending,deletion_pending),and(pending_edits.not.is.null,edit_reject_reason.is.null)');

        if (!error && count !== null) {
          setPendingKaryaCount(count);
        }
      } catch (err) {
        // Ignore network errors
      }
    };

    const fetchUnreadSaran = async () => {
      try {
        const lastViewedSaran = typeof window !== "undefined"
          ? (localStorage.getItem("admin_saran_last_viewed") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
          .from('saran_aduan')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', lastViewedSaran);

        if (!error && count !== null) {
          setUnreadSaranCount(count);
        }
      } catch (err) {
        // Ignore network errors
      }
    };

    fetchPendingCount();
    fetchUnreadSaran();

    const channelKarya = supabase.channel(`karya_sb_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karya' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    const channelSaran = supabase.channel(`saran_sb_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saran_aduan' }, () => {
        fetchUnreadSaran();
      })
      .subscribe();

    const handleSaranRead = () => {
      fetchUnreadSaran();
    };
    window.addEventListener("saran_read", handleSaranRead);

    return () => {
      supabase.removeChannel(channelKarya);
      supabase.removeChannel(channelSaran);
      window.removeEventListener("saran_read", handleSaranRead);
    };
  }, [supabase]);

  return (
    <aside
      className={`transition-all duration-300 ease-in-out bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-r border-outline-variant/30 md:h-screen md:sticky top-0 flex flex-col shadow-sm w-full shrink-0 z-50 ${isCollapsed ? "md:w-24" : "md:w-72"
        }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute top-8 w-8 h-8 bg-surface border border-outline-variant/30 shadow-md rounded-full items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer"
        style={{ position: 'absolute', right: '-16px', zIndex: 60 }}
      >
        {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      {/* Header Logo */}
      <div className={`p-6 md:p-8 flex items-center mb-4 transition-all duration-300 shrink-0 ${isCollapsed ? "justify-center px-4" : "gap-4"}`}>
        <div className="w-12 h-12 bg-surface rounded-2xl shadow-sm border border-outline-variant/20 flex items-center justify-center shrink-0">
          <img src="/images/logo.webp" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-on-surface text-lg tracking-tight leading-tight">Admin BEM</h1>
            <p className="text-xs text-primary font-medium uppercase tracking-widest mt-0.5">Portal Inovasi</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col overflow-y-auto pb-6 ${isCollapsed ? "px-3" : "px-4 md:px-6"}`}>
        {!isCollapsed && (
          <p className="px-4 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-4 mt-2 whitespace-nowrap">Menu Utama</p>
        )}

        {/* Main Nav Items */}
        <div className="space-y-1.5">
          {mainNavItems.map((item) => {
            let isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));

            if (item.href === "/admin/kegiatan" && fromParam === "dokumentasi") {
              isActive = false;
            }
            if (item.href === "/admin/dokumentasi" && fromParam === "dokumentasi") {
              isActive = true;
            }

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center rounded-xl transition-all duration-300 font-semibold text-sm group relative overflow-hidden ${isCollapsed ? "justify-center py-3.5 px-0" : "gap-3 px-4 py-3.5"
                  } ${isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface hover:text-primary hover:shadow-sm"
                  }`}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                )}
                <Icon size={20} className={`shrink-0 ${isActive ? "text-white" : "text-on-surface-variant/70 group-hover:text-primary"}`} />
                {!isCollapsed && (
                  <span className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis flex-1 flex justify-between items-center">
                    {item.name}
                    {item.name === "Kelola Karya" && pendingKaryaCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        {pendingKaryaCount}
                      </span>
                    )}
                    {item.name === "Kotak Saran" && unreadSaranCount > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {unreadSaranCount}
                      </span>
                    )}
                  </span>
                )}
                {isCollapsed && item.name === "Kelola Karya" && pendingKaryaCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
                )}
                {isCollapsed && item.name === "Kotak Saran" && unreadSaranCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-purple-600 rounded-full border-2 border-[#f8fafc]"></span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider + Settings Items */}
        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-1.5">
          {!isCollapsed && (
            <p className="px-4 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-3 whitespace-nowrap">Pengaturan</p>
          )}
          {settingsItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center rounded-xl transition-all duration-300 font-semibold text-sm group relative overflow-hidden ${isCollapsed ? "justify-center py-3.5 px-0" : "gap-3 px-4 py-3.5"
                  } ${isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface hover:text-primary hover:shadow-sm"
                  }`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? "text-white" : "text-on-surface-variant/70 group-hover:text-primary"}`} />
                {!isCollapsed && (
                  <span className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

    </aside>
  );
}
