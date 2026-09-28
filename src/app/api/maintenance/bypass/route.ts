import { NextResponse } from "next/server";

// POST /api/maintenance/bypass
// Dipanggil setelah Konami code diinput di halaman maintenance.
export async function POST() {
  const secret = process.env.MAINTENANCE_BYPASS_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Bypass not configured" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });

  // Cookie bypass berlaku 8 jam
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
