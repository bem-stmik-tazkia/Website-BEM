import React from "react";

export default function LoadingDokumentasi() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-20 font-sans overflow-x-hidden w-full animate-pulse">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">

        {/* Header Skeleton */}
        <header className="mb-6 md:mb-10 text-left">
          <div className="h-10 md:h-12 w-64 md:w-96 bg-surface-variant/80 rounded-2xl mb-2 md:mb-4"></div>
          <div className="h-4 md:h-5 w-full max-w-2xl bg-surface-variant/60 rounded-lg"></div>
        </header>

        {/* Search & Filter Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <div className="flex-1 h-12 md:h-14 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm"></div>
          <div className="w-full sm:w-48 h-12 md:h-14 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm"></div>
        </div>

        {/* Category Tags Skeleton */}
        <div className="flex items-center gap-2 mb-8 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((cat) => (
            <div key={cat} className="h-9 w-20 md:w-28 bg-surface-variant/50 rounded-full shrink-0"></div>
          ))}
        </div>

        {/* Masonry Grid Skeleton */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {/* Create skeleton cards of varying heights to simulate masonry */}
          
          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[300px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-16 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-3/4 h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[450px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-20 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-4/5 h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[250px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-12 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-2/3 h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[350px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-16 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-full h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[280px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-14 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-3/4 h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="break-inside-avoid">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 h-[400px] relative">
              <div className="absolute inset-0 bg-surface-variant/60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="w-24 h-4 bg-white/40 rounded-full mb-2"></div>
                <div className="w-5/6 h-5 bg-white/50 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
