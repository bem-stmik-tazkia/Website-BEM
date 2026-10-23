"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiSend, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSettings, FiBell } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";

interface TelegramStatusData {
  config: {
    isConfigured: boolean;
    hasBotToken: boolean;
    hasChatId: boolean;
    chatIdMasked: string | null;
    notifEnabled: boolean;
    reminderEnabled: boolean;
    lastReminderSentAt: string | null;
  };
  newsFreshness: {
    latestBerita: {
      id: string;
      title: string;
      slug: string;
      created_at: string;
      category?: string;
    } | null;
    daysSinceLastPost: number;
    isOverdue: boolean;
  };
}

export default function TelegramBeritaWidget() {
  const { toast } = useToast();
  const [data, setData] = useState<TelegramStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingPing, setTestingPing] = useState(false);
  const [testingReminder, setTestingReminder] = useState(false);

  const fetchStatusData = async () => {
    try {
      const res = await fetch("/api/admin/berita/telegram");
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Passive check: If overdue (>= 7 days) and reminder not sent recently,
        // trigger background check without forcing
        if (json.newsFreshness?.isOverdue && json.config?.isConfigured && json.config?.reminderEnabled) {
          fetch("/api/admin/berita/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "check_reminder", force: false }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("Error fetching telegram status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/berita/telegram");
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            setData(json);
            setLoading(false);
          }
          if (json.newsFreshness?.isOverdue && json.config?.isConfigured && json.config?.reminderEnabled) {
            fetch("/api/admin/berita/telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "check_reminder", force: false }),
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Error loading telegram status:", e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchStatusData();
  };

  const handleTestPing = async () => {
    try {
      setTestingPing(true);
      const res = await fetch("/api/admin/berita/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_ping" }),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        toast("Pesan uji coba berhasil terkirim ke Telegram!", "success");
      } else {
        toast("Gagal: " + (result.error || "Terjadi kesalahan"), "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast("Error: " + msg, "error");
    } finally {
      setTestingPing(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      setTestingReminder(true);
      const res = await fetch("/api/admin/berita/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_reminder", force: true }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast(json.result.message || "Peringatan 1 minggu berhasil dikirim!", "success");
        await handleRefresh();
      } else {
        toast("Gagal: " + (json.error || "Terjadi kesalahan"), "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast("Error: " + msg, "error");
    } finally {
      setTestingReminder(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-variant/40" />
          <div className="space-y-1.5">
            <div className="w-36 h-4 bg-surface-variant/40 rounded" />
            <div className="w-56 h-3 bg-surface-variant/30 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const isConfigured = data?.config?.isConfigured;
  const days = data?.newsFreshness?.daysSinceLastPost ?? 0;
  const isOverdue = data?.newsFreshness?.isOverdue;
  const latest = data?.newsFreshness?.latestBerita;
  const lastReminder = data?.config?.lastReminderSentAt;

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 transition-all shadow-sm ${
        !isConfigured
          ? "bg-amber-500/5 border-amber-500/20"
          : isOverdue
          ? "bg-red-500/5 border-red-500/20"
          : "bg-surface border-outline-variant/30"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Status Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              !isConfigured
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isOverdue
                ? "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
            }`}
          >
            {isOverdue ? <FiAlertTriangle size={20} /> : <FiSend size={20} />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-on-surface">
                Bot Telegram Berita & Peringatan Mingguan
              </h3>

              {isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FiCheckCircle size={11} /> Terhubung ({data.config.chatIdMasked})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Belum Dikonfigurasi
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {!isConfigured ? (
                <span>
                  Token bot atau Chat ID Telegram belum diisi. Atur di{" "}
                  <Link
                    href="/admin/system-settings"
                    className="underline text-primary font-bold hover:text-primary/80"
                  >
                    Pengaturan Sistem
                  </Link>{" "}
                  agar notifikasi berita baru dan pengingat mingguan aktif.
                </span>
              ) : isOverdue ? (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  ⚠️ Peringatan: Sudah <strong>{days} hari</strong> belum ada berita baru diupload (lebih dari 1 minggu)! Bot otomatis mengirim pengingat ke Telegram.
                </span>
              ) : latest ? (
                <span>
                  Status Publikasi: Berita terakhir diunggah{" "}
                  <strong>{days === 0 ? "hari ini" : `${days} hari lalu`}</strong> (
                  <em>&ldquo;{latest.title}&rdquo;</em>). Sistem dalam kondisi aktif 🟢
                </span>
              ) : (
                <span>Belum ada berita yang dipublikasikan.</span>
              )}
            </p>

            {lastReminder && (
              <p className="text-[11px] text-on-surface-variant/70">
                Peringatan terakhir terkirim:{" "}
                {new Date(lastReminder).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 pt-2 lg:pt-0">
          {isConfigured && (
            <>
              <button
                type="button"
                onClick={handleTestReminder}
                disabled={testingReminder}
                title="Kirim pesan peringatan belum upload berita ke Telegram sekarang untuk tes"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                <FiBell size={13} className={testingReminder ? "animate-bounce" : ""} />
                {testingReminder ? "Mengirim Tes..." : "Tes Peringatan 1 Minggu"}
              </button>

              <button
                type="button"
                onClick={handleTestPing}
                disabled={testingPing}
                title="Kirim pesan uji coba ke bot Telegram"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 transition-colors disabled:opacity-50"
              >
                <FiSend size={13} />
                {testingPing ? "Menguji..." : "Tes Bot"}
              </button>
            </>
          )}

          <Link
            href="/admin/system-settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-surface-variant/40 hover:bg-surface-variant/70 text-on-surface transition-colors border border-outline-variant/30"
          >
            <FiSettings size={13} />
            Pengaturan Bot
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Muat ulang status"
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 rounded-xl transition-colors"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
