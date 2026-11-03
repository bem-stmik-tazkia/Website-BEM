"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { sanitizeNextPath } from "@/utils/auth-url";

export default function MasukPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Bersihkan hash fragment dari URL (mis. #error=server_error dari Supabase)
    // agar tidak terlihat di address bar dan tidak bisa dibaca JS lain
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const params = new URLSearchParams(window.location.search);
    const hasError = params.has("error") || params.has("error_code");

    if (hasError) {
      // Seluruh kegagalan menampilkan SATU pesan generik tanpa membocorkan detail penyebab
      setError("Login gagal, silakan coba kembali.");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next");
    const safeNext = sanitizeNextPath(nextParam, window.location.origin, ["/dashboard"]);
    const targetNext = safeNext || "/dashboard/artikel";

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetNext)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      console.error("[masuk] Google sign in error:", signInError.message);
      setError("Login gagal, silakan coba kembali.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-variant/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Card Form */}
      <div className="w-full max-w-md bg-surface rounded-[2rem] shadow-xl p-8 sm:p-10 relative z-10 border border-outline-variant/20 animate-fade-up">
        {/* Tombol Kembali ke Beranda */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Beranda
        </Link>

        {/* Header Portal */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center p-3 mb-5 shadow-inner">
            <Image
              src="/images/logo.webp"
              alt="Logo BEM STMIK Tazkia"
              width={80}
              height={80}
              className="w-full h-full object-contain hover:scale-105 transition-transform"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-on-background mb-1.5">
            Portal Artikel Mahasiswa
          </h1>
          <p className="text-sm text-on-surface-variant">
            Tulis dan kelola artikel mahasiswa Anda.
          </p>
        </div>

        {/* Kotak Pesan Error Generik */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm flex items-start gap-2.5 animate-fade-in mb-6">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Panduan akun kampus */}
        <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
          <p className="text-sm text-on-surface-variant leading-snug">
            Gunakan akun Google kampus kamu untuk masuk ke portal ini.
          </p>
        </div>

        {/* Tombol Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-surface border border-outline-variant/40 text-on-background font-bold py-3.5 px-6 rounded-xl hover:bg-surface-variant/30 hover:border-outline-variant transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[20px] animate-spin text-primary">
              progress_activity
            </span>
          ) : (
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Masuk dengan Akun Google
        </button>

        <p className="text-[11px] text-center text-on-surface-variant/70 mt-6">
          Dengan masuk, Anda menyetujui pedoman penulisan dan kebijakan publikasi BEM STMIK Tazkia.
        </p>
      </div>
    </main>
  );
}
