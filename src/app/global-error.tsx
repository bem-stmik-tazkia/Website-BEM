"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global crash caught by root boundary:", error);
  }, [error]);

  return (
    <html lang="id">
      <head>
        <title>Terjadi Kendala Sistem - BEM STMIK Tazkia</title>
      </head>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kendala Sistem</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Layanan sedang mengalami gangguan teknis sementara. Silakan coba muat ulang halaman.
          </p>

          {process.env.NODE_ENV !== "production" ? (
            <p className="text-xs bg-red-50 text-red-600 p-3 rounded font-mono mb-4 text-left overflow-auto max-h-32">
              {error.message}
            </p>
          ) : error.digest ? (
            <p className="text-xs text-slate-400 font-mono mb-4">
              Kode Insiden: {error.digest}
            </p>
          ) : null}

          <button
            onClick={() => reset()}
            className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}

