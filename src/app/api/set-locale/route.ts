import { NextRequest, NextResponse } from "next/server";

const VALID_LOCALES = ["en", "id", "ar", "ja", "fr"];

export async function POST(request: NextRequest) {
  const { locale } = await request.json();

  if (!VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  // Set locale cookie — maxAge 1 year
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
