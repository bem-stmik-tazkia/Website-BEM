"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const defaultMonthlyData = [
  { name: "Jun", Berita: 0, Artikel: 0, Agenda: 0 },
  { name: "Jul", Berita: 0, Artikel: 0, Agenda: 0 },
  { name: "Agu", Berita: 0, Artikel: 0, Agenda: 0 },
  { name: "Sep", Berita: 0, Artikel: 0, Agenda: 1 },
  { name: "Okt", Berita: 10, Artikel: 0, Agenda: 1 },
  { name: "Nov", Berita: 8, Artikel: 0, Agenda: 0 },
];

const defaultVisitorData = [
  { name: "Jun", Pengunjung: 400 },
  { name: "Jul", Pengunjung: 850 },
  { name: "Agu", Pengunjung: 1200 },
  { name: "Sep", Pengunjung: 1800 },
  { name: "Okt", Pengunjung: 2200 },
  { name: "Nov", Pengunjung: 2663 },
];

const DONUT_COLORS = ["#2563eb", "#9333ea", "#10b981"]; // Blue, Purple, Emerald

interface AdminDashboardChartsProps {
  beritaCount: number;
  artikelCount?: number;
  agendaCount: number;
  activeAgendaCount?: number;
  endedAgendaCount?: number;
  monthlyUploadData?: {
    name: string;
    Berita: number;
    Artikel: number;
    Agenda: number;
  }[];
  visitorData?: { name: string; Pengunjung: number }[];
}

export default function AdminDashboardCharts({
  beritaCount,
  artikelCount = 0,
  agendaCount,
  activeAgendaCount = 0,
  endedAgendaCount = 0,
  monthlyUploadData: customMonthlyData,
  visitorData: customVisitorData,
}: AdminDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData =
    customMonthlyData && customMonthlyData.length > 0
      ? customMonthlyData
      : defaultMonthlyData;

  const vData =
    customVisitorData && customVisitorData.length > 0
      ? customVisitorData
      : defaultVisitorData;

  if (!mounted) {
    return (
      <div className="h-[380px] w-full flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-400">
        Memuat Visualisasi Data...
      </div>
    );
  }

  const distributionData = [
    { name: "Berita BEM", value: beritaCount },
    { name: "Artikel Mahasiswa", value: artikelCount },
    { name: "Agenda Kegiatan", value: agendaCount },
  ];

  const totalContent = beritaCount + artikelCount + agendaCount;

  return (
    <div className="flex flex-col gap-6">
      {/* BARIS 1: Grafik Utama (Aktivitas Publikasi Konten) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 relative overflow-hidden">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Aktivitas Publikasi Konten
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Statistik Berita BEM, Artikel Mahasiswa, dan Agenda Kegiatan dalam 6 bulan terakhir
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800/40">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Berita ({beritaCount})
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-800/40">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Artikel ({artikelCount})
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Agenda ({endedAgendaCount > 0 && activeAgendaCount === 0 ? `${endedAgendaCount} Selesai` : agendaCount})
            </span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGradientBerita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="barGradientArtikel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="barGradientAgenda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
                className="dark:opacity-10"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                allowDecimals={false}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: "14px", fontSize: "12px" }}
              />
              <Bar
                dataKey="Berita"
                name="Berita BEM"
                fill="url(#barGradientBerita)"
                radius={[5, 5, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="Artikel"
                name="Artikel Mahasiswa"
                fill="url(#barGradientArtikel)"
                radius={[5, 5, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="Agenda"
                name="Agenda Kegiatan"
                fill="url(#barGradientAgenda)"
                radius={[5, 5, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BARIS 2: Tren Pengunjung (2 Cols) & Komposisi Konten (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Tren Pengunjung */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tren Kunjungan Portal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lalu lintas pembaca & pengunjung kumulatif berdasarkan waktu
            </p>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={vData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGradientPengunjung" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                  className="dark:opacity-10"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Pengunjung"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradientPengunjung)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Konten (Donut) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Komposisi Konten Portal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbandingan Berita BEM, Artikel Mahasiswa, dan Agenda
            </p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                {totalContent}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Total Konten
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {distributionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[index] }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.value} item
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
