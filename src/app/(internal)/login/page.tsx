"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an error in the URL (e.g. from callback or domain restriction)
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    const errorDesc = params.get('error_description');

    if (errorMsg || errorDesc) {
      setError(errorDesc || errorMsg || "Terjadi kesalahan saat login.");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next') || '/dashboard';

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: {
          prompt: 'consent select_account',
        },
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-display-md text-on-background mb-1.5 font-bold">Selamat Datang 👋</h1>
          <p className="text-sm text-on-surface-variant">Silakan masuk menggunakan email kampus.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-fade-in mb-6">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <p>{error}</p>
          </div>
        )}

        {/* Campus Email Info Box */}
        <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-on-surface-variant flex items-start gap-2.5 mb-6">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">info</span>
          <div>
            <p className="font-bold text-primary mb-0.5">Khusus Mahasiswa</p>
            <p>Gunakan email resmi kampus saat melakukan login Google.</p>
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
            <img src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="shrink-0" />
          )}
          Lanjutkan dengan Akun Google
        </button>

      </div>
    </main>
  );
}
