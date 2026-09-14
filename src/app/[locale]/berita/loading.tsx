import React from "react";

export default function LoadingBerita() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-32 font-sans overflow-x-hidden w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">
        
        {/* Header Skeleton */}
        <header className="mb-8 md:mb-10 text-left animate-pulse">
          <div className="h-12 md:h-14 w-64 md:w-96 bg-surface-variant/80 rounded-2xl mb-4"></div>
          <div className="h-5 md:h-6 w-full max-w-2xl bg-surface-variant/60 rounded-lg"></div>
        </header>

        {/* Search & Filter Skeleton */}
        <section className="mb-8 bg-surface border border-outline-variant/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="w-full md:w-80 h-10 bg-surface-variant/60 rounded-xl"></div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-20 md:w-24 bg-surface-variant/60 rounded-xl"></div>
            ))}
          </div>
        </section>

        {/* Featured News Skeleton */}
        <section className="mb-12 animate-pulse">
          <div className="rounded-3xl overflow-hidden shadow-md border border-outline-variant/20 bg-surface-variant h-[350px] md:h-[400px] flex flex-col justify-end p-5 md:p-10 relative">
            <div className="absolute top-6 left-6 flex gap-2">
              <div className="w-16 h-6 bg-white/30 rounded-full"></div>
              <div className="w-24 h-6 bg-white/30 rounded-full"></div>
            </div>
            <div className="max-w-4xl z-10 w-full space-y-4">
              <div className="h-10 md:h-14 w-3/4 bg-white/30 rounded-2xl"></div>
              <div className="h-4 w-full bg-white/20 rounded-md"></div>
              <div className="h-4 w-2/3 bg-white/20 rounded-md"></div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4">
                <div className="w-32 h-10 bg-white/30 rounded-full"></div>
                <div className="w-24 h-5 bg-white/20 rounded-md"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
          
          {/* Main Grid Column */}
          <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">
            <div className="flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
              <div className="w-2.5 h-4 bg-primary/40 rounded-full"></div>
              <div className="w-32 h-6 bg-surface-variant/80 rounded-md"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-surface rounded-3xl p-6 shadow-sm border border-outline-variant/20 h-[360px] flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute inset-0 bg-surface-variant/60"></div>
                  <div className="relative z-10 space-y-3">
                    <div className="w-16 h-5 bg-white/40 rounded-md mb-2"></div>
                    <div className="w-full h-6 bg-white/50 rounded-lg"></div>
                    <div className="w-3/4 h-6 bg-white/50 rounded-lg"></div>
                    <div className="w-full h-3 bg-white/30 rounded-sm mt-4"></div>
                    <div className="w-2/3 h-3 bg-white/30 rounded-sm"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 flex flex-col gap-6 w-full order-1 lg:order-2">
            <div className="flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
              <div className="w-2.5 h-4 bg-secondary/40 rounded-full"></div>
              <div className="w-32 h-6 bg-surface-variant/80 rounded-md"></div>
            </div>
            
            <div className="flex flex-row lg:flex-col overflow-hidden gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-surface rounded-3xl shadow-sm border border-outline-variant/20 h-[200px] w-[260px] lg:w-full shrink-0 flex flex-col justify-end p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-surface-variant/60"></div>
                  <div className="relative z-10 space-y-2">
                    <div className="w-12 h-4 bg-white/40 rounded-sm mb-1"></div>
                    <div className="w-full h-4 bg-white/50 rounded-md"></div>
                    <div className="w-3/4 h-4 bg-white/50 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
          
        </div>
      </main>
    </div>
  );
}
