import React from "react";

export default function LoadingVolunteerDetail() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-28 pb-32 md:pb-20 animate-pulse font-sans">
      
      {/* ── HEADER SECTION ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 mb-10">
        <div className="w-40 h-5 bg-surface-variant/80 rounded-md mb-6"></div>

        <div className="bg-surface rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start border border-outline-variant/20 shadow-sm">
          {/* Image */}
          <div className="w-full md:w-1/3 h-64 md:h-auto md:aspect-square rounded-2xl bg-surface-variant/60 shrink-0"></div>

          {/* Header Info */}
          <div className="flex-1 w-full space-y-4 py-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="w-32 h-7 bg-primary/20 rounded-full"></div>
              <div className="w-28 h-7 bg-secondary/20 rounded-full"></div>
            </div>

            <div className="w-3/4 h-10 md:h-12 bg-surface-variant/80 rounded-xl"></div>
            
            <div className="space-y-2 mt-4">
              <div className="w-full h-5 bg-surface-variant/60 rounded-md"></div>
              <div className="w-4/5 h-5 bg-surface-variant/60 rounded-md"></div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-4">
              <div className="w-32 h-5 bg-surface-variant/80 rounded-md"></div>
              <div className="w-40 h-5 bg-surface-variant/80 rounded-md"></div>
              <div className="w-36 h-5 bg-surface-variant/80 rounded-md"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT SECTION ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm space-y-4">
            <div className="w-48 h-6 bg-surface-variant/80 rounded-md mb-4"></div>
            <div className="w-full h-5 bg-surface-variant/60 rounded-md"></div>
            <div className="w-[90%] h-5 bg-surface-variant/60 rounded-md"></div>
            <div className="w-[95%] h-5 bg-surface-variant/60 rounded-md"></div>
            <div className="w-[80%] h-5 bg-surface-variant/60 rounded-md"></div>
          </div>

          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm space-y-4">
            <div className="w-40 h-6 bg-surface-variant/80 rounded-md mb-4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-4 h-4 bg-secondary/30 rounded-full shrink-0"></div>
                <div className="w-full h-5 bg-surface-variant/60 rounded-md"></div>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm space-y-4">
            <div className="w-36 h-6 bg-surface-variant/80 rounded-md mb-4"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-4 h-4 bg-tertiary/30 rounded-full shrink-0"></div>
                <div className="w-[90%] h-5 bg-surface-variant/60 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm space-y-6">
            <div className="w-32 h-6 bg-surface-variant/80 rounded-md mb-2"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full shrink-0"></div>
                <div className="space-y-2 w-full pt-1">
                  <div className="w-32 h-4 bg-surface-variant/80 rounded-md"></div>
                  <div className="w-full h-3 bg-surface-variant/60 rounded-md"></div>
                  <div className="w-2/3 h-3 bg-surface-variant/60 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface-variant/40 rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm h-64"></div>
        </div>
      </section>

      {/* ── REGISTRATION FORM ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-5 md:px-10">
        <div className="bg-surface rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-10 border border-outline-variant/20 shadow-xl space-y-6">
          <div className="flex flex-col items-center space-y-2 mb-8">
            <div className="w-48 h-8 bg-surface-variant/80 rounded-md"></div>
            <div className="w-64 h-4 bg-surface-variant/60 rounded-md"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-surface-variant/80 rounded-md"></div>
              <div className="w-full h-12 bg-surface-variant/40 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-surface-variant/80 rounded-md"></div>
              <div className="w-full h-12 bg-surface-variant/40 rounded-xl"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-32 h-4 bg-surface-variant/80 rounded-md"></div>
            <div className="w-full h-12 bg-surface-variant/40 rounded-xl"></div>
          </div>

          <div className="space-y-2">
            <div className="w-28 h-4 bg-surface-variant/80 rounded-md"></div>
            <div className="w-full h-32 bg-surface-variant/40 rounded-xl"></div>
          </div>

          <div className="w-full h-14 bg-surface-variant/80 rounded-xl mt-4"></div>
        </div>
      </section>
    </div>
  );
}
