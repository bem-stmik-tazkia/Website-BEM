"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import {
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiCheck,
  FiArrowRight,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  clearAllStudentNotifs,
  computeStudentUnreadCounts,
  dismissStudentNotif,
  fetchStudentNotificationFeed,
  isStudentNotificationUnread,
  isStudentNotificationVisible,
  markAllStudentNotifsRead,
  markStudentNotifRead,
  readStudentNotifPrefs,
  STUDENT_NOTIF_UPDATED_EVENT,
  type StudentNotification,
  type StudentNotifPrefs,
  type StudentUnreadCounts,
} from "@/lib/student-notifications";

export type { StudentNotification, StudentUnreadCounts };

function timeAgo(dateStr: string, locale: string, t: any): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return t("timeJustNow");
  if (mins < 60) return t("timeMinutesAgo", { minutes: mins });
  if (hours < 24) return t("timeHoursAgo", { hours: hours });
  if (days < 7) return t("timeDaysAgo", { days });
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

function getActionMeta(action: string, t: any) {
  if (action === "reg_accepted") {
    return {
      title: t("regApproved"),
      icon: FiCheckCircle,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  }
  if (action === "reg_rejected") {
    return {
      title: t("regRejected"),
      icon: FiXCircle,
      iconColor: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      dot: "bg-rose-500",
    };
  }
  if (action === "status_published" || action === "revision_approved") {
    return {
      title: t("actionApproved"),
      icon: FiCheckCircle,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  }
  if (action === "status_rejected" || action === "revision_rejected") {
    return {
      title: t("actionRejected"),
      icon: FiXCircle,
      iconColor: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      dot: "bg-rose-500",
    };
  }
  if (action === "status_draft") {
    return {
      title: t("actionUnpublished"),
      icon: FiFileText,
      iconColor: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
    };
  }
  if (action === "created_pending" || action === "revision_created_pending") {
    return {
      title: t("actionPending"),
      icon: FiClock,
      iconColor: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
    };
  }
  return {
    title: t("actionDefault"),
    icon: FiFileText,
    iconColor: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    dot: "bg-primary",
  };
}

function getDisplayNote(action: string, rawNote: string | null, t: any): string | null {
  if (action === "reg_accepted") {
    return rawNote || t("regApprovedNote");
  }
  if (action === "reg_rejected") {
    return rawNote || t("regRejectedNote");
  }
  if (!rawNote) {
    if (action === "status_published" || action === "revision_approved") {
      return t("approvedDefaultNote");
    }
    if (action === "status_rejected" || action === "revision_rejected") {
      return t("rejectedDefaultNote");
    }
    if (action === "status_draft") {
      return t("unpublishedDefaultNote");
    }
    return null;
  }

  // Jika note adalah string status sistem default, ganti dengan narasi terjemahan ramah pengguna
  if (
    rawNote.startsWith("Perubahan status") ||
    rawNote.startsWith("Artikel dibuat") ||
    rawNote.startsWith("Revisi dibuat")
  ) {
    if (action === "status_published" || action === "revision_approved") {
      return t("approvedDefaultNote");
    }
    if (action === "status_rejected" || action === "revision_rejected") {
      return t("rejectedDefaultNote");
    }
    if (action === "status_draft") {
      return t("unpublishedDefaultNote");
    }
  }

  return rawNote;
}

export default function StudentNotificationBell({
  isScrolled,
  isHome,
  onUnreadChange,
}: {
  isScrolled?: boolean;
  isHome?: boolean;
  onUnreadChange?: (counts: StudentUnreadCounts) => void;
}) {
  const t = useTranslations("StudentArticleNotification");
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [prefs, setPrefs] = useState<StudentNotifPrefs>({
    lastViewed: "",
    readIds: [],
    dismissedIds: [],
    clearedAt: "",
  });
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const syncPrefsFromStorage = useCallback(() => {
    setPrefs(readStudentNotifPrefs());
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const list = await fetchStudentNotificationFeed(supabase, user.id);
      const nextPrefs = readStudentNotifPrefs();
      const counts = computeStudentUnreadCounts(list, nextPrefs);

      if (counts.total > prevCountRef.current && prevCountRef.current !== 0) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 1000);
      }
      prevCountRef.current = counts.total;
      setPrefs(nextPrefs);
      setNotifications(list);
    } catch (err) {
      console.error("[StudentNotificationBell] Error:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel(`student_notif_${user.id}_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "article_audit_log",
            filter: `author_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "volunteer_applications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    });

    const handleArticlesRefresh = () => fetchNotifications();
    const handlePrefsSync = () => syncPrefsFromStorage();

    window.addEventListener("student_articles_updated", handleArticlesRefresh);
    window.addEventListener(STUDENT_NOTIF_UPDATED_EVENT, handlePrefsSync);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("student_articles_updated", handleArticlesRefresh);
      window.removeEventListener(STUDENT_NOTIF_UPDATED_EVENT, handlePrefsSync);
    };
  }, [supabase, fetchNotifications, syncPrefsFromStorage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => isStudentNotificationVisible(n, prefs)),
    [notifications, prefs]
  );

  const unreadCounts = useMemo(
    () => computeStudentUnreadCounts(notifications, prefs),
    [notifications, prefs]
  );
  const unreadCount = unreadCounts.total;

  useEffect(() => {
    onUnreadChange?.(unreadCounts);
  }, [unreadCounts, onUnreadChange]);

  const handleMarkAllRead = () => {
    markAllStudentNotifsRead(notifications);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllStudentNotifs(notifications);
  };

  const handleDismissItem = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dismissStudentNotif(id);
  };

  // Animasi getar berkala jika ada notifikasi belum dibaca
  useEffect(() => {
    if (unreadCount === 0) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 800);
    }, 4500);
    return () => clearInterval(interval);
  }, [unreadCount]);

  const btnBase =
    isScrolled || !isHome
      ? "bg-surface border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary shadow-sm"
      : "bg-white/15 backdrop-blur-md border border-white/30 text-white hover:bg-white/25";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        type="button"
        title={t("title")}
        aria-label={t("title")}
        className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all cursor-pointer ${
          open
            ? isScrolled || !isHome
              ? "bg-primary/10 border border-primary/40 text-primary shadow-sm"
              : "bg-white/25 border border-white/40 text-white backdrop-blur-md"
            : btnBase
        }`}
      >
        <span className={animating ? "animate-[wiggle_0.5s_ease-in-out]" : ""}>
          <FiBell className="text-sm sm:text-base" />
        </span>

        {/* Badge Hitungan */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none px-1 shadow-md ring-2 ring-white dark:ring-surface pointer-events-none z-10">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse effect */}
        {unreadCount > 0 && (
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

      {/* Dropdown Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3.5 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px] max-w-full sm:max-w-[calc(100vw-24px)] bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl z-[60] overflow-hidden"
            style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-outline-variant/20 bg-surface-variant/20">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FiBell size={13} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface truncate">{t("title")}</span>
                {unreadCount > 0 ? (
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500 text-white shrink-0 animate-pulse">
                    {t("newBadge", { count: unreadCount })}
                  </span>
                ) : visibleNotifications.length > 0 ? (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    {t("readBadge")}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] sm:text-xs font-semibold flex items-center gap-1 text-primary hover:text-primary/80 cursor-pointer hover:underline transition-all whitespace-nowrap"
                    title={t("markAllReadTitle")}
                  >
                    <FiCheck size={12} />
                    <span>{t("markAsRead")}</span>
                  </button>
                )}
                {visibleNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] sm:text-xs font-semibold flex items-center gap-1 text-on-surface-variant/60 hover:text-rose-500 cursor-pointer transition-colors whitespace-nowrap"
                    title={t("clearAllTitle")}
                  >
                    <FiTrash2 size={12} />
                    <span>{t("clearAll")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* List Notifikasi */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-outline-variant/10">
              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-on-surface-variant">
                  <div className="w-12 h-12 rounded-2xl bg-surface-variant/40 flex items-center justify-center mb-2.5 text-primary">
                    <FiCheckCircle size={24} />
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{t("emptyTitle")}</p>
                  <p className="text-xs text-on-surface-variant/80 mt-0.5 max-w-[260px] leading-relaxed">
                    {t("emptyDesc")}
                  </p>
                </div>
              ) : (
                visibleNotifications.map((item) => {
                  const meta = getActionMeta(item.action, t);
                  const Icon = meta.icon;
                  const isItemUnread = isStudentNotificationUnread(item, prefs);
                  const noteToDisplay = getDisplayNote(item.action, item.note, t);

                  return (
                    <div key={item.id} className="relative group">
                      <Link
                        href={item.href || "/dashboard"}
                        onClick={() => {
                          markStudentNotifRead(item.id);
                          setOpen(false);
                        }}
                        className={`block p-3.5 pr-8 hover:bg-surface-variant/30 transition-colors ${
                          isItemUnread ? "bg-primary/[0.04]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`relative w-9 h-9 rounded-xl ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <Icon size={16} className={meta.iconColor} />
                            {isItemUnread && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-surface" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5 pr-4">
                              <span className="text-[11px] font-bold text-on-surface leading-tight truncate">
                                {meta.title}
                              </span>
                              <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                                {timeAgo(item.created_at, locale, t)}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                              {item.article_title}
                            </p>

                            {noteToDisplay && (
                              <p className="text-[11px] text-on-surface-variant/90 line-clamp-2 mt-1 bg-surface-variant/30 rounded-lg p-1.5 border border-outline-variant/20 italic">
                                "{noteToDisplay}"
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => handleDismissItem(e, item.id)}
                        className="absolute top-3 right-2.5 w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                        title={t("dismissTitle")}
                        aria-label={t("dismissTitle")}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-outline-variant/20 bg-surface-variant/10 text-center">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5 py-1"
              >
                <span>{t("openDashboard")}</span>
                <FiArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
