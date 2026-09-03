import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

export const revalidate = 0; // Disable static caching for admin

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real count metrics from Supabase database
  const [
    { count: beritaCount },
    { count: agendaCount },
    beritaDatesRes,
    agendaDatesRes,
    topBeritaRes,
    beritaViewsRes,
    siteVisitorsRes,
  ] = await Promise.all([
    supabase.from('berita').select('*', { count: 'exact', head: true }),
    supabase.from('agendas').select('*', { count: 'exact', head: true }),
    supabase.from('berita').select('created_at'),
    supabase.from('agendas').select('created_at'),
    supabase.from('berita').select('title, views').order('views', { ascending: false }).limit(3),
    supabase.from('berita').select('views, created_at'),
    supabase.from('site_visitors').select('created_at'),
  ]);

  const bCount = beritaCount || 0;
  const aCount = agendaCount || 0;

  // Build real monthly upload & visitor view statistics for the last 6 months
  const now = new Date();
  const months: { name: string; year: number; monthIdx: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
    months.push({ name: monthName, year: d.getFullYear(), monthIdx: d.getMonth() });
  }

  const monthlyUploadData = months.map(m => {
    const countB = beritaDatesRes.data?.filter(item => {
      if (!item.created_at) return false;
      const dt = new Date(item.created_at);
      return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
    }).length || 0;



    const countA = agendaDatesRes.data?.filter(item => {
      if (!item.created_at) return false;
      const dt = new Date(item.created_at);
      return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
    }).length || 0;

    return {
      name: m.name,
      Berita: countB,

      Agenda: countA,
    };
  });

  const siteVisitorsData = siteVisitorsRes ? siteVisitorsRes.data : null;

  const visitorData = months.map(m => {
    let totalVisitors = 0;
    
    if (siteVisitorsData && siteVisitorsData.length > 0) {
      // Calculate real site visitors from site_visitors table
      totalVisitors = siteVisitorsData.filter(v => {
        if (!v.created_at) return false;
        const dt = new Date(v.created_at);
        return dt.getFullYear() < m.year || (dt.getFullYear() === m.year && dt.getMonth() <= m.monthIdx);
      }).length;
    } else {
      // Fallback to content views sum
      beritaViewsRes.data?.forEach(b => {
        if (b.created_at) {
          const dt = new Date(b.created_at);
          if (dt.getFullYear() < m.year || (dt.getFullYear() === m.year && dt.getMonth() <= m.monthIdx)) {
            totalVisitors += (b.views || 0);
          }
        }
      });


    }

    return {
      name: m.name,
      Pengunjung: totalVisitors,
    };
  });

  return (
    <AdminDashboardClient
      bCount={bCount}
      aCount={aCount}
      topBerita={topBeritaRes.data}
      monthlyUploadData={monthlyUploadData}
      visitorData={visitorData}
    />
  );
}
