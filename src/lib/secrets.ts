import 'server-only';
import { getServiceRoleClient } from '@/lib/auth';

export type AppSecretKey =
  | 'telegram_bot_token'
  | 'telegram_chat_id'
  | 'google_sheets_webhook_url'
  | 'excel_view_url';

export const ALLOWED_SECRET_KEYS: readonly AppSecretKey[] = [
  'telegram_bot_token',
  'telegram_chat_id',
  'google_sheets_webhook_url',
  'excel_view_url',
] as const;

/**
 * Server-only helper untuk membaca kredensial rahasia aplikasi.
 * Satu-satunya sumber kebenaran (single source of truth) adalah tabel public.app_secrets
 * yang diakses via service_role client.
 *
 * Catatan Keamanan:
 * - Tidak ada fallback ke environment variables.
 * - Tidak ada fallback ke tabel system_settings.
 * - Jika query gagal atau kunci belum disetel, kembalikan string kosong.
 * - Log peringatan tidak mencantumkan nilai rahasia apa pun.
 * - Berkas ini dilindungi oleh import 'server-only' agar tidak bisa di-bundle ke client.
 */
export async function getSecret(key: AppSecretKey): Promise<string> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('app_secrets')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`[getSecret] Gagal membaca kunci rahasia '${key}':`, error.message);
      return '';
    }

    if (data?.value && data.value.trim() !== '') {
      return data.value.trim();
    }
  } catch (err: any) {
    console.warn(`[getSecret] Error saat mengakses database untuk kunci '${key}':`, err?.message || 'Unknown error');
  }

  return '';
}

