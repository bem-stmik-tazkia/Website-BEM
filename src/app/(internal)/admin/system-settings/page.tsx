"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiTool, FiX, FiStar, FiCheckCircle, FiSave, FiPlus, FiAlertTriangle } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface ReleaseNotes {
  version: string;
  title: string;
  date: string;
  features: string[];
  published: boolean;
}

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
      "Peningkatan stabilitas performa muat halaman",
      "Fitur pencarian mahasiswa berdasarkan angkatan & prodi",
      "Pembaruan antarmuka dan penanganan notifikasi real-time",
    ],
    rPublished: true,
  });

  const [mMode, setMMode] = useState(false);
  const [mTime, setMTime] = useState("1-2 Jam");
  const [mMsg, setMMsg] = useState("");
  const [rVersion, setRVersion] = useState("v1.2.0");
  const [rTitle, setRTitle] = useState("Pembaruan Sistem Portal BEM");
  const [rFeatures, setRFeatures] = useState<string[]>([
    "Peningkatan stabilitas performa muat halaman",
    "Fitur pencarian mahasiswa berdasarkan angkatan & prodi",
    "Pembaruan antarmuka dan penanganan notifikasi real-time",
  ]);
  const [rPublished, setRPublished] = useState(true);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // Check dirty against saved ref
  const checkDirty = useCallback(
    (
      _mMode: boolean,
      _mTime: string,
      _mMsg: string,
      _rVersion: string,
      _rTitle: string,
      _rFeatures: string[],
      _rPublished: boolean
    ) => {
      const s = savedRef.current;
      const dirty =
        _mMode !== s.mMode ||
        _mTime !== s.mTime ||
        _mMsg !== s.mMsg ||
        _rVersion !== s.rVersion ||
        _rTitle !== s.rTitle ||
        _rPublished !== s.rPublished ||
        JSON.stringify(_rFeatures) !== JSON.stringify(s.rFeatures);
      setIsDirty(dirty);
    },
    []
  );

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
      ]);

    if (error) {
      toast("Gagal memuat pengaturan sistem.", "error");
    } else if (data) {
      const mModeItem = data.find((d) => d.key === "maintenance_mode");
      const mTimeItem = data.find((d) => d.key === "maintenance_estimated_time");
      const mMsgItem = data.find((d) => d.key === "maintenance_message");
      const rNotesItem = data.find((d) => d.key === "release_notes");

      const newMMode = mModeItem?.value === "true";
      const newMTime = mTimeItem?.value || "1-2 Jam";
      const newMMsg = mMsgItem?.value || "";
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

      // Update saved ref to represent clean state
      savedRef.current = {
        mMode: newMMode,
        mTime: newMTime,
        mMsg: newMMsg,
        rVersion: newRVersion,
        rTitle: newRTitle,
        rFeatures: newRFeatures,
        rPublished: newRPublished,
      };

      setMMode(newMMode);
      setMTime(newMTime);
      setMMsg(newMMsg);
      setRVersion(newRVersion);
      setRTitle(newRTitle);
      setRFeatures(newRFeatures);
      setRPublished(newRPublished);
      setIsDirty(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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
    ];

    const { error } = await supabase
      .from("system_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      toast("Gagal menyimpan pengaturan sistem.", "error");
    } else {
      // Mark new values as clean
      savedRef.current = { mMode, mTime, mMsg, rVersion, rTitle, rFeatures, rPublished };
      setIsDirty(false);
      toast(
        mMode
          ? "Mode Pemeliharaan BERHASIL DIAKTIFKAN!"
          : "Pengaturan Sistem & Release Notes berhasil disimpan!",
        "success"
      );
    }
    setSavingMaintenance(false);
  };

  const handleAddFeaturePoint = () => {
    const val = newFeatureInput.trim();
    if (!val) return;
    const next = [...rFeatures, val];
    setRFeatures(next);
    setNewFeatureInput("");
    checkDirty(mMode, mTime, mMsg, rVersion, rTitle, next, rPublished);
  };

  const handleRemoveFeaturePoint = (index: number) => {
    const next = rFeatures.filter((_, i) => i !== index);
    setRFeatures(next);
    checkDirty(mMode, mTime, mMsg, rVersion, rTitle, next, rPublished);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FiTool className="text-primary" />
            Pengaturan Sistem & Pemeliharaan
          </h2>
          <p className="text-on-surface-variant mt-1">
            Kelola Mode Maintenance (Pemeliharaan Situs) dan Pengumuman Pembaruan Sistem (What&apos;s New).
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
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-6">

          {/* Header Switcher */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${mMode ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
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
                onChange={(e) => {
                  const v = e.target.checked;
                  setMMode(v);
                  checkDirty(v, mTime, mMsg, rVersion, rTitle, rFeatures, rPublished);
                }}
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
                onChange={(e) => {
                  setMTime(e.target.value);
                  checkDirty(mMode, e.target.value, mMsg, rVersion, rTitle, rFeatures, rPublished);
                }}
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
                onChange={(e) => {
                  setMMsg(e.target.value);
                  checkDirty(mMode, mTime, e.target.value, rVersion, rTitle, rFeatures, rPublished);
                }}
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
                  onChange={(e) => {
                    setRPublished(e.target.checked);
                    checkDirty(mMode, mTime, mMsg, rVersion, rTitle, rFeatures, e.target.checked);
                  }}
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
                  onChange={(e) => {
                    setRVersion(e.target.value);
                    checkDirty(mMode, mTime, mMsg, e.target.value, rTitle, rFeatures, rPublished);
                  }}
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
                  onChange={(e) => {
                    setRTitle(e.target.value);
                    checkDirty(mMode, mTime, mMsg, rVersion, e.target.value, rFeatures, rPublished);
                  }}
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

          {/* Action Footer */}
          <div className="flex justify-end pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={handleSaveMaintenance}
              disabled={savingMaintenance}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 ${
                isDirty
                  ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50 ring-offset-2"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {savingMaintenance ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FiSave size={18} />
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
