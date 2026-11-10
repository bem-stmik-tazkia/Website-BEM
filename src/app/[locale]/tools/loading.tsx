import React from "react";

export default function LoadingTools() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="h-5 w-40 bg-surface-container-high rounded-full mx-auto mb-3"></div>
          <div className="h-8 w-60 bg-surface-container-high rounded-xl mx-auto mb-2"></div>
          <div className="h-4 w-80 max-w-full bg-surface-container-high rounded-lg mx-auto"></div>
        </div>

        {/* Tab Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-10 w-72 bg-surface-container-high rounded-2xl"></div>
        </div>

        {/* 3-Col Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-outline-variant/30 rounded-3xl p-5 min-h-[360px] flex flex-col justify-between"
            >
              <div>
                <div className="w-full h-36 bg-surface-container-low rounded-2xl mb-4"></div>
                <div className="flex justify-between items-center mb-2">
                  <div className="w-20 h-3 rounded bg-surface-container-high"></div>
                  <div className="w-14 h-4 rounded-full bg-surface-container-high"></div>
                </div>
                <div className="w-40 h-5 rounded-lg bg-surface-container-high mb-2"></div>
                <div className="w-full h-3.5 rounded bg-surface-container-high mb-1.5"></div>
                <div className="w-3/4 h-3.5 rounded bg-surface-container-high mb-4"></div>
                <div className="flex gap-1.5">
                  <div className="w-16 h-4 rounded bg-surface-container-high"></div>
                  <div className="w-16 h-4 rounded bg-surface-container-high"></div>
                </div>
              </div>
              <div className="pt-3 border-t border-outline-variant/20">
                <div className="w-full h-9 rounded-xl bg-surface-container-high"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="h-16 w-full bg-surface-container-low rounded-2xl"></div>
      </div>
    </div>
  );
}
