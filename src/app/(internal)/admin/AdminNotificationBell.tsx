"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { FiBell, FiMessageSquare, FiCheck, FiBookOpen, FiUsers } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPendingArticlesForBell } from "@/app/(internal)/admin/artikel/actions";
import { fetchRecentVolunteerApplicationsForBell } from "@/app/(internal)/admin/kegiatan/actions";

interface Notification {
  id: string;
  type: "saran" | "artikel" | "volunteer";
  title: string;
  author: string;
  created_at: string;
  href?: string;
  saranCategory?: string;
  saranText?: string;
  agendaType?: string;
  agendaTitle?: string;
  itemName?: string | null;
  isRevision?: boolean;
}

type BellLocale = "id" | "en" | "ar" | "fr" | "ja";

const BELL_I18N: Record<BellLocale, {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
  saranLabel: string;
  artikelLabel: string;
  volunteerLabel: string;
  aduanPrefix: string;
  saranPrefix: string;
  oprecPrefix: string;
  eventPrefix: string;
  anonAuthor: string;
  studentAuthor: string;
  bellTitle: string;
  headerTitle: string;
  markAllRead: string;
  emptyText: string;
  byLabel: string;
}> = {
  id: {
    justNow: "Baru saja",
    minutesAgo: (n) => `${n} menit lalu`,
    hoursAgo: (n) => `${n} jam lalu`,
    daysAgo: (n) => `${n} hari lalu`,
    saranLabel: "Kotak Saran",
    artikelLabel: "Artikel Baru",
    volunteerLabel: "Pendaftar",
    aduanPrefix: "Aduan",
    saranPrefix: "Saran",
    oprecPrefix: "Pendaftar Oprec",
    eventPrefix: "Pendaftar Event",
    anonAuthor: "Anonim",
    studentAuthor: "Mahasiswa",
    bellTitle: "Notifikasi Pengajuan & Kotak Saran",
    headerTitle: "Notifikasi Masuk",
    markAllRead: "Tandai terbaca",
    emptyText: "Semua notifikasi sudah dibaca!",
    byLabel: "oleh",
  },
  en: {
    justNow: "Just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    saranLabel: "Feedback Box",
    artikelLabel: "New Article",
    volunteerLabel: "Registrant",
    aduanPrefix: "Complaint",
    saranPrefix: "Feedback",
    oprecPrefix: "Oprec Registrant",
    eventPrefix: "Event Registrant",
    anonAuthor: "Anonymous",
    studentAuthor: "Student",
    bellTitle: "Submission & Feedback Notifications",
    headerTitle: "Incoming Notifications",
    markAllRead: "Mark all read",
    emptyText: "All notifications have been read!",
    byLabel: "by",
  },
  ar: {
    justNow: "الآن",
    minutesAgo: (n) => `منذ ${n} دقيقة`,
    hoursAgo: (n) => `منذ ${n} ساعة`,
    daysAgo: (n) => `منذ ${n} يوم`,
    saranLabel: "صندوق الملاحظات",
    artikelLabel: "مقال جديد",
    volunteerLabel: "مسجل",
    aduanPrefix: "شكوى",
    saranPrefix: "ملاحظة",
    oprecPrefix: "متقدم تطوع",
    eventPrefix: "مسجل فعالية",
    anonAuthor: "مجهول",
    studentAuthor: "طالب",
    bellTitle: "إشعارات التقديم والملاحظات",
    headerTitle: "الإشعارات الواردة",
    markAllRead: "تحديد كمقروء",
    emptyText: "تمت قراءة جميع الإشعارات!",
    byLabel: "بواسطة",
  },
  fr: {
    justNow: "À l'instant",
    minutesAgo: (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo: (n) => `il y a ${n} j`,
    saranLabel: "Boîte à suggestions",
    artikelLabel: "Nouvel article",
    volunteerLabel: "Inscrit",
    aduanPrefix: "Plainte",
    saranPrefix: "Suggestion",
    oprecPrefix: "Candidat Oprec",
    eventPrefix: "Inscrit événement",
    anonAuthor: "Anonyme",
    studentAuthor: "Étudiant",
    bellTitle: "Notifications d'inscriptions et suggestions",
    headerTitle: "Notifications reçues",
    markAllRead: "Tout marquer lu",
    emptyText: "Toutes les notifications ont été lues !",
    byLabel: "par",
  },
  ja: {
    justNow: "たった今",
    minutesAgo: (n) => `${n}分前`,
    hoursAgo: (n) => `${n}時間前`,
    daysAgo: (n) => `${n}日前`,
    saranLabel: "意見箱",
    artikelLabel: "新着記事",
    volunteerLabel: "応募者",
    aduanPrefix: "苦情",
    saranPrefix: "意見",
    oprecPrefix: "スタッフ応募",
    eventPrefix: "イベント申込",
    anonAuthor: "匿名",
    studentAuthor: "学生",
    bellTitle: "応募・意見箱の通知",
    headerTitle: "新着通知",
    markAllRead: "すべて既読にする",
    emptyText: "すべての通知を確認しました！",
    byLabel: "投稿者:",
  },
};

function resolveBellLocale(locale?: string): BellLocale {
  const base = (locale || "id").toLowerCase().split("-")[0];
  if (base === "en" || base === "ar" || base === "fr" || base === "ja" || base === "id") {
    return base;
  }
  return "id";
}

function timeAgo(dateStr: string, copy: (typeof BELL_I18N)[BellLocale]): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return copy.justNow;
  if (mins < 60) return copy.minutesAgo(mins);
  if (hours < 24) return copy.hoursAgo(hours);
  return copy.daysAgo(days);
}

const TYPE_CONFIG: Record<string, any> = {
  saran: {
    icon: FiMessageSquare,
    bg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-500",
    badge: "bg-purple-500",
    border: "border-purple-100",
    dot: "bg-purple-400",
  },
  artikel: {
    icon: FiBookOpen,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-500",
    badge: "bg-blue-500",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  volunteer: {
    icon: FiUsers,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-500",
    badge: "bg-emerald-500",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
  },
};

export default function AdminNotificationBell({ isScrolled, isHome, locale }: { isScrolled?: boolean; isHome?: boolean; locale?: string }) {
  const copy = BELL_I18N[resolveBellLocale(locale)];
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const lastViewedSaran = typeof window !== "undefined"
        ? (localStorage.getItem("admin_saran_last_viewed") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const lastViewedArticles = typeof window !== "undefined"
        ? (localStorage.getItem("admin_articles_last_viewed") || "")
        : "";

      const lastViewedVolunteer = typeof window !== "undefined"
        ? (localStorage.getItem("admin_volunteer_last_viewed") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [saranRes, artikelNotifs, volunteerNotifs] = await Promise.all([
        supabase
          .from("saran_aduan")
          .select("id, nama, kategori, pesan, subjek, created_at")
          .gt("created_at", lastViewedSaran)
          .order("created_at", { ascending: false })
          .limit(20),
        fetchPendingArticlesForBell(),
        fetchRecentVolunteerApplicationsForBell(lastViewedVolunteer),
      ]);

      const filteredArticles = lastViewedArticles
        ? (artikelNotifs || []).filter((a) => new Date(a.created_at) > new Date(lastViewedArticles))
        : (artikelNotifs || []);

      const mappedSaran: Notification[] = (saranRes.data || []).map((s: any) => ({
        id: s.id,
        type: "saran",
        title: `${s.kategori === 'aduan' ? 'Aduan' : 'Saran'}: ${s.pesan || s.subjek || ''}`,
        author: s.nama || "",
        created_at: s.created_at,
        href: "/admin/saran-aduan",
        saranCategory: s.kategori,
        saranText: s.pesan || s.subjek || '',
      }));

      const combined = [...mappedSaran, ...filteredArticles, ...(volunteerNotifs || [])].sort(
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
    } catch (err) {
      console.warn("[AdminNotificationBell] Error fetching notifications:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    const channelSaran = supabase
      .channel(`notif_bell_saran_${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "saran_aduan" }, () => {
        fetchNotifications();
      })
      .subscribe();

    const channelArticles = supabase
      .channel(`notif_bell_articles_${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => {
        fetchNotifications();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "article_revisions" }, () => {
        fetchNotifications();
      })
      .subscribe();

    const channelVolunteer = supabase
      .channel(`notif_bell_volunteer_${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_applications" }, () => {
        fetchNotifications();
      })
      .subscribe();

    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener("saran_read", handleRefresh);
    window.addEventListener("articles_moderation_updated", handleRefresh);
    window.addEventListener("volunteer_status_updated", handleRefresh);

    return () => {
      supabase.removeChannel(channelSaran);
      supabase.removeChannel(channelArticles);
      supabase.removeChannel(channelVolunteer);
      window.removeEventListener("saran_read", handleRefresh);
      window.removeEventListener("articles_moderation_updated", handleRefresh);
      window.removeEventListener("volunteer_status_updated", handleRefresh);
    };
  }, [supabase, fetchNotifications]);

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

  const handleMarkAllRead = () => {
    const nowIso = new Date().toISOString();
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_saran_last_viewed", nowIso);
      localStorage.setItem("admin_articles_last_viewed", nowIso);
      localStorage.setItem("admin_volunteer_last_viewed", nowIso);
      window.dispatchEvent(new Event("saran_read"));
    }
    setNotifications([]);
    setSeen(true);
    prevCountRef.current = 0;
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
        title={copy.bellTitle}
        className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
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
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none px-1 shadow-md ring-2 ring-white pointer-events-none z-10">
            {count > 99 ? "99+" : count}
          </span>
        )}

        {/* Pulse for unread */}
        {unread && (
          <span className="absolute -top-1 -right-1 w-[17px] h-[17px] rounded-full bg-red-400 opacity-40 animate-ping pointer-events-none" />
        )}
      </button>

      {/* Backdrop overlay on mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[55] sm:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3.5 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px] max-w-full sm:max-w-[calc(100vw-24px)] bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl z-[60] overflow-hidden"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-outline-variant/20 bg-surface-variant/20">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <FiBell size={15} className="text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-on-surface truncate">{copy.headerTitle}</span>
                {count > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500 text-white shrink-0 animate-pulse">
                    {count}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={count === 0}
                className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all shrink-0 whitespace-nowrap ${
                  count === 0
                    ? "text-on-surface-variant/40 cursor-not-allowed"
                    : "text-primary hover:text-primary/80 cursor-pointer hover:underline"
                }`}
              >
                <FiCheck size={13} />
                <span>{copy.markAllRead}</span>
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/10">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-variant/30 flex items-center justify-center">
                    <FiCheck size={22} className="text-green-500" />
                  </div>
                  <p className="text-sm font-medium">{copy.emptyText}</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  const typeLabel =
                    notif.type === "saran"
                      ? copy.saranLabel
                      : notif.type === "artikel"
                        ? copy.artikelLabel
                        : copy.volunteerLabel;
                  const displayTitle =
                    notif.type === "saran"
                      ? `${notif.saranCategory === "aduan" ? copy.aduanPrefix : copy.saranPrefix}: ${notif.saranText || ""}`
                      : notif.type === "volunteer" && notif.agendaTitle
                        ? `${notif.agendaType === "volunteer" ? copy.oprecPrefix : copy.eventPrefix}: ${notif.agendaTitle}${notif.itemName ? ` (${notif.itemName})` : ""}`
                        : notif.title;
                  const displayAuthor =
                    notif.author ||
                    (notif.type === "saran" ? copy.anonAuthor : copy.studentAuthor);

                  return (
                    <Link
                      key={notif.id}
                      href={notif.href || "/admin/saran-aduan"}
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
                            {displayTitle}
                          </p>
                          <span
                            className={`shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white ${cfg.badge} uppercase tracking-wide`}
                          >
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {copy.byLabel}{" "}
                          <span className="font-semibold text-on-surface">{displayAuthor}</span>
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70 mt-1">
                          {timeAgo(notif.created_at, copy)}
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
      <style href="admin-notification-bell-style" precedence="default">{`
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
