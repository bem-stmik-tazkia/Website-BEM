"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { FiBell, FiCheck, FiX, FiEdit2, FiTrash2, FiClock, FiUpload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface UserNotification {
  id: string;
  type: "approved" | "rejected" | "edit_approved" | "edit_rejected" | "deletion_rejected" | "pending";
  title: string;
  reason?: string;
  created_at: string;
  read?: boolean;
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
  approved: {
    label: "Karya Disetujui",
    icon: FiCheck,
    bg: "bg-green-50",
    iconBg: "bg-green-500",
    iconColor: "text-white",
    textColor: "text-green-700",
    dot: "bg-green-400",
    border: "border-green-100",
  },
  rejected: {
    label: "Karya Ditolak",
    icon: FiX,
    bg: "bg-red-50",
    iconBg: "bg-red-500",
    iconColor: "text-white",
    textColor: "text-red-700",
    dot: "bg-red-400",
    border: "border-red-100",
  },
  edit_approved: {
    label: "Edit Disetujui",
    icon: FiEdit2,
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    textColor: "text-blue-700",
    dot: "bg-blue-400",
    border: "border-blue-100",
  },
  edit_rejected: {
    label: "Edit Ditolak",
    icon: FiEdit2,
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    textColor: "text-amber-700",
    dot: "bg-amber-400",
    border: "border-amber-100",
  },
  deletion_rejected: {
    label: "Hapus Ditolak",
    icon: FiTrash2,
    bg: "bg-orange-50",
    iconBg: "bg-orange-500",
    iconColor: "text-white",
    textColor: "text-orange-700",
    dot: "bg-orange-400",
    border: "border-orange-100",
  },
  pending: {
    label: "Menunggu Review",
    icon: FiClock,
    bg: "bg-surface-variant/20",
    iconBg: "bg-on-surface-variant/20",
    iconColor: "text-on-surface-variant",
    textColor: "text-on-surface-variant",
    dot: "bg-on-surface-variant/40",
    border: "border-outline-variant/20",
  },
};

// We store seen IDs in localStorage so we know what's "new"
const STORAGE_KEY = "user_notif_seen_ids";
const CLEARED_KEY = "user_notif_cleared_ids";

function getClearedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveClearedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLEARED_KEY, JSON.stringify([...ids]));
  } catch {}
}

function getSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export default function UserNotificationBell({ isScrolled, isHome }: { isScrolled?: boolean; isHome?: boolean }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  // Fetch user ID once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
    setSeenIds(getSeenIds());
    setClearedIds(getClearedIds());
  }, []);

  const fetchNotifications = async (uid: string) => {
    const { data, error } = await supabase
      .from("karya")
      .select("id, title, status, reject_reason, edit_reject_reason, deletion_reject_reason, pending_edits, created_at")
      .eq("user_id", uid)
      .not("status", "eq", "deleted")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) {
      setNotifications([]);
      return;
    }

    const mapped: UserNotification[] = [];

    data.forEach((k) => {
      // Edit rejected — show notification
      if (k.edit_reject_reason) {
        mapped.push({
          id: `edit_rejected_${k.id}`,
          type: "edit_rejected",
          title: k.title,
          reason: k.edit_reject_reason,
          created_at: k.created_at,
        });
        return;
      }

      // Deletion rejected — show notification
      if (k.deletion_reject_reason) {
        mapped.push({
          id: `deletion_rejected_${k.id}`,
          type: "deletion_rejected",
          title: k.title,
          reason: k.deletion_reject_reason,
          created_at: k.created_at,
        });
        return;
      }

      // Has pending edits (waiting)
      if (k.pending_edits) {
        mapped.push({
          id: `edit_pending_${k.id}`,
          type: "pending",
          title: k.title,
          created_at: k.created_at,
        });
        return;
      }

      // Status-based
      if (k.status === "pending") {
        mapped.push({
          id: `pending_${k.id}`,
          type: "pending",
          title: k.title,
          created_at: k.created_at,
        });
      } else if (k.status === "approved") {
        // Only show if recently approved (within 14 days) to avoid clutter
        const diffDays = (Date.now() - new Date(k.created_at).getTime()) / 86400000;
        if (diffDays <= 14) {
          mapped.push({
            id: `approved_${k.id}`,
            type: "approved",
            title: k.title,
            created_at: k.created_at,
          });
        }
      } else if (k.status === "rejected") {
        mapped.push({
          id: `rejected_${k.id}`,
          type: "rejected",
          title: k.title,
          reason: k.reject_reason,
          created_at: k.created_at,
        });
      }
    });

    // Sort by created_at desc
    mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const currentCleared = getClearedIds();
    const visibleMapped = mapped.filter(n => !currentCleared.has(n.id));

    setNotifications(visibleMapped);

    // Check if new unread appeared
    const currentSeen = getSeenIds();
    const unreadCount = visibleMapped.filter((n) => !currentSeen.has(n.id)).length;
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current !== -1) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
    }
    prevUnreadRef.current = unreadCount;
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId);

    const channel = supabase
      .channel(`user_notif_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "karya", filter: `user_id=eq.${userId}` }, () => {
        fetchNotifications(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClearAll = () => {
    const newCleared = new Set([...clearedIds, ...notifications.map((n) => n.id)]);
    setClearedIds(newCleared);
    saveClearedIds(newCleared);
    setNotifications([]);
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      // Mark all as seen
      const newSeen = new Set([...seenIds, ...notifications.map((n) => n.id)]);
      setSeenIds(newSeen);
      saveSeenIds(newSeen);
    }
  };

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (!hasUnread) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 800);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasUnread]);

  if (!userId) return null;

  // Always-visible pill: white/blur on hero, surface-bordered on scrolled
  const btnBase = isScrolled || !isHome
    ? "bg-surface border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary shadow-sm"
    : "bg-white/15 backdrop-blur-md border border-white/30 text-white hover:bg-white/25";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        title="Notifikasi Karya"
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

        {/* Unread badge */}
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none px-1 shadow-md ring-2 ring-white pointer-events-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Pulse for new */}
        {hasUnread && !open && (
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
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-variant/20">
              <div className="flex items-center gap-2">
                <FiBell size={15} className="text-primary" />
                <span className="text-sm font-bold text-on-surface">Notifikasi Karya</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleClearAll(); }}
                    className="text-xs font-semibold text-on-surface-variant hover:text-red-500 transition-colors"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-outline-variant/10">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-variant/30 flex items-center justify-center">
                    <FiUpload size={20} className="text-on-surface-variant/60" />
                  </div>
                  <p className="text-sm font-medium">Belum ada notifikasi karya.</p>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Upload karya pertamamu →
                  </Link>
                </div>
              ) : (
                notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  const isNew = !seenIds.has(notif.id);
                  return (
                    <Link
                      key={notif.id}
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-surface-variant/20 transition-colors group ${isNew ? cfg.bg : ""}`}
                    >
                      {/* Icon */}
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.iconBg} mt-0.5`}>
                        <Icon size={14} className={cfg.iconColor} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide ${cfg.textColor}`}>
                            {cfg.label}
                          </span>
                          {isNew && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wide">
                              Baru
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-on-surface line-clamp-1 mt-0.5 group-hover:text-primary transition-colors">
                          {notif.title}
                        </p>
                        {notif.reason && (
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 italic">
                            &ldquo;{notif.reason}&rdquo;
                          </p>
                        )}
                        <p className="text-[11px] text-on-surface-variant/70 mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* New dot */}
                      {isNew && <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${cfg.dot}`} />}
                    </Link>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-outline-variant/20 bg-surface-variant/10">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors"
                >
                  Lihat Dashboard Karya
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
