import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        // TODO: In production, verify that the user is logged in as Admin here
        
        const body = await req.json();
        const { title, type, date, location, description } = body;

        // 1. Ambil semua email subscriber yang VERIFIED
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('email')
            .eq('status', 'VERIFIED');

        if (error) {
            console.error("Gagal mengambil subscriber:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const emails = subscribers.map(s => s.email);

        // 2. Siapkan konten email
        const typeLabel = type === 'volunteer' ? 'Open Recruitment' : 'Agenda BEM';
        const formattedDate = date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-';
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="background-color: #1a56db; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0;">Info BEM STMIK Tazkia</h2>
                </div>
                <div style="padding: 20px;">
                    <span style="background-color: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">${typeLabel}</span>
                    <h3 style="color: #111827; margin-top: 15px;">${title}</h3>
                    
                    <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${description}</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 5px 0;"><strong>📅 Tanggal:</strong> ${formattedDate}</p>
                        <p style="margin: 5px 0;"><strong>📍 Lokasi:</strong> ${location || '-'}</p>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://bem.stmik.tazkia.ac.id" style="background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Lihat Selengkapnya di Website</a>
                    </div>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                    Kamu menerima email ini karena telah berlangganan info BEM. 
                    <a href="https://bem.stmik.tazkia.ac.id/unsubscribe" style="color: #999;">Berhenti Berlangganan</a>
                </p>
            </div>
        `;

        // 3. Kirim via Resend Batch API (max 100 per request)
        // Note: For free tier with unverified domain, this will only reach your own registered email.
        const BATCH_SIZE = 90;
        let sentCount = 0;

        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);
            const payload = batch.map(email => ({
                from: 'onboarding@resend.dev', // Ganti dengan email domain verified nanti
                to: email,
                subject: `📢 [Info BEM] ${title}`,
                html: htmlContent
            }));

            try {
                await resend.batch.send(payload);
                sentCount += batch.length;
            } catch (err) {
                console.error("Batch send error:", err);
            }
        }

        return NextResponse.json({ success: true, count: sentCount });

    } catch (error: any) {
        console.error("Blast API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
