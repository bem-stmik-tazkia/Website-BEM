import React from "react";

export default function LoadingAgendaDetail() {
  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans animate-pulse">
      
      {/* ── BACK BUTTON ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 mb-4 md:mb-6">
        <div className="w-24 h-5 bg-surface-variant/80 rounded-md"></div>
      </section>

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 mb-6 md:mb-10">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/8] min-h-[260px] sm:min-h-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-outline-variant/20 flex flex-col justify-end bg-surface-variant">
          
          {/* Hero Content */}
          <div className="relative z-10 p-4 md:p-8 w-full space-y-4">
            <div className="w-24 h-6 md:h-8 bg-white/40 rounded-full mb-2 md:mb-4"></div>
            
            <div className="w-full max-w-2xl h-10 md:h-14 bg-white/50 rounded-xl mb-2 md:mb-4"></div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-3">
              <div className="w-48 h-6 bg-white/40 rounded-md"></div>
              <div className="w-32 h-6 bg-white/40 rounded-md"></div>
              <div className="w-40 h-6 bg-white/40 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* ── ACTION BOX ───────────────────── */}
        <div className="mt-4 md:mt-6 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border bg-surface border-outline-variant/30">
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-variant/80 shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="w-48 h-6 bg-surface-variant/80 rounded-md"></div>
              <div className="w-64 h-4 bg-surface-variant/60 rounded-md"></div>
            </div>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
            <div className="w-full sm:w-32 h-12 bg-surface-variant/80 rounded-xl"></div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Deskripsi & Dokumentasi */}
        <div className="flex flex-col gap-6 md:gap-8 lg:col-span-2">
          
          {/* Description Box */}
          <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-8 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-primary/20 rounded-full"></div>
              <div className="w-32 h-6 bg-surface-variant/80 rounded-md"></div>
            </div>
            
            <div className="space-y-3">
              <div className="w-full h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-[95%] h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-[90%] h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-[85%] h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-[92%] h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-3/4 h-5 bg-surface-variant/60 rounded-md mt-6"></div>
              <div className="w-[88%] h-5 bg-surface-variant/60 rounded-md"></div>
            </div>
          </div>

          {/* Gallery Box Skeleton */}
          <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="w-48 h-6 bg-surface-variant/80 rounded-md"></div>
              <div className="w-20 h-8 bg-surface-variant/60 rounded-lg"></div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-outline-variant/20 aspect-square bg-surface-variant/60"></div>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar / Speaker Card */}
        <div className="hidden lg:flex flex-col gap-6 lg:col-span-1">
          <div className="w-32 h-6 bg-secondary/20 rounded-full mb-2"></div>
          
          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-surface-variant/80 mb-4 border-4 border-white shadow-md"></div>
            <div className="w-40 h-6 bg-surface-variant/80 rounded-md mb-2"></div>
            <div className="w-24 h-4 bg-surface-variant/60 rounded-md"></div>
          </div>
          
          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-surface-variant/80 mb-4 border-4 border-white shadow-md"></div>
            <div className="w-40 h-6 bg-surface-variant/80 rounded-md mb-2"></div>
            <div className="w-24 h-4 bg-surface-variant/60 rounded-md"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
