import { NextResponse } from "next/server";

// POST /api/maintenance/bypass
// Dipanggil setelah Konami code diinput di halaman publik atau maintenance.
// D13: DEFAULT_SECRET dihapus total. Hanya membaca dari env MAINTENANCE_BYPASS_SECRET. Fail closed jika env tidak ada.
export async function POST() {
  const secret = process.env.MAINTENANCE_BYPASS_SECRET;

  // Fail closed: jika secret belum dikonfigurasi di env, tolak request
  if (!secret) {
    console.error("[bypass] MAINTENANCE_BYPASS_SECRET tidak dikonfigurasi di environment. Menolak request (fail closed).");
    return NextResponse.json(
      { error: "Service unavailable: bypass secret not configured" },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ success: true });

  // Cookie bypass berlaku 8 jam
  // httpOnly: false diperlukan agar client-side JS (Konami listener) dapat mendeteksi status bypass
  response.cookies.set("maintenance_bypass", secret, {
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

// DELETE /api/maintenance/bypass
// Hapus bypass cookie (logout dari bypass)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("maintenance_bypass");
  return response;
}
