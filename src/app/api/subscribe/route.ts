import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Gunakan SERVICE_ROLE_KEY di server agar bisa bypass RLS. Jika tidak ada, fallback ke ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, turnstileToken } = body;

        if (!email || !turnstileToken) {
            return NextResponse.json({ error: "Email dan Captcha wajib diisi" }, { status: 400 });
        }

        if (!email.endsWith("@student.stmik.tazkia.ac.id") && !email.endsWith("@stmik.tazkia.ac.id")) {
            return NextResponse.json({ error: "Gunakan email kampus yang valid (@student.stmik.tazkia.ac.id atau @stmik.tazkia.ac.id)" }, { status: 400 });
        }

        // 1. Verify Turnstile (Bypass jika secret key tidak diset / mode development)
        if (TURNSTILE_SECRET_KEY) {
            const formData = new URLSearchParams();
            formData.append('secret', TURNSTILE_SECRET_KEY);
            formData.append('response', turnstileToken);

            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: formData,
            });

            const outcome = await verifyRes.json();
            if (!outcome.success) {
                return NextResponse.json({ error: "Verifikasi Captcha gagal. Coba lagi." }, { status: 400 });
            }
        }

        // 2. Check if email already exists
        const { data: existingUser } = await supabase
            .from('subscribers')
            .select('status, verification_token')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            if (existingUser.status === 'VERIFIED') {
                return NextResponse.json({ error: "Email ini sudah berlangganan!" }, { status: 400 });
            }
            if (existingUser.status === 'UNSUBSCRIBED') {
                // If they unsubscribed before, we'll just update them to UNVERIFIED and send new link
            }
        }

        // 3. Generate Token & Expiration
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // 4. Save to Database
        const { error: dbError } = await supabase
            .from('subscribers')
            .upsert({
                email,
                status: 'UNVERIFIED',
                verification_token: token,
                token_expires_at: expiresAt.toISOString()
            }, { onConflict: 'email' });

        if (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json({ error: "Gagal menyimpan data ke server." }, { status: 500 });
        }

        // 5. Send Email via Resend
        // NOTE: In Resend free tier (unverified domain), you can only send emails to your own registered email.
        // For production, you must verify your domain in Resend dashboard.
        const verifyLink = `${req.headers.get('origin') || 'https://bem.stmik.tazkia.ac.id'}/api/verify-subscribe?token=${token}`;
        
        try {
            const { data, error: resendError } = await resend.emails.send({
                from: 'onboarding@resend.dev', // Default testing email from Resend
                to: email, // If unverified domain, this will only work if email == your resend account email.
                subject: 'Verifikasi Email Berlangganan BEM',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #1a56db;">Verifikasi Berlangganan</h2>
                        <p>Halo!</p>
                        <p>Terima kasih telah mendaftar untuk mendapatkan info terbaru dari BEM STMIK Tazkia. Untuk memastikan ini benar emailmu, silakan klik tombol di bawah ini:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verifyLink}" style="background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verifikasi Email Saya</a>
                        </div>
                        <p style="font-size: 12px; color: #666;">Link ini hanya berlaku selama 15 menit. Jika kamu tidak pernah mendaftar, abaikan saja email ini.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #999; text-align: center;">BEM STMIK Tazkia</p>
                    </div>
                `
            });

            if (resendError) {
                console.error("Resend API Error:", resendError);
                return NextResponse.json({ error: "Gagal mengirim email verifikasi. Pastikan konfigurasi email benar." }, { status: 500 });
            }
        } catch (emailError) {
            console.error("Resend error:", emailError);
            // Even if email fails, we don't throw 500 so user knows, but in testing they might hit sandbox limits
            return NextResponse.json({ error: "Gagal mengirim email verifikasi. Terjadi kesalahan internal." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Subscribe API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
