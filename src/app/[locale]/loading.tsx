import React from "react";

export default function Loading() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background pt-24 pb-32 overflow-hidden w-full font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <main className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full pt-8">
        
        {/* Hero Section Skeleton */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24 animate-pulse">
          {/* Left: Text */}
          <div className="w-full lg:w-1/2 space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="h-6 w-32 bg-surface-variant/80 rounded-full mb-2"></div>
            <div className="h-14 w-full md:w-[90%] bg-surface-variant/80 rounded-2xl"></div>
            <div className="h-14 w-3/4 md:w-[70%] bg-surface-variant/80 rounded-2xl"></div>
            <div className="h-4 w-full md:w-[85%] bg-surface-variant/60 rounded-md mt-6"></div>
            <div className="h-4 w-2/3 md:w-[65%] bg-surface-variant/60 rounded-md"></div>
            
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <div className="h-12 w-36 bg-primary/20 rounded-full"></div>
              <div className="h-12 w-36 bg-surface-variant/80 rounded-full"></div>
            </div>
          </div>
          
          {/* Right: Image Carousel Skeleton */}
          <div className="w-full lg:w-1/2 mt-10 lg:mt-0 relative">
            <div className="w-full aspect-[4/3] bg-surface-variant/80 rounded-3xl"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Stats Section Skeleton */}
        <div className="w-full bg-surface border border-outline-variant/30 rounded-3xl p-8 mb-24 shadow-sm animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-outline-variant/20">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl mb-4"></div>
                <div className="h-8 w-16 bg-surface-variant/80 rounded-lg mb-2"></div>
                <div className="h-4 w-24 bg-surface-variant/60 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* News & Events Header Skeleton */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-pulse">
          <div>
            <div className="h-4 w-24 bg-secondary/20 rounded-full mb-3"></div>
            <div className="h-10 w-64 bg-surface-variant/80 rounded-xl"></div>
          </div>
          <div className="h-10 w-32 bg-surface-variant/60 rounded-full"></div>
        </div>
        
        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-3xl p-6 shadow-sm border border-outline-variant/20 h-80 flex flex-col justify-between">
              <div className="w-full h-40 bg-surface-variant/60 rounded-xl"></div>
              <div className="h-5 bg-surface-variant/70 rounded-md w-3/4 mt-4"></div>
              <div className="h-4 bg-surface-variant/40 rounded-md w-1/2 mt-2"></div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
