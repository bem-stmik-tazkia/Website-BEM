import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/auth';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rateLimit';
import { getSecret } from '@/lib/secrets';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Schema validation untuk form saran & aduan publik
const saranSchema = z.object({
  nama: z
    .string()
    .trim()
    .max(150, "Nama pengirim maksimal 150 karakter")
    .optional()
    .nullable(),
  kategori: z
    .string()
    .trim()
    .min(1, "Kategori wajib diisi")
    .max(100, "Kategori maksimal 100 karakter"),
  deskripsi: z
    .string()
    .trim()
    .min(1, "Pesan saran atau aduan tidak boleh kosong")
    .max(5000, "Pesan saran atau aduan maksimal 5000 karakter"),
  turnstileToken: z
    .string()
    .min(1, "Token verifikasi captcha wajib disertakan"),
});

export async function POST(req: Request) {
  try {
    // 0a. Rate Limiting per IP: Maksimal 5 pengiriman per 10 menit per IP (x-vercel-forwarded-for)
    const clientIp = getClientIp(req);
    const ipRateLimit = await checkRateLimit(`saran_ip_${clientIp}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000, // 10 menit
    });

    if (!ipRateLimit.success) {
      return createRateLimitResponse(
        "Terlalu banyak pengiriman pesan dari perangkat Anda. Silakan tunggu 10 menit sebelum mengirim saran baru.",
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
        "Batas penerimaan aspirasi harian telah tercapai. Silakan coba kembali besok.",
        globalRateLimit
      );
    }

    // 1. Parse dan Validasi Schema Request Body dengan Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid (harus JSON)" },
        { status: 400, headers: ipRateLimit.headers }
      );
    }

    const parseResult = saranSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Input tidak valid";
      return NextResponse.json(
        { error: firstError },
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
          { error: "Verifikasi captcha gagal. Silakan coba lagi." },
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
        { error: "Konfigurasi server belum lengkap untuk menerima aduan." },
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
        { error: "Gagal menyimpan pesan saran ke database." },
        { status: 500 }
      );
    }

    // 4. Integrasi Webhook Make / Sheets & Kredensial Notifikasi
    // Membaca kredensial rahasia dari public.app_secrets via getSecret (fallback ke env)
    const webhookUrl = await getSecret('google_sheets_webhook_url');
    const botToken = await getSecret('telegram_bot_token');
    const chatId = await getSecret('telegram_chat_id');
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

    // 5. Trigger Telegram Notification
    try {
      if (botToken && chatId) {
        const escapeHtml = (text: string) => {
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const safeNama = escapeHtml(finalNama);
        const safeKategori = escapeHtml(kategori);
        const safeDeskripsi = escapeHtml(deskripsi);
        
        const wibTime = new Date().toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB';

        let message = `🚨 <b>Pesan Baru di Kotak Saran / Aduan!</b> 🚨\n\n` +
                      `👤 <b>Pengirim:</b> ${safeNama}\n` +
                      `📂 <b>Kategori:</b> ${safeKategori}\n` +
                      `📅 <b>Waktu:</b> ${wibTime}\n` +
                      `📝 <b>Pesan:</b> \n${safeDeskripsi}\n\n`;
                      
        if (excelLink && excelLink.startsWith('http')) {
          message += `📊 <a href="${excelLink}">Lihat Rekap Spreadsheet</a>`;
        } else {
          message += `📊 <i>Link Excel belum diatur di Admin Panel</i>`;
        }
        
        const teleRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        });
        
        const teleData = await teleRes.json();
        if (!teleData.ok) {
          console.error("[saran-aduan] Telegram Error:", teleData);
        }
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

