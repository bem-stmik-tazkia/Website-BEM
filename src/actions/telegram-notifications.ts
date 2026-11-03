"use server";

import {
  sendArticleSubmittedNotification,
  sendArticleModeratedNotification,
  sendMaintenanceModeNotification,
  ArticleSubmittedPayload,
  ArticleModeratedPayload,
  MaintenanceModePayload,
} from "@/lib/telegram";
import { createClient } from "@/utils/supabase/server";

/**
 * Notifikasi saat artikel baru atau revisi diajukan oleh mahasiswa.
 */
export async function notifyArticleSubmitted(payload: ArticleSubmittedPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let authorName = payload.authorName || user?.user_metadata?.full_name;
    if ((!authorName || authorName.includes("@")) && user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) authorName = profile.full_name;
    }
    return await sendArticleSubmittedNotification({
      ...payload,
      authorName: authorName || "Mahasiswa STMIK Tazkia",
    });
  } catch (err: any) {
    console.error("[notifyArticleSubmitted] Exception:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Notifikasi audit saat artikel disetujui, ditolak (minta revisi), atau di-unpublish.
 */
export async function notifyArticleModerated(payload: ArticleModeratedPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let adminName = user?.user_metadata?.full_name;
    if (!adminName && user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) adminName = profile.full_name;
    }
    if (!adminName) adminName = payload.adminName || user?.email || "Administrator BEM";

    return await sendArticleModeratedNotification({
      ...payload,
      adminName,
    });
  } catch (err: any) {
    console.error("[notifyArticleModerated] Exception:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Notifikasi saat mode pemeliharaan (maintenance) dinyalakan atau dimatikan (beres).
 */
export async function notifyMaintenanceMode(payload: MaintenanceModePayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let adminName = user?.user_metadata?.full_name;
    if (!adminName && user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) adminName = profile.full_name;
    }
    if (!adminName) adminName = payload.adminName || user?.email || "Administrator BEM";

    return await sendMaintenanceModeNotification({
      ...payload,
      adminName,
    });
  } catch (err: any) {
    console.error("[notifyMaintenanceMode] Exception:", err);
    return { ok: false, error: err.message };
  }
}

