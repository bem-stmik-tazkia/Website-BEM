import React from "react";

export default function LoadingBeritaDetail() {
  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-36 pb-20 animate-pulse">
      
      {/* ── BACK BUTTON & HEADER INFO ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <div className="w-32 h-5 bg-surface-variant/80 rounded-md mb-8"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-20 h-6 bg-primary/20 rounded-full"></div>
            <div className="w-32 h-5 bg-surface-variant/60 rounded-md"></div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 md:mt-0">
            <div className="w-20 h-10 bg-surface border border-outline-variant/30 rounded-full"></div>
            <div className="w-24 h-10 bg-surface border border-outline-variant/30 rounded-full"></div>
            <div className="w-28 h-10 bg-surface border border-outline-variant/30 rounded-full"></div>
          </div>
        </div>

        {/* Title */}
        <div className="w-full max-w-4xl space-y-4 mb-6">
          <div className="w-full h-10 md:h-12 bg-surface-variant/80 rounded-xl"></div>
          <div className="w-3/4 h-10 md:h-12 bg-surface-variant/80 rounded-xl"></div>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-3 w-48 h-14 bg-surface rounded-full border border-outline-variant/30 mt-2 mb-10 p-2 pr-6">
          <div className="w-11 h-11 rounded-full bg-surface-variant/80 shrink-0"></div>
          <div className="flex flex-col space-y-2 flex-grow">
            <div className="w-12 h-2 bg-primary/30 rounded-sm"></div>
            <div className="w-20 h-4 bg-surface-variant/80 rounded-md"></div>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-12">
        <div className="w-full aspect-[21/9] md:aspect-[21/8] bg-surface-variant/60 rounded-3xl overflow-hidden border border-outline-variant/20"></div>
      </section>

      {/* ── MAIN CONTENT & SIDEBAR ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Article Body */}
        <article className="lg:col-span-8 bg-surface rounded-3xl p-8 md:p-12 border border-outline-variant/20 shadow-sm space-y-6">
          <div className="w-full h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[95%] h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[90%] h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-full h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[85%] h-6 bg-surface-variant/60 rounded-md mb-8"></div>

          <div className="w-[80%] h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-full h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[92%] h-6 bg-surface-variant/60 rounded-md"></div>
          
          <div className="my-8 w-full aspect-video bg-surface-variant/40 rounded-xl"></div>
          
          <div className="w-full h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[85%] h-6 bg-surface-variant/60 rounded-md"></div>
          <div className="w-[90%] h-6 bg-surface-variant/60 rounded-md"></div>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-outline-variant/20">
            <div className="w-32 h-5 bg-surface-variant/80 rounded-md mb-4"></div>
            <div className="flex flex-wrap gap-2">
              <div className="w-20 h-8 bg-surface-variant/40 rounded-xl"></div>
              <div className="w-24 h-8 bg-surface-variant/40 rounded-xl"></div>
              <div className="w-16 h-8 bg-surface-variant/40 rounded-xl"></div>
              <div className="w-28 h-8 bg-surface-variant/40 rounded-xl"></div>
            </div>
          </div>
          
          {/* Share Block */}
          <div className="mt-12 w-full h-28 bg-surface-variant/40 rounded-2xl border border-outline-variant/30"></div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Related News Widget */}
          <div className="bg-surface rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-6 bg-secondary/40 rounded-full"></div>
              <div className="w-36 h-6 bg-surface-variant/80 rounded-md"></div>
            </div>

            <div className="flex flex-col gap-5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl bg-surface-variant/60 shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="w-16 h-3 bg-secondary/20 rounded-sm"></div>
                    <div className="w-full h-4 bg-surface-variant/80 rounded-md"></div>
                    <div className="w-3/4 h-4 bg-surface-variant/80 rounded-md"></div>
                    <div className="w-20 h-3 bg-surface-variant/60 rounded-sm mt-2"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 w-full h-12 rounded-xl border border-primary/20 bg-surface-variant/20"></div>
          </div>
        </aside>

      </section>

    </div>
  );
}
