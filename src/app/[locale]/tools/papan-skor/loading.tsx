import React from "react";

export default function LoadingPapanSkor() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-7xl w-full mx-auto animate-pulse">
        {/* Top bar skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="h-9 w-40 bg-slate-900 rounded-xl"></div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-900 rounded-xl"></div>
            <div className="h-9 w-9 bg-slate-900 rounded-xl"></div>
          </div>
        </div>

        {/* Timer skeleton */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-8 w-28 bg-slate-900 rounded-xl mb-3"></div>
          <div className="h-24 w-80 bg-slate-900 rounded-3xl mb-4"></div>
          <div className="h-10 w-44 bg-slate-900 rounded-xl"></div>
        </div>

        {/* 2-Column Stadium Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[360px] bg-slate-900/60 border border-slate-800 rounded-3xl p-8"></div>
          <div className="h-[360px] bg-slate-900/60 border border-slate-800 rounded-3xl p-8"></div>
        </div>
      </div>
    </div>
  );
}

