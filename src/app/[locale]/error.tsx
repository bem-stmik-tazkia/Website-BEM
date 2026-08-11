"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiRefreshCw } from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] bg-background flex items-center justify-center pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-xl w-full bg-white border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center shadow-xl relative z-10 flex flex-col items-center justify-center animate-fade-up border-t-4 border-t-red-500">
          
          {/* We can reuse the 404 lottie or a generic warning */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 relative -my-4 mb-2">
            <DotLottieReact
              src="/animations/404 error.lottie"
              loop
              autoplay
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-background mb-2">
            Terjadi Kesalahan Sistem
          </h1>
          
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6 max-w-md leading-relaxed">
            Ups! Terjadi kendala teknis saat memproses permintaan Anda. Tim kami telah diberitahu dan sedang memperbaikinya.
            <br/><br/>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-mono break-words border border-red-100">
              {error.message || "Unknown Runtime Error"}
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => reset()}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-on-surface bg-surface-variant/40 hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
            >
              <FiRefreshCw size={16} /> Coba Lagi
            </button>

            <Link
              href="/"
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FiHome size={16} /> Ke Beranda
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
