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

  // Fetch metrics in lean parallel queries (gabung 5 query berita menjadi 1 + RPC agregasi pengunjung)
  const [
    allBeritaRes,
    articlesDataRes,
    publishedViewRes,
    agendasRes,
    visitorMonthlyRpcRes,
  ] = await Promise.all([
    // 1. Berita lengkap (ringan tanpa konten HTML) untuk total, grafik, top berita, & berita terakhir
    serviceClient
      .from("berita")
      .select("title, slug, views, created_at, is_published")
      .order("created_at", { ascending: false }),
    // 2. Artikel mahasiswa
    serviceClient.from("articles").select("id, title, status, created_at"),
    // Fallback: view published_articles
    serviceClient.from("published_articles").select("*", { count: "exact", head: true }),
    // 3. Agenda lengkap untuk hitung status aktif vs telah berakhir
    serviceClient.from("agendas").select("id, title, date, end_date, deadline, type, created_at"),
    // 4. Agregasi kumulatif pengunjung bulanan di Postgres (fallback ke raw query bila RPC belum ada)
    serviceClient.rpc("get_monthly_site_visitor_totals", { p_months: 6 }),
  ]);

  const allBerita = (allBeritaRes?.data || []) as Array<{
    title: string;
    slug: string;
    views?: number | null;
    created_at?: string | null;
    is_published?: boolean | null;
  }>;

  const latestBeritaRow = allBerita.find((b) => b.is_published) || null;
  const latestBerita = latestBeritaRow && latestBeritaRow.created_at
    ? { title: latestBeritaRow.title, slug: latestBeritaRow.slug, created_at: latestBeritaRow.created_at }
    : null;
  let daysSinceLastBerita = 0;
  if (latestBerita?.created_at) {
    daysSinceLastBerita = getDaysSince(latestBerita.created_at);
  } else if (!latestBerita) {
    daysSinceLastBerita = 999;
  }

  const topBeritaData = [...allBerita]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3)
    .map((b) => ({ title: b.title, views: b.views || 0 }));

  const bCount = allBerita.length;

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
    const countB = allBerita.filter((item) => {
      if (!item.created_at) return false;
      const dt = new Date(item.created_at);
      return dt.getFullYear() === m.year && dt.getMonth() === m.monthIdx;
    }).length;

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

  // Calculate visitor statistics (gunakan RPC agregasi bila tersedia, fallback ke tabel bila belum migrasi)
  let siteVisitorsData: Array<{ created_at: string }> | null = null;
  const rpcVisitors =
    !visitorMonthlyRpcRes.error && Array.isArray(visitorMonthlyRpcRes.data)
      ? (visitorMonthlyRpcRes.data as Array<{
          year_num: number;
          month_num: number;
          cumulative_total: number;
        }>)
      : null;

  if (!rpcVisitors) {
    const fallbackVisitorsRes = await serviceClient.from("site_visitors").select("created_at");
    siteVisitorsData = fallbackVisitorsRes?.data || null;
  }

  const visitorData = months.map((m) => {
    let totalVisitors = 0;

    if (rpcVisitors && rpcVisitors.length > 0) {
      const matched = rpcVisitors.find(
        (r) => Number(r.year_num) === m.year && Number(r.month_num) === m.monthIdx + 1
      );
      totalVisitors = matched ? Number(matched.cumulative_total || 0) : 0;
    } else if (siteVisitorsData && siteVisitorsData.length > 0) {
      totalVisitors = siteVisitorsData.filter((v) => {
        if (!v.created_at) return false;
        const dt = new Date(v.created_at);
        return (
          dt.getFullYear() < m.year ||
          (dt.getFullYear() === m.year && dt.getMonth() <= m.monthIdx)
        );
      }).length;
    } else {
      allBerita.forEach((b) => {
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
      topBerita={topBeritaData}
      monthlyUploadData={monthlyUploadData}
      visitorData={visitorData}
      latestBerita={latestBerita}
      daysSinceLastBerita={daysSinceLastBerita}
    />
  );
}
