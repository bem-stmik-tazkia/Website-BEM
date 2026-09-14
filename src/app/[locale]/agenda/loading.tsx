import React from "react";

export default function LoadingAgenda() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-20 font-sans overflow-x-hidden w-full animate-pulse">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">

        {/* Header Skeleton */}
        <header className="mb-6 md:mb-10 text-left">
          <div className="h-10 md:h-12 w-48 md:w-64 bg-surface-variant/80 rounded-2xl mb-2 md:mb-4"></div>
          <div className="h-4 md:h-5 w-full max-w-xl bg-surface-variant/60 rounded-lg"></div>
        </header>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-outline-variant/30 pb-2">
          <div className="h-8 w-24 md:w-32 bg-primary/20 rounded-md border-b-4 border-primary/40"></div>
          <div className="h-8 w-24 md:w-32 bg-surface-variant/50 rounded-md"></div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <div className="flex-1 h-12 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm"></div>
        </div>

        {/* Category Filter Skeleton */}
        <div className="flex items-center gap-2 mb-8 overflow-hidden pb-2">
          {[1, 2, 3, 4, 5, 6].map((cat) => (
            <div key={cat} className="h-9 w-20 md:w-28 bg-surface-variant/50 rounded-full shrink-0"></div>
          ))}
        </div>

        {/* Layout Column */}
        <div className="flex flex-col lg:flex-row gap-8 mt-4 mb-16 items-start">
          
          {/* Left Column: Grid */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 h-80 flex flex-col justify-between overflow-hidden">
                  <div className="w-full h-44 bg-surface-variant/60 rounded-xl shrink-0"></div>
                  <div className="h-6 bg-surface-variant/80 rounded-md w-3/4 mt-4"></div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-surface-variant/50 rounded-md w-[85%]"></div>
                    <div className="h-4 bg-surface-variant/50 rounded-md w-[60%]"></div>
                    <div className="h-4 bg-surface-variant/50 rounded-md w-[75%]"></div>
                  </div>
                  
                  <div className="flex justify-end pt-3 mt-auto">
                    <div className="w-24 h-4 bg-surface-variant/80 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Skeleton */}
            <div className="flex justify-center items-center gap-2 mt-10">
              <div className="w-20 h-10 bg-surface-variant/40 rounded-lg"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 bg-surface-variant/60 rounded-lg"></div>
              ))}
              <div className="w-20 h-10 bg-surface-variant/40 rounded-lg"></div>
            </div>
          </div>

          {/* Right Column: Calendar / Sidebar Skeleton */}
          <div className="w-full lg:w-1/3">
            <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm h-[400px] flex flex-col">
              <div className="w-48 h-6 bg-surface-variant/80 rounded-md mb-6 mx-auto"></div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-8 h-4 bg-surface-variant/50 mx-auto rounded-sm"></div>)}
              </div>
              <div className="grid grid-cols-7 gap-2 flex-grow">
                {Array.from({length: 35}).map((_, i) => <div key={i} className="w-8 h-8 bg-surface-variant/30 mx-auto rounded-full"></div>)}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
