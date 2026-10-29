import { NextResponse } from 'next/server';

/**
 * Endpoint verifikasi subscriber dinonaktifkan sementara
 * sejalan dengan penonaktifan fitur pendaftaran subscriber.
 */
export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fitur Dinonaktifkan - BEM STMIK Tazkia</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
        h1 { color: #d97706; font-size: 22px; margin-bottom: 10px; }
        p { color: #64748b; font-size: 14px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
        <h1>Fitur Belum Tersedia</h1>
        <p>Layanan berlangganan kalender dan info BEM sedang dalam tahap pengembangan dan saat ini belum diaktifkan.</p>
      </div>
    </body>
    </html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
