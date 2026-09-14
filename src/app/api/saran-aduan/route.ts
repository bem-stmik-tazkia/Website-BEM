import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
        const { error } = await supabase
            .from("saran_aduan")
            .insert([{ nama: finalNama, kategori, deskripsi }]);

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
        }

        // 3. Trigger Webhook (Optional, fail-safe)
        try {
            const { data: settingData } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'google_sheets_webhook_url')
                .maybeSingle();
            
            if (settingData && settingData.value) {
                // Call the existing webhook API (internal fetch is fine, but since we are server side, we can just fetch the target URL directly)
                await fetch(settingData.value, {
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
            console.error("Gagal mengirim ke Excel Webhook:", webhookErr);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Saran API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
