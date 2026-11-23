"use server";

import { requireAdmin, getServiceRoleClient } from "@/lib/auth";

export interface ActivityLogItem {
  id: string;
  type: "berita" | "artikel" | "agenda" | "system" | "saran";
  title: string;
  description: string;
  actor: string;
  timeAgo: string;
  rawDate: number;
  badgeColor: string;
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Baru saja";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return "Baru saja";
  if (diffInMins < 60) return `${diffInMins} menit lalu`;
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  if (diffInDays === 1) return "Kemarin";
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function fetchComprehensiveActivityLogs(
  timeFilter: string = "all"
): Promise<{ logs: ActivityLogItem[]; latencyMs: number }> {
  const start = Date.now();

  try {
    await requireAdmin();
    const service = getServiceRoleClient();

    // Date filter
    let fromDateStr = "";
    if (timeFilter !== "all") {
      const now = new Date();
      if (timeFilter === "today") now.setHours(0, 0, 0, 0);
      else if (timeFilter === "7days") now.setDate(now.getDate() - 7);
      else if (timeFilter === "30days") now.setDate(now.getDate() - 30);
      else if (timeFilter === "1year") now.setFullYear(now.getFullYear() - 1);
      fromDateStr = now.toISOString();
    }

    // Queries
    let qBerita = service
      .from("berita")
      .select("id, title, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(30);

    let qArticles = service
      .from("articles")
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        author:profiles!articles_author_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    let qAgenda = service
      .from("agendas")
      .select("id, title, type, date, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    let qSaran = service
      .from("saran_aduan")
      .select("id, subjek, pesan, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    let qSettings = service
      .from("system_settings")
      .select("key, value, updated_at")
      .order("updated_at", { ascending: false })
      .limit(15);

    if (fromDateStr) {
      qBerita = qBerita.gte("created_at", fromDateStr);
      qArticles = qArticles.gte("created_at", fromDateStr);
      qAgenda = qAgenda.gte("created_at", fromDateStr);
      qSaran = qSaran.gte("created_at", fromDateStr);
      qSettings = qSettings.gte("updated_at", fromDateStr);
    }

    const [beritaRes, articlesRes, agendaRes, saranRes, settingsRes] =
      await Promise.all([qBerita, qArticles, qAgenda, qSaran, qSettings]);

    const compiledLogs: ActivityLogItem[] = [];

    // 1. Berita
    if (beritaRes.data) {
      beritaRes.data.forEach((item: any) => {
        compiledLogs.push({
          id: `berita-${item.id}`,
          type: "berita",
          title: `Publikasi Berita: "${item.title}"`,
          description: "Rilis kabar dan pengumuman resmi kabinet BEM STMIK Tazkia.",
          actor: "Admin BEM",
          timeAgo: formatTimeAgo(item.created_at),
          rawDate: new Date(item.created_at || 0).getTime(),
          badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        });
      });
    }

    // 2. Artikel Mahasiswa (PENTING: sebelumnya tidak ada di log)
    if (articlesRes.data) {
      articlesRes.data.forEach((item: any) => {
        const authorName = item.author?.full_name || "Mahasiswa";
        let statusTitle = `Pengajuan Artikel: "${item.title}"`;
        let statusDesc = `Karya tulis diajukan oleh ${authorName} dan menunggu moderasi.`;
        let badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";

        if (item.status === "published" || item.status === "approved") {
          statusTitle = `Artikel Diterbitkan: "${item.title}"`;
          statusDesc = `Karya tulis karya ${authorName} telah disetujui & tayang di portal.`;
          badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";
        } else if (item.status === "rejected") {
          statusTitle = `Artikel Ditolak / Draf: "${item.title}"`;
          statusDesc = `Karya tulis dari ${authorName} dikembalikan untuk perbaikan.`;
          badgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
        }

        compiledLogs.push({
          id: `artikel-${item.id}`,
          type: "artikel",
          title: statusTitle,
          description: statusDesc,
          actor: authorName,
          timeAgo: formatTimeAgo(item.created_at),
          rawDate: new Date(item.created_at || 0).getTime(),
          badgeColor,
        });
      });
    }

    // 3. Agenda & Kegiatan
    if (agendaRes.data) {
      agendaRes.data.forEach((item: any) => {
        compiledLogs.push({
          id: `agenda-${item.id}`,
          type: "agenda",
          title: `Agenda Kegiatan: "${item.title}"`,
          description:
            item.type === "volunteer"
              ? "Open recruitment relawan/kepanitiaan kegiatan BEM."
              : "Jadwal program kerja terdaftar di kalender portal.",
          actor: "Admin BEM",
          timeAgo: formatTimeAgo(item.created_at),
          rawDate: new Date(item.created_at || 0).getTime(),
          badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        });
      });
    }

    // 4. Kotak Saran & Aspirasi
    if (saranRes.data) {
      saranRes.data.forEach((item: any) => {
        compiledLogs.push({
          id: `saran-${item.id}`,
          type: "saran",
          title: `Aspirasi Masuk: "${item.subjek || "Pesan Baru"}"`,
          description: `Pesan baru diterima melalui Kotak Saran & Aspirasi mahasiswa.`,
          actor: "Anonim / Mahasiswa",
          timeAgo: formatTimeAgo(item.created_at),
          rawDate: new Date(item.created_at || 0).getTime(),
          badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        });
      });
    }

    // 5. Pengaturan Sistem (Maintenance Mode, Rilis, Integrasi)
    if (settingsRes.data) {
      settingsRes.data.forEach((item: any) => {
        // Skip redundant sub-settings to prevent duplicate rows in log
        if (
          item.key === "maintenance_estimated_time" ||
          item.key === "maintenance_message"
        ) {
          return;
        }

        let title = `Pengaturan Diperbarui: ${item.key}`;
        let desc = "Konfigurasi sistem portal telah disesuaikan oleh administrator.";
        let badgeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

        if (item.key === "maintenance_mode") {
          const isMaint = item.value === "true";
          title = `Mode Maintenance: ${
            isMaint ? "Diaktifkan (Website Ditutup)" : "Dinonaktifkan (Website Normal)"
          }`;
          desc = isMaint
            ? "Portal publik dialihkan ke halaman pemeliharaan sistem dengan estimasi perbaikan."
            : "Portal publik telah dibuka kembali dan beroperasi penuh secara normal.";
          badgeColor = isMaint
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        } else if (item.key === "release_notes") {
          let rVersion = "";
          let rTitle = "";
          try {
            const parsed = JSON.parse(item.value);
            rVersion = parsed.version || "";
            rTitle = parsed.title || "";
          } catch {}
          title = `Pembaruan Catatan Rilis: ${rVersion || "Versi Baru"}`;
          desc = rTitle
            ? `Versi "${rTitle}" telah dipublikasikan ke modal Apa Yang Baru bagi pengunjung.`
            : "Informasi pembaruan dan fitur sistem diperbarui.";
          badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";
        } else if (item.key === "google_sheets_webhook_url") {
          title = "Konfigurasi Webhook Spreadsheet";
          desc = "Integrasi data pendaftaran kegiatan Google Sheets diperbarui.";
        } else if (item.key === "admin_whatsapp") {
          title = "Kontak WhatsApp Admin";
          desc = "Nomor kontak WhatsApp pusat bantuan admin diperbarui.";
        } else if (item.key === "telegram_berita_notif_enabled") {
          title = "Notifikasi Otomatis Bot Telegram";
          desc = `Pengiriman siaran berita otomatis diatur ke: ${
            item.value === "true" ? "Aktif" : "Nonaktif"
          }.`;
        }

        compiledLogs.push({
          id: `settings-${item.key}`,
          type: "system",
          title,
          description: desc,
          actor: "Admin BEM",
          timeAgo: formatTimeAgo(item.updated_at),
          rawDate: new Date(item.updated_at || 0).getTime(),
          badgeColor,
        });
      });
    }

    // Sort by latest date
    compiledLogs.sort((a, b) => b.rawDate - a.rawDate);

    const latency = Math.max(Date.now() - start, 14);

    return {
      logs: compiledLogs,
      latencyMs: latency,
    };
  } catch (err: any) {
    console.error("[monitoring-actions:fetchComprehensiveActivityLogs] Error:", err);
    return {
      logs: [],
      latencyMs: Math.max(Date.now() - start, 20),
    };
  }
}
