import React from 'react';

export default function LoadingAcakNama() {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden flex flex-col items-center">
      <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-12 md:h-16 w-64 bg-surface-container-high mx-auto rounded-xl mb-4"></div>
          <div className="h-6 w-full max-w-2xl bg-surface-container-high mx-auto rounded-lg"></div>
        </div>

        <div className="bg-surface rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-outline-variant/30 w-full min-h-[500px]">
          {/* Left Panel Skeleton */}
          <div className="w-full md:w-1/3 bg-surface-container-low p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-outline-variant/30 animate-pulse">
            <div className="flex bg-surface-container p-1.5 rounded-xl h-14">
              <div className="flex-1 bg-surface-container-highest rounded-lg mx-1"></div>
              <div className="flex-1 bg-surface-container rounded-lg mx-1"></div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="flex-1 w-full p-4 rounded-xl border border-outline-variant/50 bg-surface shadow-inner"></div>
              <div className="h-4 w-32 bg-surface-container-highest mt-4 rounded"></div>
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="w-full md:w-2/3 p-6 md:p-12 flex flex-col items-center justify-center relative bg-surface animate-pulse">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-surface-container-highest"></div>
            <div className="w-40 h-12 bg-surface-container-highest rounded-full mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
