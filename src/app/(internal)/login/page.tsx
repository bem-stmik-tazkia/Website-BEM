"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";

const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Akses ditolak. Akun Google Anda tidak terdaftar sebagai administrator BEM.",
  auth_failed: "Gagal memproses autentikasi. Silakan coba masuk kembali.",
  session_expired: "Sesi login Anda telah berakhir. Silakan masuk kembali.",
  access_denied: "Permintaan login dibatalkan atau ditolak.",
  rate_limited: "Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.",
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verifikasi proteksi Konami Code:
    // Halaman login TIDAK boleh diakses dengan mengetik URL secara langsung.
    // Pengguna harus sudah memasukkan Konami Code (sessionStorage '_bk' === '1' atau cookie 'maintenance_bypass')
    const hasSessionPass = typeof window !== "undefined" && sessionStorage.getItem("_bk") === "1";
    const hasCookiePass = typeof document !== "undefined" && document.cookie.split(";").some((c) => c.trim().startsWith("maintenance_bypass="));

    if (!hasSessionPass && !hasCookiePass) {
      // Jika tidak lolos verifikasi Konami, kembalikan langsung ke halaman utama
      router.replace("/");
    } else {
      setIsUnlocked(true);
    }
  }, [router]);

  useEffect(() => {
    // Sanitasi dan pemetaan parameter error untuk mencegah Information Disclosure & Content Spoofing
    const params = new URLSearchParams(window.location.search);
    const errorKey = params.get('error') || params.get('error_code');

    if (errorKey) {
      const normalizedKey = errorKey.toLowerCase().trim();
      const message = KNOWN_ERROR_MESSAGES[normalizedKey] || "Terjadi kendala saat proses login. Pastikan Anda menggunakan akun yang berwenang.";
      setError(message);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next') || '/admin';

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });

    if (error) {
      console.error("Google sign in error:", error.message);
      setError("Gagal menghubungkan ke layanan Google. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <main className="min-h-screen bg-surface-variant/30 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface rounded-[2rem] shadow-xl p-8 sm:p-10 relative z-10 border border-outline-variant/20 animate-fade-up">

        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md mb-6">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center p-3 mb-5 shadow-inner">
            <Image
              src="/images/logo.webp"
              alt="Logo BEM"
              width={80}
              height={80}
              className="w-full h-full object-contain hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-2xl font-display-md text-on-background mb-1.5 font-bold">Portal Admin BEM 🛡️</h1>
          <p className="text-sm text-on-surface-variant">Masuk menggunakan akun Google pengurus BEM.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-fade-in mb-6">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <p>{error}</p>
          </div>
        )}

        {/* Admin Only Info Box */}
        <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-on-surface-variant flex items-start gap-2.5 mb-6">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">admin_panel_settings</span>
          <div>
            <p className="font-bold text-primary mb-0.5">Khusus Pengurus BEM</p>
            <p>Halaman login ini hanya untuk administrator BEM STMIK Tazkia yang terdaftar.</p>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-surface border border-outline-variant/40 text-on-background font-bold py-3.5 px-6 rounded-xl hover:bg-surface-variant/30 hover:border-outline-variant transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[20px] animate-spin text-primary">progress_activity</span>
          ) : (
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Lanjutkan dengan Akun Google
        </button>

      </div>
    </main>
  );
}
