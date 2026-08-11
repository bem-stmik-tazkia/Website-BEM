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

// ----------------------------------------
// DATA DUMMY
// ----------------------------------------

const monthlyUploadData = [
  { name: "Jan", Berita: 12, Karya: 4, Agenda: 2 },
  { name: "Feb", Berita: 19, Karya: 6, Agenda: 3 },
  { name: "Mar", Berita: 15, Karya: 8, Agenda: 5 },
  { name: "Apr", Berita: 22, Karya: 10, Agenda: 4 },
  { name: "Mei", Berita: 28, Karya: 15, Agenda: 8 },
  { name: "Jun", Berita: 35, Karya: 20, Agenda: 12 },
];

const visitorData = [
  { name: "Jan", Pengunjung: 1200 },
  { name: "Feb", Pengunjung: 1900 },
  { name: "Mar", Pengunjung: 1500 },
  { name: "Apr", Pengunjung: 2100 },
  { name: "Mei", Pengunjung: 2800 },
  { name: "Jun", Pengunjung: 3400 },
];

const COLORS = ["#3b82f6", "#a855f7", "#22c55e"]; // Blue, Purple, Green

interface AdminDashboardChartsProps {
  beritaCount: number;
  karyaCount: number;
  agendaCount: number;
}

export default function AdminDashboardCharts({
  beritaCount,
  karyaCount,
  agendaCount,
}: AdminDashboardChartsProps) {
  // To avoid hydration mismatch with Recharts, render only on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-surface-variant/20 rounded-2xl">Memuat Grafik...</div>;

  const distributionData = [
    { name: "Berita", value: beritaCount },
    { name: "Karya", value: karyaCount },
    { name: "Agenda", value: agendaCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* BARIS 1: Grafik Utama (Upload Konten) */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/20 p-6 relative overflow-hidden">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-on-surface">Aktivitas Publikasi</h3>
            <p className="text-sm text-on-surface-variant">Statistik penambahan konten dalam 6 bulan terakhir</p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyUploadData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <RechartsTooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Berita" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Karya" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Agenda" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BARIS 2: Pengunjung & Distribusi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grafik Pengunjung */}
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/20 p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-on-surface">Tren Pengunjung</h3>
            <p className="text-sm text-on-surface-variant">Jumlah pengunjung portal BEM</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visitorData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPengunjung" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Pengunjung" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPengunjung)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Konten */}
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex flex-col">
          <div className="mb-2">
            <h3 className="text-xl font-bold text-on-surface">Total Konten</h3>
            <p className="text-sm text-on-surface-variant">Berdasarkan kategori data</p>
          </div>
          <div className="flex-1 h-[200px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-on-surface leading-none">
                {beritaCount + karyaCount + agendaCount}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">Total</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            {distributionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-sm text-on-surface font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
