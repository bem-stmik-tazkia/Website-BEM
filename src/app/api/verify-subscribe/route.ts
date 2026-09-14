import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse("Token tidak ditemukan.", { status: 400 });
        }

        // 1. Find subscriber by token
        const { data: subscriber, error } = await supabase
            .from('subscribers')
            .select('id, token_expires_at')
            .eq('verification_token', token)
            .maybeSingle();

        if (error || !subscriber) {
            return new NextResponse(`
                <div style="text-align: center; font-family: sans-serif; padding: 50px;">
                    <h2 style="color: red;">Verifikasi Gagal ❌</h2>
                    <p>Link tidak valid atau sudah pernah digunakan.</p>
                </div>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        // 2. Check expiration
        const expiresAt = new Date(subscriber.token_expires_at);
        if (expiresAt < new Date()) {
            return new NextResponse(`
                <div style="text-align: center; font-family: sans-serif; padding: 50px;">
                    <h2 style="color: orange;">Link Kadaluarsa ⚠️</h2>
                    <p>Link ini sudah kadaluarsa (lebih dari 15 menit). Silakan daftar ulang di website.</p>
                </div>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        // 3. Update status
        const { error: updateError } = await supabase
            .from('subscribers')
            .update({ 
                status: 'VERIFIED',
                verification_token: null, // One-time use
                token_expires_at: null
            })
            .eq('id', subscriber.id);

        if (updateError) {
            return new NextResponse("Gagal memverifikasi. Silakan coba lagi.", { status: 500 });
        }

        // 4. Return Success HTML with Calendar Link
        // For public calendar, it's an ICS link. For now we put a placeholder link that they can replace later.
        const calendarLink = "https://calendar.google.com/calendar/u/0/r?cid=kegiatan.bem@stmik.tazkia.ac.id"; // Placeholder

        const html = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verifikasi Berhasil - BEM STMIK Tazkia</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
                    .icon { font-size: 60px; margin-bottom: 20px; }
                    h1 { color: #0f172a; font-size: 24px; margin-bottom: 10px; }
                    p { color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 30px; }
                    .btn { display: inline-block; background: #1a56db; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; transition: background 0.2s; width: 100%; box-sizing: border-box; }
                    .btn:hover { background: #1e40af; }
                    .note { font-size: 12px; color: #94a3b8; margin-top: 20px; display: block; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">✅</div>
                    <h1>Email Terverifikasi!</h1>
                    <p>Selamat! Kamu sekarang sudah resmi berlangganan informasi terbaru dari BEM STMIK Tazkia.</p>
                    
                    <a href="${calendarLink}" class="btn" target="_blank">
                        📅 Subscribe Kalender BEM
                    </a>
                    
                    <span class="note">*Tombol di atas akan menyinkronkan jadwal acara BEM secara otomatis ke Google Calendar-mu.</span>
                </div>
            </body>
            </html>
        `;

        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (error) {
        console.error("Verify API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
