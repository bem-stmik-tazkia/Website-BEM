"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  FiTool, 
  FiX, 
  FiStar, 
  FiCheckCircle, 
  FiSave, 
  FiPlus, 
  FiAlertTriangle, 
  FiSend, 
  FiShield, 
  FiLock, 
  FiKey, 
  FiRefreshCw,
  FiLink,
  FiFileText
} from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { 
  getSecretStatus, 
  setSecret, 
  SecretStatusMap 
} from "./actions";
import { AppSecretKey } from "@/lib/secrets";

export default function SystemSettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Saved (server) values – used for dirty comparison
  const savedRef = useRef({
    mMode: false,
    mTime: "1-2 Jam",
    mMsg: "",
    rVersion: "v1.2.0",
    rTitle: "Pembaruan Sistem Portal BEM",
    rFeatures: [
      "Penyempurnaan dukungan multi-bahasa di berbagai area website",
      "Peningkatan kenyamanan tampilan dan kelancaran akses pengguna (User Experience)",
      "Perbaikan stabilitas sistem secara keseluruhan",
    ],
    rPublished: true,
    adminPhone: "",
    tNotifEnabled: true,
    tReminderEnabled: true,
  });

  const [mMode, setMMode] = useState(false);
  const [mTime, setMTime] = useState("1-2 Jam");
  const [mMsg, setMMsg] = useState("");
  const [rVersion, setRVersion] = useState("v1.3.0");
  const [rTitle, setRTitle] = useState("Peningkatan Stabilitas & Kenyamanan Sistem");
  const [rFeatures, setRFeatures] = useState<string[]>([
    "Penyempurnaan dukungan multi-bahasa di berbagai area website",
    "Peningkatan kenyamanan tampilan dan kelancaran akses pengguna (User Experience)",
    "Perbaikan stabilitas sistem secara keseluruhan",
  ]);
  const [rPublished, setRPublished] = useState(true);
  const [adminPhone, setAdminPhone] = useState("");
  const [tNotifEnabled, setTNotifEnabled] = useState(true);
  const [tReminderEnabled, setTReminderEnabled] = useState(true);
  const [testingPing, setTestingPing] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // ── State Pengaturan Rahasia (App Secrets) ──────────────────────────────
  const [secretStatuses, setSecretStatuses] = useState<SecretStatusMap | null>(null);
  const [loadingSecrets, setLoadingSecrets] = useState(true);
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Check dirty against saved ref using useEffect
  useEffect(() => {
    if (loading) return;
    const s = savedRef.current;
    const dirty =
      mMode !== s.mMode ||
      mTime !== s.mTime ||
      mMsg !== s.mMsg ||
      rVersion !== s.rVersion ||
      rTitle !== s.rTitle ||
      rPublished !== s.rPublished ||
      adminPhone !== s.adminPhone ||
      tNotifEnabled !== s.tNotifEnabled ||
      tReminderEnabled !== s.tReminderEnabled ||
      JSON.stringify(rFeatures) !== JSON.stringify(s.rFeatures);
    setIsDirty(dirty);
  }, [mMode, mTime, mMsg, rVersion, rTitle, rFeatures, rPublished, adminPhone, tNotifEnabled, tReminderEnabled, loading]);

  const loadSecretStatusData = async () => {
    setLoadingSecrets(true);
    try {
      const statuses = await getSecretStatus();
      setSecretStatuses(statuses);
    } catch (e: any) {
      console.error("Gagal memuat status rahasia:", e);
      toast("Gagal memuat status kredensial rahasia.", "error");
    } finally {
      setLoadingSecrets(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "maintenance_mode",
        "maintenance_estimated_time",
        "maintenance_message",
        "release_notes",
        "admin_whatsapp",
        "telegram_berita_notif_enabled",
        "telegram_berita_reminder_enabled",
      ]);

    if (error) {
      toast("Gagal memuat pengaturan sistem.", "error");
    } else if (data) {
      const mModeItem = data.find((d) => d.key === "maintenance_mode");
      const mTimeItem = data.find((d) => d.key === "maintenance_estimated_time");
      const mMsgItem = data.find((d) => d.key === "maintenance_message");
      const rNotesItem = data.find((d) => d.key === "release_notes");
      const adminPhoneItem = data.find((d) => d.key === "admin_whatsapp");
      const tNotifItem = data.find((d) => d.key === "telegram_berita_notif_enabled");
      const tReminderItem = data.find((d) => d.key === "telegram_berita_reminder_enabled");

      const newMMode = mModeItem?.value === "true";
      const newMTime = mTimeItem?.value || "1-2 Jam";
      const newMMsg = mMsgItem?.value || "";
      const newAdminPhone = adminPhoneItem?.value || "";
      const newTNotif = tNotifItem ? tNotifItem.value !== "false" : true;
      const newTReminder = tReminderItem ? tReminderItem.value !== "false" : true;
      
      let newRVersion = "v1.2.0";
      let newRTitle = "Pembaruan Sistem Portal BEM";
      let newRFeatures = savedRef.current.rFeatures;
      let newRPublished = true;

      if (rNotesItem?.value) {
        try {
          const parsed = JSON.parse(rNotesItem.value);
          if (parsed.version) newRVersion = parsed.version;
          if (parsed.title) newRTitle = parsed.title;
          if (Array.isArray(parsed.features)) newRFeatures = parsed.features;
          if (typeof parsed.published === "boolean") newRPublished = parsed.published;
        } catch (e) {
          console.error("Error parsing release notes setting:", e);
        }
      }

      savedRef.current = {
        mMode: newMMode,
        mTime: newMTime,
        mMsg: newMMsg,
        rVersion: newRVersion,
        rTitle: newRTitle,
        rFeatures: newRFeatures,
        rPublished: newRPublished,
        adminPhone: newAdminPhone,
        tNotifEnabled: newTNotif,
        tReminderEnabled: newTReminder,
      };

      setMMode(newMMode);
      setMTime(newMTime);
      setMMsg(newMMsg);
      setRVersion(newRVersion);
      setRTitle(newRTitle);
      setRFeatures(newRFeatures);
      setRPublished(newRPublished);
      setAdminPhone(newAdminPhone);
      setTNotifEnabled(newTNotif);
      setTReminderEnabled(newTReminder);
      
      setIsDirty(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    loadSecretStatusData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser tab/window close protection ──────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── In-app navigation protection (intercept <a> clicks) ─────────────────
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href]");
      if (!target) return;
      const href = (target as HTMLAnchorElement).href;
      if (!href || href === window.location.href) return;
      e.preventDefault();
      e.stopPropagation();
      const confirmed = window.confirm(
        "⚠️ Anda memiliki perubahan yang belum disimpan!\n\nPerubahan ini akan hilang jika Anda meninggalkan halaman ini. Lanjutkan?"
      );
      if (confirmed) {
        setIsDirty(false);
        try {
          router.push(new URL(href).pathname);
        } catch {
          window.location.href = href;
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty, router]);

  const handleSaveMaintenance = async () => {
    setSavingMaintenance(true);
    const releaseNotesObj = {
      version: rVersion.trim() || "v1.0.0",
      title: rTitle.trim() || "Pembaruan Sistem",
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      features: rFeatures.filter((f) => f.trim() !== ""),
      published: rPublished,
    };

    const updates = [
      { key: "maintenance_mode", value: mMode ? "true" : "false" },
      { key: "maintenance_estimated_time", value: mTime.trim() || "1-2 Jam" },
      { key: "maintenance_message", value: mMsg.trim() },
      { key: "release_notes", value: JSON.stringify(releaseNotesObj) },
      { key: "admin_whatsapp", value: adminPhone.trim() },
      { key: "telegram_berita_notif_enabled", value: tNotifEnabled ? "true" : "false" },
      { key: "telegram_berita_reminder_enabled", value: tReminderEnabled ? "true" : "false" },
    ];

    const { error } = await supabase
      .from("system_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      toast("Gagal menyimpan pengaturan sistem.", "error");
    } else {
      savedRef.current = { 
        mMode, mTime, mMsg, rVersion, rTitle, rFeatures, 
        rPublished, adminPhone, tNotifEnabled, tReminderEnabled
      };
      setIsDirty(false);
      toast("Pengaturan Sistem berhasil disimpan!", "success");
    }
    setSavingMaintenance(false);
  };

  const handleUpdateSecret = async (key: AppSecretKey) => {
    const rawVal = secretInputs[key] || "";
    if (!rawVal.trim()) {
      toast("Silakan masukkan nilai baru untuk mengganti kredensial.", "error");
      return;
    }

    setSavingKey(key);
    try {
      const res = await setSecret(key, rawVal);
      if (res.success) {
        toast("Kredensial rahasia berhasil diperbarui!", "success");
        setSecretInputs((prev) => ({ ...prev, [key]: "" }));
        await loadSecretStatusData();
      } else {
        toast(res.error || "Gagal memperbarui rahasia.", "error");
      }
    } catch (e: any) {
      toast(e.message || "Terjadi kesalahan.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestTelegram = async () => {
    try {
      setTestingPing(true);
      const res = await fetch("/api/admin/berita/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_ping" }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast("Pesan tes berhasil dikirim ke Telegram!", "success");
      } else {
        toast("Gagal tes Telegram: " + (data.error || "Pastikan Token dan Chat ID Telegram terpasang."), "error");
      }
    } catch (e: any) {
      toast("Error: " + e.message, "error");
    } finally {
      setTestingPing(false);
    }
  };

  const handleAddFeaturePoint = () => {
    const val = newFeatureInput.trim();
    if (!val) return;
    const next = [...rFeatures, val];
    setRFeatures(next);
    setNewFeatureInput("");
  };

  const handleRemoveFeaturePoint = (index: number) => {
    const next = rFeatures.filter((_, i) => i !== index);
    setRFeatures(next);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FiTool className="text-primary" />
            Pengaturan Sistem & Kredensial
          </h2>
          <p className="text-on-surface-variant mt-1">
            Kelola Mode Maintenance, Kredensial Rahasia Aplikasi (App Secrets), dan Integrasi Bot Telegram.
          </p>
        </div>
      </div>

      {/* ── Unsaved Changes Banner ─────────────────────────────── */}
      {isDirty && (
        <div className="mb-5 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm">
          <FiAlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>
            Anda memiliki <strong>perubahan yang belum disimpan</strong>.
            Klik <strong>&quot;Simpan Perubahan&quot;</strong> agar perubahan tidak hilang saat Anda pindah halaman.
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
      <div className="space-y-6">

        {/* ── KREDENSIAL RAHASIA APLIKASI (APP SECRETS) ───────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
          <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20 mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                <FiKey size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  Pengaturan Rahasia Aplikasi (App Secrets)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Bebas Bocor
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Kredensial tersimpan di tabel terisolasi dengan akses eksklusif Service Role. Nilai rahasia tidak pernah ditampilkan di layar demi keamanan saat ganti kepengurusan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadSecretStatusData}
              disabled={loadingSecrets}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-surface-variant/40 hover:bg-surface-variant/60 text-on-surface border border-outline-variant/30 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Perbarui Status Kredensial"
            >
              <FiRefreshCw size={14} className={loadingSecrets ? "animate-spin" : ""} />
              {loadingSecrets ? "Memuat..." : "Segarkan Status"}
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. Token Bot Telegram */}
            <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/20">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <FiSend size={15} className="text-sky-500" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Token Bot Telegram
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Token otentikasi dari @BotFather (Format: <code>&lt;angka_id&gt;:&lt;token_alphanumeric&gt;</code>).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {secretStatuses?.telegram_bot_token.isSet ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <FiCheckCircle size={12} />
                      Terisi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <FiAlertTriangle size={12} />
                      Kosong
                    </span>
                  )}
                </div>
              </div>

              {secretStatuses?.telegram_bot_token.updatedAt && (
                <p className="text-[10px] text-on-surface-variant mb-2">
                  Terakhir diubah: {new Date(secretStatuses.telegram_bot_token.updatedAt).toLocaleString("id-ID")}
                  {secretStatuses.telegram_bot_token.updatedBy ? ` oleh ${secretStatuses.telegram_bot_token.updatedBy}` : ''}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={secretInputs.telegram_bot_token || ""}
                  onChange={(e) => setSecretInputs((prev) => ({ ...prev, telegram_bot_token: e.target.value }))}
                  placeholder="Ketik token Telegram baru untuk mengganti..."
                  className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateSecret("telegram_bot_token")}
                  disabled={savingKey === "telegram_bot_token" || !(secretInputs.telegram_bot_token || "").trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
                >
                  {savingKey === "telegram_bot_token" ? "Menyimpan..." : "Ganti"}
                </button>
              </div>
            </div>

            {/* 2. Chat ID Telegram */}
            <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/20">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <FiSend size={15} className="text-sky-500" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Chat ID Telegram
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    ID grup / channel tujuan notifikasi berita & aduan (Angka bulat numerik, contoh: <code>-1001234567890</code>).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {secretStatuses?.telegram_chat_id.isSet ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <FiCheckCircle size={12} />
                      Terisi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <FiAlertTriangle size={12} />
                      Kosong
                    </span>
                  )}
                </div>
              </div>

              {secretStatuses?.telegram_chat_id.updatedAt && (
                <p className="text-[10px] text-on-surface-variant mb-2">
                  Terakhir diubah: {new Date(secretStatuses.telegram_chat_id.updatedAt).toLocaleString("id-ID")}
                  {secretStatuses.telegram_chat_id.updatedBy ? ` oleh ${secretStatuses.telegram_chat_id.updatedBy}` : ''}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={secretInputs.telegram_chat_id || ""}
                  onChange={(e) => setSecretInputs((prev) => ({ ...prev, telegram_chat_id: e.target.value }))}
                  placeholder="Ketik Chat ID Telegram baru untuk mengganti..."
                  className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateSecret("telegram_chat_id")}
                  disabled={savingKey === "telegram_chat_id" || !(secretInputs.telegram_chat_id || "").trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
                >
                  {savingKey === "telegram_chat_id" ? "Menyimpan..." : "Ganti"}
                </button>
              </div>
            </div>

            {/* 3. URL Webhook Make (Kotak Saran) */}
            <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/20">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <FiLink size={15} className="text-purple-500" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      URL Webhook Make / Sheets
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Endpoint penerima otomatis aduan mahasiswa (Wajib HTTPS dengan host resmi <code>make.com</code>).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {secretStatuses?.google_sheets_webhook_url.isSet ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <FiCheckCircle size={12} />
                      Terisi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <FiAlertTriangle size={12} />
                      Kosong
                    </span>
                  )}
                </div>
              </div>

              {secretStatuses?.google_sheets_webhook_url.updatedAt && (
                <p className="text-[10px] text-on-surface-variant mb-2">
                  Terakhir diubah: {new Date(secretStatuses.google_sheets_webhook_url.updatedAt).toLocaleString("id-ID")}
                  {secretStatuses.google_sheets_webhook_url.updatedBy ? ` oleh ${secretStatuses.google_sheets_webhook_url.updatedBy}` : ''}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={secretInputs.google_sheets_webhook_url || ""}
                  onChange={(e) => setSecretInputs((prev) => ({ ...prev, google_sheets_webhook_url: e.target.value }))}
                  placeholder="https://hook.eu1.make.com/..."
                  className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateSecret("google_sheets_webhook_url")}
                  disabled={savingKey === "google_sheets_webhook_url" || !(secretInputs.google_sheets_webhook_url || "").trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
                >
                  {savingKey === "google_sheets_webhook_url" ? "Menyimpan..." : "Ganti"}
                </button>
              </div>
            </div>

            {/* 4. URL Spreadsheet Rekap Aduan */}
            <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/20">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <FiFileText size={15} className="text-emerald-500" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      URL Spreadsheet Rekap Aduan
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Tautan Google Sheets rekap aduan (Wajib HTTPS dengan host <code>docs.google.com</code>).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {secretStatuses?.excel_view_url.isSet ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <FiCheckCircle size={12} />
                      Terisi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <FiAlertTriangle size={12} />
                      Kosong
                    </span>
                  )}
                </div>
              </div>

              {secretStatuses?.excel_view_url.updatedAt && (
                <p className="text-[10px] text-on-surface-variant mb-2">
                  Terakhir diubah: {new Date(secretStatuses.excel_view_url.updatedAt).toLocaleString("id-ID")}
                  {secretStatuses.excel_view_url.updatedBy ? ` oleh ${secretStatuses.excel_view_url.updatedBy}` : ''}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={secretInputs.excel_view_url || ""}
                  onChange={(e) => setSecretInputs((prev) => ({ ...prev, excel_view_url: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateSecret("excel_view_url")}
                  disabled={savingKey === "excel_view_url" || !(secretInputs.excel_view_url || "").trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
                >
                  {savingKey === "excel_view_url" ? "Menyimpan..." : "Ganti"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODE PEMELIHARAAN (MAINTENANCE MODE) ───────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl">
                <FiTool size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  Kontrol Mode Pemeliharaan (Maintenance Mode)
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Aktifkan untuk mengunci akses pengunjung umum saat melakukan perbaikan besar pada sistem.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mMode}
                onChange={(e) => setMMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-outline-variant/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-3 text-xs font-bold text-on-surface">
                {mMode ? (
                  <span className="text-amber-500">AKTIF (MAINTENANCE)</span>
                ) : (
                  <span className="text-on-surface-variant">NORMAL (OFF)</span>
                )}
              </span>
            </label>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                Estimasi Waktu Selesai
              </label>
              <input
                type="text"
                value={mTime}
                onChange={(e) => setMTime(e.target.value)}
                placeholder="Contoh: 1-2 Jam atau 20 Agustus 14:00"
                className="w-full bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                Pesan Khusus Pemeliharaan (Opsional)
              </label>
              <input
                type="text"
                value={mMsg}
                onChange={(e) => setMMsg(e.target.value)}
                placeholder="Contoh: Kami sedang meningkatkan kecepatan sistem & keamanan."
                className="w-full bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Release Notes Section */}
          <div className="pt-5 border-t border-outline-variant/20">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <FiStar className="text-secondary" size={18} />
                <h4 className="text-base font-bold text-on-surface">
                  Pembaruan Sistem / What&apos;s New (Changelog)
                </h4>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={rPublished}
                  onChange={(e) => setRPublished(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                />
                Tampilkan Modal &apos;What&apos;s New&apos; saat Maintenance Selesai
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Versi Update
                </label>
                <input
                  type="text"
                  value={rVersion}
                  onChange={(e) => setRVersion(e.target.value)}
                  placeholder="v1.2.0"
                  className="w-full bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Judul Pengumuman Update
                </label>
                <input
                  type="text"
                  value={rTitle}
                  onChange={(e) => setRTitle(e.target.value)}
                  placeholder="Pembaruan Sistem Portal BEM"
                  className="w-full bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Feature Points list */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Poin-poin Fitur Baru & Peningkatan (Bahasa Pengguna):
              </label>

              <div className="space-y-2 mb-3">
                {rFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-surface-variant/10 border border-outline-variant/20 px-3 py-2 rounded-xl text-sm"
                  >
                    <FiCheckCircle size={15} className="text-secondary shrink-0" />
                    <span className="flex-1 text-on-surface font-medium">{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeaturePoint(idx)}
                      className="text-on-surface-variant hover:text-red-500 p-1 transition-colors"
                      title="Hapus Poin"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add feature point */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeaturePoint();
                    }
                  }}
                  placeholder="Tambah poin fitur baru..."
                  className="flex-1 bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddFeaturePoint}
                  disabled={!newFeatureInput.trim()}
                  className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl text-sm hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <FiPlus size={16} /> Tambah
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ADMIN CONTACT CARD ────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/20">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Kontak Admin (WhatsApp)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Nomor ini akan digunakan sebagai kontak bantuan darurat jika pengguna mengalami kendala teknis.
              </p>
            </div>
          </div>
          
          <div className="max-w-md">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="Contoh: 085199562719"
              className="w-full bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm shadow-sm"
            />
          </div>
        </div>

        {/* ── BOT TELEGRAM OPERATIONAL CARD ──────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
          <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20 mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 rounded-2xl">
                <FiSend size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  Fitur Notifikasi Telegram Berita
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Kontrol penyiaran otomatis berita baru dan peringatan berkala mingguan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingPing}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <FiSend size={14} className={testingPing ? "animate-spin" : ""} />
              {testingPing ? "Menguji..." : "Uji Coba Pesan Bot"}
            </button>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg shrink-0 mt-0.5">
              <FiShield size={18} />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-on-surface">Kredensial Terhubung Otomatis</p>
              <p className="text-on-surface-variant leading-relaxed">
                Token dan Chat ID Telegram dibaca dari tabel rahasia <strong>App Secrets</strong> di atas (dengan fallback ke Environment Variables). Tombol di samping langsung menguji pengiriman pesan ke channel aktif.
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/20">
            <div className="flex items-center justify-between p-3.5 bg-surface-variant/20 rounded-xl border border-outline-variant/20">
              <div>
                <p className="font-bold text-xs text-on-surface">Notifikasi Berita Baru</p>
                <p className="text-[11px] text-on-surface-variant">Siarkan otomatis berita yang baru dipublikasikan</p>
              </div>
              <button
                type="button"
                onClick={() => setTNotifEnabled(!tNotifEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tNotifEnabled ? "bg-primary" : "bg-outline-variant/40"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    tNotifEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-surface-variant/20 rounded-xl border border-outline-variant/20">
              <div>
                <p className="font-bold text-xs text-on-surface">Peringatan Belum Upload 1 Minggu</p>
                <p className="text-[11px] text-on-surface-variant">Kirim peringatan jika 7 hari tanpa upload berita</p>
              </div>
              <button
                type="button"
                onClick={() => setTReminderEnabled(!tReminderEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tReminderEnabled ? "bg-amber-500" : "bg-outline-variant/40"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    tReminderEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── ACTION FOOTER ────────────────────────────────────────── */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSaveMaintenance}
            disabled={savingMaintenance}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 ${
              isDirty
                ? "bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-400/30"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            {savingMaintenance ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <FiSave size={20} />
                {isDirty ? "Simpan Perubahan ●" : "Simpan Pengaturan Sistem"}
              </>
            )}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
