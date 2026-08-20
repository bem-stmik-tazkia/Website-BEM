"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { FiBell, FiUpload, FiEdit2, FiTrash2, FiMessageSquare, FiCheck, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "upload" | "edit" | "deletion" | "saran";
  title: string;
  author: string;
  created_at: string;
  href?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

const TYPE_CONFIG = {
  upload: {
    label: "Upload Karya Baru",
    icon: FiUpload,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-500",
    badge: "bg-blue-500",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  edit: {
    label: "Usulan Edit",
    icon: FiEdit2,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-500",
    badge: "bg-amber-500",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
  deletion: {
    label: "Permintaan Hapus",
    icon: FiTrash2,
    bg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-500",
    badge: "bg-red-500",
    border: "border-red-100",
    dot: "bg-red-400",
  },
  saran: {
    label: "Kotak Saran Baru",
    icon: FiMessageSquare,
    bg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-500",
    badge: "bg-purple-500",
    border: "border-purple-100",
    dot: "bg-purple-400",
  },
};

export default function AdminNotificationBell({ isScrolled, isHome }: { isScrolled?: boolean; isHome?: boolean }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchNotifications = async () => {
    // 1. Fetch Karya
    const { data: karyaData } = await supabase
      .from("karya")
      .select("id, title, status, pending_edits, edit_reject_reason, created_at, user_id")
      .or("status.in.(pending,deletion_pending),pending_edits.not.is.null")
      .order("created_at", { ascending: false })
      .limit(20);

    // 2. Fetch Unread Saran
    const lastViewedSaran = typeof window !== "undefined"
      ? (localStorage.getItem("admin_saran_last_viewed") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: saranData } = await supabase
      .from("saran_aduan")
      .select("id, nama, kategori, deskripsi, created_at")
      .gt("created_at", lastViewedSaran)
      .order("created_at", { ascending: false })
      .limit(20);

    const validKarya = karyaData ? karyaData.filter(
      (k) =>
        k.status === "pending" ||
        k.status === "deletion_pending" ||
        (k.pending_edits !== null && k.edit_reject_reason === null)
    ) : [];

    const userIds = [...new Set(validKarya.map((k) => k.user_id).filter(Boolean))];
    let profilesMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (profiles) profiles.forEach((p) => (profilesMap[p.id] = p.full_name));
    }

    const mappedKarya: Notification[] = validKarya.map((k) => ({
      id: k.id,
      type:
        k.pending_edits !== null && k.edit_reject_reason === null
          ? "edit"
          : k.status === "deletion_pending"
          ? "deletion"
          : "upload",
      title: k.title || "Tanpa Judul",
      author: profilesMap[k.user_id] || "Unknown User",
      created_at: k.created_at,
      href: "/admin/karya",
    }));

    const mappedSaran: Notification[] = (saranData || []).map((s) => ({
      id: s.id,
      type: "saran",
      title: `${s.kategori === 'aduan' ? 'Aduan' : 'Saran'}: ${s.deskripsi}`,
      author: s.nama || "Anonim",
      created_at: s.created_at,
      href: "/admin/saran-aduan",
    }));

    const combined = [...mappedKarya, ...mappedSaran].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const newCount = combined.length;
    if (newCount > prevCountRef.current && prevCountRef.current !== 0) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
      setSeen(false);
    }
    prevCountRef.current = newCount;
    setNotifications(combined);
  };

  useEffect(() => {
    fetchNotifications();

    const channelKarya = supabase
      .channel(`notif_bell_karya_${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "karya" }, () => {
        fetchNotifications();
      })
      .subscribe();

    const channelSaran = supabase
      .channel(`notif_bell_saran_${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "saran_aduan" }, () => {
        fetchNotifications();
      })
      .subscribe();

    const handleSaranRead = () => {
      fetchNotifications();
    };
    window.addEventListener("saran_read", handleSaranRead);

    return () => {
      supabase.removeChannel(channelKarya);
      supabase.removeChannel(channelSaran);
      window.removeEventListener("saran_read", handleSaranRead);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) setSeen(true);
  };

  const unread = !seen && notifications.length > 0;
  const count = notifications.length;

  useEffect(() => {
    if (!unread) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 800);
    }, 4000);
    return () => clearInterval(interval);
  }, [unread]);

  const btnBase = isScrolled || !isHome
    ? "bg-surface border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary shadow-sm"
    : "bg-white/15 backdrop-blur-md border border-white/30 text-white hover:bg-white/25";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        title="Notifikasi Pengajuan & Kotak Saran"
        className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all ${
          open
            ? (isScrolled || !isHome
                ? "bg-primary/10 border border-primary/40 text-primary shadow-sm"
                : "bg-white/25 border border-white/40 text-white backdrop-blur-md")
            : btnBase
        }`}
      >
        <span className={animating ? "animate-[wiggle_0.5s_ease-in-out]" : ""}>
          <FiBell size={17} />
        </span>

        {/* Badge */}
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none px-1 shadow-md ring-2 ring-white pointer-events-none">
            {count > 99 ? "99+" : count}
          </span>
        )}

        {/* Pulse for unread */}
        {unread && (
          <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-red-400 opacity-50 animate-ping pointer-events-none" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute -right-[80px] sm:right-0 top-14 sm:top-12 w-[320px] sm:w-[360px] bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl z-[60] overflow-hidden"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-variant/20">
              <div className="flex items-center gap-2">
                <FiBell size={16} className="text-primary" />
                <span className="text-sm font-bold text-on-surface">Notifikasi Masuk</span>
                {count > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {count}
                  </span>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/10">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-variant/30 flex items-center justify-center">
                    <FiCheck size={22} className="text-green-500" />
                  </div>
                  <p className="text-sm font-medium">Semua notifikasi sudah dibaca!</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <Link
                      key={notif.id}
                      href={notif.href || "/admin/karya"}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-surface-variant/20 transition-colors cursor-pointer group`}
                    >
                      {/* Icon */}
                      <div
                        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border} mt-0.5`}
                      >
                        <Icon size={16} className={cfg.iconColor} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                            {notif.title}
                          </p>
                          <span
                            className={`shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white ${cfg.badge} uppercase tracking-wide`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          oleh{" "}
                          <span className="font-semibold text-on-surface">{notif.author}</span>
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70 mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${cfg.dot}`} />
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wiggle keyframes via style tag */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-15deg); }
          30% { transform: rotate(12deg); }
          45% { transform: rotate(-10deg); }
          60% { transform: rotate(8deg); }
          75% { transform: rotate(-5deg); }
          90% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
