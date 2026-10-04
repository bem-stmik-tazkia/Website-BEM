import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Menggunakan Service Role Key agar tidak terhalang RLS (karena ini berjalan di server)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nama, kategori, deskripsi, turnstileToken } = body;

        // 1. Verify Turnstile Token
        if (!turnstileToken) {
            return NextResponse.json({ error: "Turnstile token is missing" }, { status: 400 });
        }

        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY!);
        formData.append('response', turnstileToken);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const outcome = await verifyRes.json();
        if (!outcome.success) {
            return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
        }

        // 2. Insert into Supabase
        const finalNama = nama && nama.trim() !== "" ? nama : "Mahasiswa / Anonim";
        const finalSubjek = "Laporan " + (kategori ? kategori.toUpperCase() : "BARU");
        const { error } = await supabase
            .from("saran_aduan")
            .insert([{ nama: finalNama, kategori, pesan: deskripsi, subjek: finalSubjek }]);

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: "DB Error: " + (error.message || "Failed to save feedback") }, { status: 500 });
        }

        // 3. Fetch Settings (Webhook & Telegram)
        let excelLink = "Tautan belum diatur";
        let webhookUrl = "";
        let botToken = "";
        let chatId = "";

        try {
            const { data: settingsData } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['google_sheets_webhook_url', 'excel_view_url', 'telegram_bot_token', 'telegram_chat_id']);
            
            if (settingsData) {
                const settings = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
                webhookUrl = settings['google_sheets_webhook_url'] || "";
                excelLink = settings['excel_view_url'] || process.env.NEXT_PUBLIC_EXCEL_VIEW_URL || "Tautan belum diatur";
                botToken = settings['telegram_bot_token'] || process.env.TELEGRAM_BOT_TOKEN || "";
                chatId = settings['telegram_chat_id'] || process.env.TELEGRAM_CHAT_ID || "";
            }

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
            console.error("Gagal mengirim ke Excel Webhook / Fetch Settings:", webhookErr);
        }

        // 4. Trigger Telegram Notification
        try {
            if (botToken && chatId) {
                // Menghindari error Markdown karakter khusus dari input user
                // HTML is much safer and less strict than MarkdownV2
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
                
                let message = `🚨 <b>Pesan Baru di Kotak Saran / Aduan!</b> 🚨\n\n` +
                              `👤 <b>Pengirim:</b> ${safeNama}\n` +
                              `📂 <b>Kategori:</b> ${safeKategori}\n` +
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
                    console.error("Telegram Error:", teleData);
                }
            }
        } catch (teleErr) {
            console.error("Gagal mengirim notif Telegram:", teleErr);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Saran API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
