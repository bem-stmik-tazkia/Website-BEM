import React from "react";
import { createClient } from "@/utils/supabase/server";
import { FiUsers, FiFileText, FiBriefcase, FiCalendar, FiClock, FiHeart } from "react-icons/fi";
import AdminDashboardCharts from "./AdminDashboardCharts";

export const revalidate = 0; // Disable static caching for admin

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts
  const { count: beritaCount } = await supabase.from('berita').select('*', { count: 'exact', head: true });
  const { count: karyaCount } = await supabase.from('karya').select('*', { count: 'exact', head: true });
  const { count: agendaCount } = await supabase.from('agendas').select('*', { count: 'exact', head: true });

  const bCount = beritaCount || 0;
  const kCount = karyaCount || 0;
  const aCount = agendaCount || 0;

  const stats = [
    { label: "Total Berita", value: bCount, icon: <FiFileText size={24} />, color: "from-blue-500 to-blue-600 text-white", shadow: "shadow-blue-500/30" },
    { label: "Total Karya", value: kCount, icon: <FiBriefcase size={24} />, color: "from-purple-500 to-purple-600 text-white", shadow: "shadow-purple-500/30" },
    { label: "Total Agenda", value: aCount, icon: <FiCalendar size={24} />, color: "from-green-500 to-green-600 text-white", shadow: "shadow-green-500/30" },
    { label: "Pengunjung", value: "3.4K", icon: <FiUsers size={24} />, color: "from-orange-500 to-orange-600 text-white", shadow: "shadow-orange-500/30" },
  ];

  // Fetch top viewed Berita
  const { data: topBerita } = await supabase
    .from('berita')
    .select('title, views')
    .order('views', { ascending: false })
    .limit(3);

  // Fetch top viewed Karya (now by likes as requested)
  const { data: topKarya } = await supabase
    .from('karya')
    .select('title, views, likes')
    .eq('status', 'approved')
    .order('likes', { ascending: false })
    .limit(3);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">Selamat Datang, Admin! 👋</h2>
        <p className="text-on-surface-variant text-lg">Berikut adalah ringkasan data di website BEM STMIK Tazkia saat ini.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface p-6 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 -mr-6 -mt-6 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out`}></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-on-surface">{stat.value}</h3>
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
      />

      {/* Top Views Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Berita */}
        <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FiFileText size={20} />
              </div>
              <h3 className="text-xl font-bold text-on-surface">Top Berita Terpopuler</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {topBerita?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-variant/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface bg-surface-variant/30 px-3 py-1 rounded-full">
                  <FiUsers size={14} className="text-on-surface-variant" />
                  {item.views}
                </div>
              </div>
            ))}
            {(!topBerita || topBerita.length === 0) && (
              <p className="text-sm text-on-surface-variant text-center py-4">Belum ada data berita.</p>
            )}
          </div>
        </div>

        {/* Top Karya */}
        <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FiHeart size={20} />
              </div>
              <h3 className="text-xl font-bold text-on-surface">Top Karya Terpopuler</h3>
            </div>
          </div>

          <div className="space-y-4">
            {topKarya?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-variant/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface bg-surface-variant/30 px-3 py-1 rounded-full">
                  <FiHeart size={14} className="text-red-500" />
                  {item.likes || 0}
                </div>
              </div>
            ))}
            {(!topKarya || topKarya.length === 0) && (
              <p className="text-sm text-on-surface-variant text-center py-4">Belum ada data karya.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
