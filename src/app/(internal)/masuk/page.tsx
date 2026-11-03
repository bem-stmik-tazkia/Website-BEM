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
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width={20}
              height={20}
              className="shrink-0"
            />
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
