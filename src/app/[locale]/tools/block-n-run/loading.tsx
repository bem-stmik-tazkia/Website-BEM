import React from "react";

export default function LoadingBlockNRun() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-lg mx-auto animate-pulse flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="h-9 w-36 bg-surface-container-high rounded-xl"></div>
          <div className="h-8 w-28 bg-surface-container-high rounded-full"></div>
        </div>
        <div className="h-10 w-64 bg-surface-container-high rounded-xl mb-4"></div>
        <div className="h-8 w-48 bg-surface-container-high rounded-full mb-8"></div>
        <div className="w-full max-w-[400px] aspect-square bg-surface-container-high rounded-2xl border border-outline-variant/30 mb-8 shadow-sm"></div>
        <div className="w-full flex justify-between gap-4">
          <div className="h-14 w-40 bg-surface-container-high rounded-2xl"></div>
          <div className="h-14 w-40 bg-surface-container-high rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
