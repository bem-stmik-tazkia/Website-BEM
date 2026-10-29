"use server";

import { requireAdmin } from "@/lib/auth";
import { getSecret } from "@/lib/secrets";

/**
 * Mengambil EXCEL_VIEW_URL secara aman dari app_secrets (fallback ke env).
 * Hanya dapat diakses oleh admin terverifikasi (requireAdmin).
 * URL ini mengarah ke Google Sheets rekap aduan yang memuat data pribadi mahasiswa.
 */
export async function getExcelViewUrl(): Promise<string | null> {
  await requireAdmin();
  const secret = await getSecret('excel_view_url');
  return secret || null;
}
