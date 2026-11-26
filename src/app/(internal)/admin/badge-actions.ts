"use server";

import { requireAdmin, getServiceRoleClient } from "@/lib/auth";

export interface AdminSidebarBadges {
  pendingModeration: number;
  pendingRegistrations: number;
  unreadSaran: number;
}

/**
 * Server Action aman untuk mengambil jumlah antrean kerja admin secara real-time
 * (Moderasi artikel/revisi pending, Pendaftar kegiatan pending, Kotak saran baru).
 */
export async function fetchAdminSidebarBadges(
  lastViewedSaranIso?: string
): Promise<AdminSidebarBadges> {
  try {
    await requireAdmin();
    const service = getServiceRoleClient();
    const saranCutoff =
      lastViewedSaranIso ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [artsRes, revsRes, appsRes, saranRes] = await Promise.all([
      service
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      service
        .from("article_revisions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      service
        .from("volunteer_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      service
        .from("saran_aduan")
        .select("*", { count: "exact", head: true })
        .gt("created_at", saranCutoff),
    ]);

    return {
      pendingModeration: (artsRes.count || 0) + (revsRes.count || 0),
      pendingRegistrations: appsRes.count || 0,
      unreadSaran: saranRes.count || 0,
    };
  } catch (err) {
    console.warn("[fetchAdminSidebarBadges] Error:", err);
    return {
      pendingModeration: 0,
      pendingRegistrations: 0,
      unreadSaran: 0,
    };
  }
}
