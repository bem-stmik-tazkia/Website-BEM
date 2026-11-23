"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FiFileText,
  FiCalendar,
  FiUsers,
  FiPieChart,
  FiServer,
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiPlusCircle,
  FiBookOpen,
  FiMessageSquare,
  FiTool,
  FiEye,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import AdminDashboardCharts from "./AdminDashboardCharts";
import AdminMonitoringSection from "./AdminMonitoringSection";

interface AdminDashboardClientProps {
  bCount: number;
  activeAgendaCount: number;
  endedAgendaCount: number;
  totalAgendaCount: number;
  publishedArticlesCount: number;
  pendingArticlesCount: number;
  totalArticlesCount: number;
  topBerita: { title: string; views: number }[] | null;
  monthlyUploadData?: {
    name: string;
    Berita: number;
    Artikel: number;
    Agenda: number;
  }[];
  visitorData?: { name: string; Pengunjung: number }[];
  latestBerita?: { title: string; created_at: string; slug: string } | null;
  daysSinceLastBerita?: number;
}

export default function AdminDashboardClient({
  bCount,
  activeAgendaCount,
  endedAgendaCount,
  totalAgendaCount,
  publishedArticlesCount,
  pendingArticlesCount,
  totalArticlesCount,
  topBerita,
  monthlyUploadData,
  visitorData,
  latestBerita,
  daysSinceLastBerita = 0,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "monitoring" | "logs">("overview");

  const totalVisitors =
    visitorData?.reduce((acc, curr) => acc + curr.Pengunjung, 0) || 0;

  const quickShortcuts = [
    {
      title: "Tulis Berita Resmi",
      desc: "Publikasikan warta kabinet & pers rilis resmi BEM",
      href: "/admin/berita/new",
      icon: FiPlusCircle,
      iconColor: "text-blue-600 bg-blue-500/10",
      accent: "hover:border-blue-500/40",
    },
    {
      title: "Moderasi Artikel Mahasiswa",
      desc:
        pendingArticlesCount > 0
          ? `${pendingArticlesCount} artikel menunggu peninjauan Anda`
          : "Tinjau dan setujui karya tulis mahasiswa",
      href: "/admin/artikel",
      icon: FiBookOpen,
      iconColor: "text-purple-600 bg-purple-500/10",
      accent: "hover:border-purple-500/40",
      badge: pendingArticlesCount > 0 ? `${pendingArticlesCount} Pending` : null,
    },
    {
      title: "Buat Agenda / Kegiatan Baru",
      desc: "Jadwalkan event, proker baru atau buka pendaftaran",
      href: "/admin/kegiatan/form",
      icon: FiCalendar,
      iconColor: "text-emerald-600 bg-emerald-500/10",
      accent: "hover:border-emerald-500/40",
    },
    {
      title: "Kotak Saran & Aspirasi",
      desc: "Baca feedback & aduan anonim dari mahasiswa",
      href: "/admin/saran-aduan",
      icon: FiMessageSquare,
      iconColor: "text-amber-600 bg-amber-500/10",
      accent: "hover:border-amber-500/40",
    },
    {
      title: "Pengaturan & Maintenance",
      desc: "Konfigurasi status website, bot, dan sistem",
      href: "/admin/system-settings",
      icon: FiTool,
      iconColor: "text-slate-600 bg-slate-500/10",
      accent: "hover:border-slate-500/40",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Quick Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Selamat Datang, Admin! 👋
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pusat kendali operasional, moderasi konten, dan analitik portal BEM STMIK Tazkia.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold shrink-0 self-start lg:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-150 ${
              activeTab === "overview"
                ? "bg-primary text-white shadow-sm shadow-primary/30 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <FiPieChart size={15} />
            <span>Ringkasan Data</span>
          </button>

          <button
            onClick={() => setActiveTab("monitoring")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-150 ${
              activeTab === "monitoring"
                ? "bg-primary text-white shadow-sm shadow-primary/30 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <FiServer size={15} />
            <span>Monitoring Server</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-150 ${
              activeTab === "logs"
                ? "bg-primary text-white shadow-sm shadow-primary/30 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <FiActivity size={15} />
            <span>Log Aktivitas</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Warning Banner: >= 7 Days No Articles */}
          {daysSinceLastBerita >= 7 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiAlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                    Peringatan Publikasi: Sudah{" "}
                    {daysSinceLastBerita >= 999
                      ? "lebih dari 1 minggu"
                      : `${daysSinceLastBerita} hari`}{" "}
                    belum ada berita baru!
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    {latestBerita ? `Berita terakhir: "${latestBerita.title}". ` : ""}
                    Jaga keaktifan portal publik dengan mempublikasikan kabar terkini kabinet.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/berita/new"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm shadow-amber-600/20"
              >
                Tulis Berita Baru &rarr;
              </Link>
            </div>
          )}

          {/* KPI Stat Cards (4 Columns - Berita & Artikel dipisahkan, status Agenda diperjelas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Berita Resmi BEM */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <FiFileText size={20} />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                    Resmi BEM
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Berita
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {bCount}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">rilis berita</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Kabar & informasi resmi kabinet
                </p>
              </div>
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <Link
                  href="/admin/berita"
                  className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                >
                  <span>Kelola Berita</span>
                  <FiArrowRight size={13} />
                </Link>
                <Link
                  href="/admin/berita/new"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <FiPlusCircle size={13} />
                  <span>Tulis</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Artikel Mahasiswa (Terpisah dari Berita!) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <FiBookOpen size={20} />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      pendingArticlesCount > 0
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 animate-pulse"
                        : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50"
                    }`}
                  >
                    {pendingArticlesCount > 0
                      ? `${pendingArticlesCount} Perlu Review`
                      : "Terverifikasi"}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Artikel Mahasiswa
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {publishedArticlesCount}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    terbit {totalArticlesCount > publishedArticlesCount ? `(${totalArticlesCount} total)` : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Karya tulis & opini mahasiswa
                </p>
              </div>
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <Link
                  href="/admin/artikel"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                >
                  <span>Moderasi Artikel</span>
                  <FiArrowRight size={13} />
                </Link>
                <Link
                  href="/admin/artikel"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>

            {/* Card 3: Agenda Kegiatan (Jelas bahwa sudah berakhir) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <FiCalendar size={20} />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      activeAgendaCount > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {activeAgendaCount > 0 ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{activeAgendaCount} Berlangsung</span>
                      </>
                    ) : (
                      <>
                        <FiClock size={11} />
                        <span>Telah Berakhir</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Agenda Kegiatan
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeAgendaCount}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    aktif ({endedAgendaCount} selesai)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {endedAgendaCount > 0 && activeAgendaCount === 0
                    ? `${endedAgendaCount} agenda sebelumnya telah terlaksana`
                    : "Kalender event & kegiatan BEM"}
                </p>
              </div>
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <Link
                  href="/admin/kegiatan"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                >
                  <span>Riwayat Agenda</span>
                  <FiArrowRight size={13} />
                </Link>
                <Link
                  href="/admin/kegiatan/form"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <FiPlusCircle size={13} />
                  <span>Jadwalkan</span>
                </Link>
              </div>
            </div>

            {/* Card 4: Total Pengunjung */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <FiUsers size={20} />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                    <FiTrendingUp size={11} />
                    <span>Real-time</span>
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Pengunjung
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalVisitors.toLocaleString("id-ID")}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">kunjungan</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Lalu lintas portal BEM 6 bulan terakhir
                </p>
              </div>
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">Portal Publik</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <FiCheckCircle size={13} />
                  <span>Terverifikasi</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Charts Area */}
          <AdminDashboardCharts
            beritaCount={bCount}
            artikelCount={publishedArticlesCount}
            agendaCount={totalAgendaCount}
            activeAgendaCount={activeAgendaCount}
            endedAgendaCount={endedAgendaCount}
            monthlyUploadData={monthlyUploadData}
            visitorData={visitorData}
          />

          {/* Bottom Balanced Row: Top Berita (Left) + Aksi Cepat Pintasan (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Top Berita Resmi BEM Terpopuler */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                      <FiFileText size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Top Berita Resmi Terpopuler
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rilis berita BEM dengan jumlah pembaca terbanyak
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/berita"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Semua Berita</span>
                    <FiArrowRight size={12} />
                  </Link>
                </div>

                <div className="space-y-3">
                  {topBerita && topBerita.length > 0 ? (
                    topBerita.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            idx === 0
                              ? "bg-amber-500 text-white shadow-xs"
                              : idx === 1
                              ? "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                              : "bg-amber-700/20 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 shrink-0">
                          <FiEye size={13} className="text-blue-500" />
                          <span>{(item.views || 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Belum ada data statistik pembaca berita.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/admin/berita/new"
                  className="inline-flex items-center justify-center gap-2 text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                >
                  <FiPlusCircle size={14} />
                  <span>Publikasikan berita baru untuk mahasiswa</span>
                </Link>
              </div>
            </div>

            {/* Right Card: Aksi Cepat & Pintasan Admin */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <FiActivity size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Aksi Cepat & Pintasan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Navigasi langsung ke tugas administratif penting
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {quickShortcuts.map((shortcut, idx) => {
                    const Icon = shortcut.icon;
                    return (
                      <Link
                        key={idx}
                        href={shortcut.href}
                        prefetch={true}
                        className={`flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group ${shortcut.accent}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${shortcut.iconColor}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                                {shortcut.title}
                              </p>
                              {shortcut.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse shrink-0">
                                  {shortcut.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {shortcut.desc}
                            </p>
                          </div>
                        </div>
                        <FiArrowRight
                          size={14}
                          className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Monitoring Server */}
      {activeTab === "monitoring" && (
        <div className="animate-fade-in">
          <AdminMonitoringSection mode="server-only" />
        </div>
      )}

      {/* Tab Content: Logs */}
      {activeTab === "logs" && (
        <div className="animate-fade-in">
          <AdminMonitoringSection mode="logs-only" />
        </div>
      )}
    </div>
  );
}
