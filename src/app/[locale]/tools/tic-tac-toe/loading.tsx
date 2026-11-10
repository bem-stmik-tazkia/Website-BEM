import React from "react";

export default function LoadingTicTacToe() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background flex flex-col items-center">
      <div className="w-full max-w-md mx-auto animate-pulse flex flex-col items-center">
        <div className="w-full flex justify-between mb-6">
          <div className="h-8 w-32 bg-surface-container-high rounded-xl"></div>
          <div className="h-8 w-28 bg-surface-container-high rounded-full"></div>
        </div>
        <div className="h-8 w-48 bg-surface-container-high rounded-xl mb-6"></div>
        <div className="h-10 w-full bg-surface-container-high rounded-2xl mb-6"></div>
        <div className="w-full max-w-[340px] aspect-square bg-surface-container-high rounded-3xl mb-6"></div>
        <div className="h-10 w-32 bg-surface-container-high rounded-xl"></div>
      </div>
    </div>
  );
}

