import React from "react";

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-surface-variant/40 rounded-xl" />
          <div className="h-4 w-96 bg-surface-variant/30 rounded-lg" />
        </div>
        <div className="h-10 w-72 bg-surface-variant/40 rounded-2xl" />
      </div>

      {/* KPI Cards Skeleton (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-surface-variant/40" />
              <div className="w-16 h-5 rounded-full bg-surface-variant/30" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 bg-surface-variant/30 rounded" />
              <div className="h-8 w-16 bg-surface-variant/50 rounded-lg" />
            </div>
            <div className="h-3 w-32 bg-surface-variant/20 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-surface-variant/40 rounded-lg" />
            <div className="h-3 w-64 bg-surface-variant/30 rounded" />
          </div>
          <div className="h-8 w-32 bg-surface-variant/30 rounded-xl" />
        </div>
        <div className="h-72 w-full bg-surface-variant/20 rounded-xl" />
      </div>

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 h-64 space-y-4">
          <div className="h-6 w-44 bg-surface-variant/40 rounded-lg" />
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-surface-variant/20 rounded-xl" />
            <div className="h-10 bg-surface-variant/20 rounded-xl" />
            <div className="h-10 bg-surface-variant/20 rounded-xl" />
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 h-64 space-y-4">
          <div className="h-6 w-44 bg-surface-variant/40 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-20 bg-surface-variant/20 rounded-xl" />
            <div className="h-20 bg-surface-variant/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
