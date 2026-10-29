import { NextResponse } from 'next/server';

/**
 * Endpoint pendaftaran subscriber dinonaktifkan secara total di backend
 * sejalan dengan status UI frontend (Coming Soon / Sedang Dalam Pengembangan).
 * Menutup celah eksploitasi pengiriman email atau pengisian database oleh pihak luar.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Fitur berlangganan sedang dalam tahap pengembangan dan saat ini dinonaktifkan." },
    { status: 503 }
  );
}
