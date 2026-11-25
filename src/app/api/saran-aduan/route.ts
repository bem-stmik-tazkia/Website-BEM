import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/auth';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rateLimit';
import { getSecret } from '@/lib/secrets';
import { sendSaranAduanNotification } from '@/lib/telegram';
import { getLocaleFromRequest, getPublicApiMessage } from '@/lib/public-api-i18n';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Schema validation untuk form saran & aduan publik
const saranSchema = z.object({
  nama: z
    .string()
    .trim()
    .max(150)
    .optional()
    .nullable(),
  kategori: z
    .string()
    .trim()
    .min(1)
    .max(100),
  deskripsi: z
    .string()
    .trim()
    .min(1)
    .max(5000),
  turnstileToken: z
    .string()
    .min(1),
  locale: z.string().max(16).optional(),
});

export async function POST(req: Request) {
  const headerLocale = getLocaleFromRequest(req);
  try {
    // 0a. Rate Limiting per IP: Maksimal 5 pengiriman per 10 menit per IP (x-vercel-forwarded-for)
    const clientIp = getClientIp(req);
    const ipRateLimit = await checkRateLimit(`saran_ip_${clientIp}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000, // 10 menit
    });

    if (!ipRateLimit.success) {
      return createRateLimitResponse(
        getPublicApiMessage(headerLocale, "saranRateLimitIp"),
        ipRateLimit
      );
    }

    // 0b. Batas global harian: Maksimal 200 saran per hari (anti flood global)
    const globalRateLimit = await checkRateLimit("saran_global_daily", {
      limit: 200,
      windowMs: 24 * 60 * 60 * 1000, // 24 jam
    });

    if (!globalRateLimit.success) {
      return createRateLimitResponse(
        getPublicApiMessage(headerLocale, "saranRateLimitGlobal"),
        globalRateLimit
      );
    }

    // 1. Parse dan Validasi Schema Request Body dengan Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: getPublicApiMessage(headerLocale, "invalidJson") },
        { status: 400, headers: ipRateLimit.headers }
      );
    }

    const explicitLocale =
      rawBody && typeof rawBody === "object" && "locale" in rawBody && typeof (rawBody as any).locale === "string"
        ? (rawBody as any).locale
        : null;
    const locale = getLocaleFromRequest(req, explicitLocale);

    const parseResult = saranSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "saranInvalidInput") },
        { status: 400, headers: ipRateLimit.headers }
      );
    }

    const { nama, kategori, deskripsi, turnstileToken } = parseResult.data;

    // 2. Verifikasi Turnstile Captcha
    if (!TURNSTILE_SECRET_KEY) {
      console.warn("[saran-aduan] TURNSTILE_SECRET_KEY belum diset. Melewati verifikasi captcha.");
    } else {
      const formData = new URLSearchParams();
      formData.append('secret', TURNSTILE_SECRET_KEY);
      formData.append('response', turnstileToken);

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });

      const outcome = await verifyRes.json();
      if (!outcome.success) {
        return NextResponse.json(
          { error: getPublicApiMessage(locale, "saranCaptchaFailed") },
          { status: 400, headers: ipRateLimit.headers }
        );
      }
    }

    // 3. Simpan ke database Supabase menggunakan Service Role Client (karena anon tidak diizinkan direct insert)
    let supabase;
    try {
      supabase = getServiceRoleClient();
    } catch (confErr: any) {
      console.error("[saran-aduan] Supabase config error:", confErr.message);
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "saranConfigError") },
        { status: 500 }
      );
    }

    const finalNama = nama && nama.trim() !== "" ? nama.trim() : "Mahasiswa / Anonim";
    const finalSubjek = "Laporan " + (kategori ? kategori.toUpperCase() : "BARU");

    const { error: insertError } = await supabase
      .from("saran_aduan")
      .insert([{
        nama: finalNama,
        kategori,
        pesan: deskripsi,
        subjek: finalSubjek,
      }]);

    if (insertError) {
      console.error("[saran-aduan] Supabase insert error:", insertError.message);
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "saranSaveError") },
        { status: 500 }
      );
    }

    // 4. Integrasi Webhook Make / Sheets & Kredensial Notifikasi
    const webhookUrl = await getSecret('google_sheets_webhook_url');
    const excelLink = await getSecret('excel_view_url');

    try {
      // A. Trigger Webhook Google Sheets
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: finalNama,
            kategori,
            deskripsi,
            tanggal: new Date().toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            }) + ' WIB'
          })
        });
      }
    } catch (webhookErr) {
      console.error("[saran-aduan] Gagal mengirim ke Google Sheets Webhook:", webhookErr);
    }

    // 5. Trigger Telegram Notification (Internal & Teknis)
    try {
      const teleRes = await sendSaranAduanNotification({
        nama: finalNama,
        kategori,
        deskripsi,
        excelLink,
      });
      if (!teleRes.ok && teleRes.error) {
        console.warn("[saran-aduan] Telegram notify info:", teleRes.error);
      }
    } catch (teleErr) {
      console.error("[saran-aduan] Gagal mengirim notif Telegram:", teleErr);
    }

    return NextResponse.json({ success: true }, { headers: ipRateLimit.headers });
  } catch (error: any) {
    console.error("[saran-aduan] Saran API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}

