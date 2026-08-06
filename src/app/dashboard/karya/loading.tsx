export default function KaryaLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="h-8 w-64 bg-surface-variant/60 rounded-xl mb-3" />
          <div className="h-4 w-80 bg-surface-variant/40 rounded-lg" />
        </div>
        <div className="h-12 w-48 bg-surface-variant/50 rounded-xl" />
      </div>

      {/* Main Card Panel Skeleton */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-outline-variant/30 mt-8 relative">
        <div className="h-6 w-32 bg-surface-variant/60 rounded-lg mb-8" />
        
        {/* Filters Skeleton */}
        <div className="flex gap-4 mb-8">
          <div className="h-10 w-24 bg-surface-variant/50 rounded-full" />
          <div className="h-10 w-24 bg-surface-variant/30 rounded-full" />
          <div className="h-10 w-24 bg-surface-variant/30 rounded-full" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full bg-surface-variant/20 rounded-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
              <div className="h-40 w-full bg-surface-variant/50" />
              <div className="p-5 flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-surface-variant/40 rounded-full" />
                  <div className="h-4 w-16 bg-surface-variant/40 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-surface-variant/60 rounded-lg mt-2" />
                <div className="h-3 w-1/2 bg-surface-variant/40 rounded-lg" />
                
                <div className="pt-4 flex gap-4 mt-auto">
                  <div className="h-4 w-16 bg-surface-variant/30 rounded" />
                  <div className="h-4 w-16 bg-surface-variant/30 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
