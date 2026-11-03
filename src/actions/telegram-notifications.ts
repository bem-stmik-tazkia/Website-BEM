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
    return await sendArticleSubmittedNotification(payload);
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
    const adminName =
      user?.user_metadata?.full_name ||
      user?.email ||
      payload.adminName ||
      "Administrator BEM";

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
    const adminName =
      user?.user_metadata?.full_name ||
      user?.email ||
      payload.adminName ||
      "Administrator BEM";

    return await sendMaintenanceModeNotification({
      ...payload,
      adminName,
    });
  } catch (err: any) {
    console.error("[notifyMaintenanceMode] Exception:", err);
    return { ok: false, error: err.message };
  }
}

