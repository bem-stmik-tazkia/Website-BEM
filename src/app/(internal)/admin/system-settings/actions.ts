"use server";

import { requireAdmin, getServiceRoleClient } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { ALLOWED_SECRET_KEYS, AppSecretKey } from "@/lib/secrets";

export interface SecretStatusInfo {
  key: AppSecretKey;
  isSet: boolean;
  source: 'database' | 'none';
  updatedAt: string | null;
  updatedBy: string | null;
}

export type SecretStatusMap = Record<AppSecretKey, SecretStatusInfo>;

/**
 * Validasi ketat format masing-masing rahasia aplikasi.
 */
function validateSecretFormat(key: AppSecretKey, value: string): { valid: boolean; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: "Nilai rahasia tidak boleh kosong." };
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: "Panjang nilai melebihi batas wajar (maksimal 1000 karakter)." };
  }

  switch (key) {
    case 'telegram_bot_token': {
      // Pola token bot Telegram: <id_numerik>:<string_token_alphanumeric>
      const tokenRegex = /^\d{8,15}:[A-Za-z0-9_-]{30,50}$/;
      if (!tokenRegex.test(trimmed)) {
        return {
          valid: false,
          error: "Format Token Bot Telegram tidak valid (harus sesuai format: <angka_id>:<token_alphanumeric>).",
        };
      }
      return { valid: true };
    }

    case 'telegram_chat_id': {
      // Chat ID numerik (bisa negatif untuk grup/channel supergroup, contoh: -1001234567890)
      const chatIdRegex = /^-?\d+$/;
      if (!chatIdRegex.test(trimmed)) {
        return {
          valid: false,
          error: "Chat ID Telegram harus berupa angka numerik bulat (contoh: 123456789 atau -1001234567890).",
        };
      }
      return { valid: true };
    }

    case 'google_sheets_webhook_url': {
      // Wajib HTTPS dengan host persis milik Make memakai pencocokan host === domain atau endsWith('.'+domain)
      try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:') {
          return { valid: false, error: "URL Webhook Make wajib menggunakan protokol HTTPS (https://)." };
        }
        if (url.username || url.password) {
          return { valid: false, error: "URL Webhook tidak boleh mengandung kredensial pengguna (username/password)." };
        }
        if (url.port && url.port !== '443') {
          return { valid: false, error: "URL Webhook tidak boleh menggunakan port non-standar." };
        }
        const domain = 'make.com';
        const host = url.hostname.toLowerCase();
        const isMakeHost = host === domain || host.endsWith('.' + domain);
        if (!isMakeHost) {
          return {
            valid: false,
            error: "URL Webhook harus memiliki hostname resmi Make (contoh: https://hook.eu1.make.com/... atau https://hook.us1.make.com/...).",
          };
        }
        return { valid: true };
      } catch {
        return { valid: false, error: "URL Webhook Make tidak valid." };
      }
    }

    case 'excel_view_url': {
      // Wajib HTTPS dan host docs.google.com (exact atau subdomain docs.google.com)
      try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:') {
          return { valid: false, error: "URL Spreadsheet rekap wajib menggunakan protokol HTTPS (https://)." };
        }
        if (url.username || url.password) {
          return { valid: false, error: "URL Spreadsheet tidak boleh mengandung kredensial pengguna." };
        }
        if (url.port && url.port !== '443') {
          return { valid: false, error: "URL Spreadsheet tidak boleh menggunakan port non-standar." };
        }
        const domain = 'docs.google.com';
        const host = url.hostname.toLowerCase();
        const isDocsHost = host === domain || host.endsWith('.' + domain);
        if (!isDocsHost) {
          return {
            valid: false,
            error: "URL Spreadsheet harus mengarah ke Google Docs/Sheets (docs.google.com).",
          };
        }
        return { valid: true };
      } catch {
        return { valid: false, error: "URL Spreadsheet tidak valid." };
      }
    }

    default:
      return { valid: false, error: "Key rahasia tidak dikenali." };
  }
}

/**
 * Server Action: Menyimpan atau memperbarui kredensial rahasia ke public.app_secrets.
 * Dilindungi oleh requireAdmin() dan rate limit.
 */
export async function setSecret(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();

    // 1. Validasi Allowlist Key
    if (!ALLOWED_SECRET_KEYS.includes(key as AppSecretKey)) {
      return { success: false, error: "Key rahasia tidak sah." };
    }
    const secretKey = key as AppSecretKey;

    // 2. Terapkan Rate Limit per Admin
    const adminIdentifier = admin.user.email || 'admin_user';
    const rateLimitRes = await checkRateLimit(`admin_set_secret_${adminIdentifier}`, {
      limit: 10,
      windowMs: 60 * 1000, // 10 request per menit
    });

    if (!rateLimitRes.success) {
      return {
        success: false,
        error: "Terlalu banyak permintaan perubahan pengaturan rahasia. Silakan tunggu 1 menit.",
      };
    }

    // 3. Validasi Format
    const validation = validateSecretFormat(secretKey, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 4. Simpan ke database via Service Role (Bypass RLS default-deny)
    const supabase = getServiceRoleClient();
    const { error: upsertError } = await supabase
      .from('app_secrets')
      .upsert(
        {
          key: secretKey,
          value: value.trim(),
          updated_at: new Date().toISOString(),
          updated_by: admin.user.email || 'admin',
        },
        { onConflict: 'key' }
      );

    if (upsertError) {
      console.error("[setSecret] Database upsert error:", upsertError.message);
      return { success: false, error: "Gagal menyimpan rahasia ke database." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[setSecret] Server action error:", err);
    return { success: false, error: err.message || "Terjadi kesalahan internal server." };
  }
}

/**
 * Server Action: Mengambil status terisi/kosong untuk semua key yang diizinkan.
 * PENTING: Fungsi ini HANYA mengembalikan boolean 'isSet', tanggal 'updatedAt',
 * dan 'updatedBy'. Nilai sebenarnya ('value') TIDAK PERNAH dikembalikan ke client!
 */
export async function getSecretStatus(): Promise<SecretStatusMap> {
  await requireAdmin();

  const supabase = getServiceRoleClient();
  // Hanya ambil metadata, JANGAN ambil kolom 'value'
  const { data, error } = await supabase
    .from('app_secrets')
    .select('key, updated_at, updated_by');

  const dbMap: Record<string, { updatedAt: string; updatedBy: string | null }> = {};
  if (!error && data) {
    for (const row of data) {
      dbMap[row.key] = {
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
      };
    }
  }

  const result = {} as SecretStatusMap;

  for (const key of ALLOWED_SECRET_KEYS) {
    const dbRow = dbMap[key];

    if (dbRow) {
      result[key] = {
        key,
        isSet: true,
        source: 'database',
        updatedAt: dbRow.updatedAt,
        updatedBy: dbRow.updatedBy,
      };
    } else {
      result[key] = {
        key,
        isSet: false,
        source: 'none',
        updatedAt: null,
        updatedBy: null,
      };
    }
  }

  return result;
}
