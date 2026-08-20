"use client";

import React, { useState } from "react";
import { 
  FiFileText, FiBriefcase, FiCalendar, FiUsers, FiHeart, 
  FiPieChart, FiServer, FiActivity
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AdminDashboardCharts from "./AdminDashboardCharts";
import AdminMonitoringSection from "./AdminMonitoringSection";

interface AdminDashboardClientProps {
  bCount: number;
  kCount: number;
  aCount: number;
  mCount: number;
  topBerita: { title: string; views: number }[] | null;
  topKarya: { title: string; views: number; likes: number }[] | null;
  monthlyUploadData?: { name: string; Berita: number; Karya: number; Agenda: number }[];
  visitorData?: { name: string; Pengunjung: number }[];
}

export default function AdminDashboardClient({
  bCount,
  kCount,
  aCount,
  mCount,
  topBerita,
  topKarya,
  monthlyUploadData,
  visitorData,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "monitoring" | "logs">("overview");

  const stats = [
    { label: "Total Berita", value: bCount, icon: <FiFileText size={22} />, color: "from-blue-500 to-blue-600 text-white", shadow: "shadow-blue-500/20" },
    { label: "Total Karya", value: kCount, icon: <FiBriefcase size={22} />, color: "from-purple-500 to-purple-600 text-white", shadow: "shadow-purple-500/20" },
    { label: "Total Agenda", value: aCount, icon: <FiCalendar size={22} />, color: "from-emerald-500 to-emerald-600 text-white", shadow: "shadow-emerald-500/20" },
    { label: "Total Mahasiswa", value: mCount, icon: <FiUsers size={22} />, color: "from-amber-500 to-amber-600 text-white", shadow: "shadow-amber-500/20" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Tab Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Selamat Datang, Admin! 👋</h2>
          <p className="text-on-surface-variant text-sm mt-1">Pusat kendali operasional, performa server, dan statistik portal BEM STMIK Tazkia.</p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-surface-variant/30 p-1.5 rounded-2xl border border-outline-variant/30 text-xs font-bold shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface/50"
            }`}
          >
            <FiPieChart size={16} />
            <span>Ringkasan Data</span>
          </button>

          <button
            onClick={() => setActiveTab("monitoring")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === "monitoring"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface/50"
            }`}
          >
            <FiServer size={16} />
            <span>Monitoring Server</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === "logs"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface/50"
            }`}
          >
            <FiActivity size={16} />
            <span>Log Aktivitas</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="tab-overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, i) => (
                <div key={i} className="bg-surface p-5 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 p-8 -mr-6 -mt-6 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out`}></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">{stat.label}</p>
                      <h3 className="text-2xl font-black text-on-surface">{stat.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Charts Area */}
            <AdminDashboardCharts 
              beritaCount={bCount} 
              karyaCount={kCount} 
              agendaCount={aCount} 
              monthlyUploadData={monthlyUploadData}
              visitorData={visitorData}
            />

            {/* Top Views Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Berita */}
              <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FiFileText size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">Top Berita Terpopuler</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {topBerita?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant/20 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface bg-surface-variant/30 px-3 py-1 rounded-full">
                        <FiUsers size={12} className="text-on-surface-variant" />
                        {item.views}
                      </div>
                    </div>
                  ))}
                  {(!topBerita || topBerita.length === 0) && (
                    <p className="text-xs text-on-surface-variant text-center py-4">Belum ada data berita.</p>
                  )}
                </div>
              </div>

              {/* Top Karya */}
              <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <FiHeart size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">Top Karya Terpopuler</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {topKarya?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant/20 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface bg-surface-variant/30 px-3 py-1 rounded-full">
                        <FiHeart size={12} className="text-red-500" />
                        {item.likes || 0}
                      </div>
                    </div>
                  ))}
                  {(!topKarya || topKarya.length === 0) && (
                    <p className="text-xs text-on-surface-variant text-center py-4">Belum ada data karya.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === "monitoring" && (
          <motion.div
            key="tab-monitoring"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AdminMonitoringSection mode="server-only" />
          </motion.div>
        )}

        {activeTab === "logs" && (
          <motion.div
            key="tab-logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AdminMonitoringSection mode="logs-only" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
