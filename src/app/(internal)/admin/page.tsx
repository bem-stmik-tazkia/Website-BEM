import React from "react";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";
import { isDeadlinePassedJakarta } from "@/lib/registration-validation";
import AdminDashboardClient from "./AdminDashboardClient";

export const revalidate = 0; // Disable static caching for admin

function getDaysSince(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  let serviceClient = supabase;
  try {
    serviceClient = getServiceRoleClient();
  } catch (err) {
    serviceClient = supabase;
  }

  // Fetch real count metrics from Supabase database in parallel
  const [
    { count: beritaCount },
    articlesDataRes,
    publishedViewRes,
    agendasRes,
    beritaDatesRes,
    topBeritaRes,
    beritaViewsRes,
    siteVisitorsRes,
    latestBeritaRes,
  ] = await Promise.all([
    // 1. Berita resmi BEM
    serviceClient.from("berita").select("*", { count: "exact", head: true }),
    // 2. Artikel mahasiswa (dari tabel articles via service client untuk bypass RLS)
    serviceClient.from("articles").select("id, title, status, created_at"),
    // Fallback: view published_articles
    serviceClient.from("published_articles").select("*", { count: "exact", head: true }),
    // 3. Agenda lengkap untuk hitung status aktif vs telah berakhir
    serviceClient.from("agendas").select("id, title, date, end_date, deadline, type, created_at"),
    // 4. Data tanggal untuk grafik 6 bulan
    serviceClient.from("berita").select("created_at"),
    // 5. Top Berita & analitik
    serviceClient.from("berita").select("title, views").order("views", { ascending: false }).limit(3),
    serviceClient.from("berita").select("views, created_at"),
    serviceClient.from("site_visitors").select("created_at"),
    serviceClient.from("berita").select("title, created_at, slug").eq("is_published", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const latestBerita = latestBeritaRes?.data || null;
  let daysSinceLastBerita = 0;
  if (latestBerita && latestBerita.created_at) {
    daysSinceLastBerita = getDaysSince(latestBerita.created_at);
  } else if (!latestBerita) {
    daysSinceLastBerita = 999;
  }

  const bCount = beritaCount || 0;

  // Analisa artikel mahasiswa
  const allArticles = articlesDataRes?.data || [];
  const publishedFromTable = allArticles.filter((a: any) =>
    a.status === "published" || a.status === "approved"
  ).length;
  const viewCount = publishedViewRes?.count || 0;
  const pArtsCount = Math.max(publishedFromTable, viewCount);
  const pendArtsCount = allArticles.filter((a: any) => a.status === "pending").length;
  const tArtsCount = Math.max(allArticles.length, pArtsCount);

  // Analisa status agenda (aktif vs telah berakhir)
  const allAgendas = agendasRes?.data || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let activeAgendaCount = 0;
  let endedAgendaCount = 0;

  allAgendas.forEach((item: any) => {
    let isEnded = false;

    if (item.type === "volunteer") {
      isEnded = isDeadlinePassedJakarta(item.deadline, now);
    } else {
      if (item.date) {
        const eDate = new Date(item.date);
        eDate.setHours(0, 0, 0, 0);
        if (eDate < today) isEnded = true;
      }
    }

    if (isEnded) {
      endedAgendaCount++;
    } else {
      activeAgendaCount++;
    }
  });

  const totalAgendaCount = allAgendas.length;

  // Build real monthly upload data for the last 6 months (Berita, Artikel, Agenda)
  const months: { name: string; year: number; monthIdx: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString("id-ID", { month: "short" });
    months.push({ name: monthName, year: d.getFullYear(), monthIdx: d.getMonth() });
  }

  const monthlyUploadData = months.map((m) => {
    const countB =
      beritaDatesRes.data?.filter((item: any) => {
        if (!item.created_at) return false;
        const dt = new Date(item.created_at);
        return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
      }).length || 0;

    const countArt =
      allArticles.filter((item: any) => {
        if (!item.created_at) return false;
        const dt = new Date(item.created_at);
        return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
      }).length || 0;

    const countA =
      allAgendas.filter((item: any) => {
        if (!item.created_at) return false;
        const dt = new Date(item.created_at);
        return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
      }).length || 0;

    return {
      name: m.name,
      Berita: countB,
      Artikel: countArt,
      Agenda: countA,
    };
  });

  // Calculate visitor statistics
  const siteVisitorsData = siteVisitorsRes ? siteVisitorsRes.data : null;

  const visitorData = months.map((m) => {
    let totalVisitors = 0;

    if (siteVisitorsData && siteVisitorsData.length > 0) {
      totalVisitors = siteVisitorsData.filter((v: any) => {
        if (!v.created_at) return false;
        const dt = new Date(v.created_at);
        return (
          dt.getFullYear() < m.year ||
          (dt.getFullYear() === m.year && dt.getMonth() <= m.monthIdx)
        );
      }).length;
    } else {
      beritaViewsRes.data?.forEach((b: any) => {
        if (b.created_at) {
          const dt = new Date(b.created_at);
          if (
            dt.getFullYear() < m.year ||
            (dt.getFullYear() === m.year && dt.getMonth() <= m.monthIdx)
          ) {
            totalVisitors += b.views || 0;
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
      activeAgendaCount={activeAgendaCount}
      endedAgendaCount={endedAgendaCount}
      totalAgendaCount={totalAgendaCount}
      publishedArticlesCount={pArtsCount}
      pendingArticlesCount={pendArtsCount}
      totalArticlesCount={tArtsCount}
      topBerita={topBeritaRes.data}
      monthlyUploadData={monthlyUploadData}
      visitorData={visitorData}
      latestBerita={latestBerita}
      daysSinceLastBerita={daysSinceLastBerita}
    />
  );
}
