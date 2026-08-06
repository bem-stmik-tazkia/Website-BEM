export default function DashboardLoading() {
  return (
    <div className="w-full animate-pulse pb-12">
      {/* Banner Skeleton */}
      <div className="w-full h-40 sm:h-52 bg-surface-variant/40" />

      <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        {/* Left Sidebar Skeleton */}
        <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
          {/* Avatar Skeleton */}
          <div className="-mt-16 sm:-mt-24 mb-5 relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-surface bg-surface-variant/60" />
          </div>

          {/* Info Text Skeleton */}
          <div className="mb-6 space-y-3">
            <div className="h-4 w-24 bg-surface-variant/50 rounded-md mb-2" />
            <div className="h-8 w-4/5 bg-surface-variant/60 rounded-xl" />
            <div className="h-5 w-3/5 bg-surface-variant/50 rounded-lg" />
            <div className="h-4 w-1/2 bg-surface-variant/40 rounded-lg mt-3" />
          </div>

          {/* Buttons Skeleton */}
          <div className="mb-8 flex flex-col gap-3">
            <div className="h-12 w-full bg-surface-variant/50 rounded-xl" />
            <div className="h-12 w-full bg-surface-variant/40 rounded-xl" />
          </div>

          {/* Links Skeleton */}
          <div className="mb-8 space-y-3">
            <div className="h-3 w-16 bg-surface-variant/50 rounded mb-4" />
            <div className="h-10 w-full bg-surface-variant/40 rounded-xl" />
            <div className="h-10 w-full bg-surface-variant/40 rounded-xl" />
          </div>

          {/* Bio Skeleton */}
          <div className="mb-8 space-y-2">
            <div className="h-3 w-20 bg-surface-variant/50 rounded mb-3" />
            <div className="h-4 w-full bg-surface-variant/40 rounded" />
            <div className="h-4 w-5/6 bg-surface-variant/40 rounded" />
            <div className="h-4 w-4/6 bg-surface-variant/40 rounded" />
          </div>
        </aside>

        {/* Right Content (Projects) Skeleton */}
        <main className="flex-1 lg:pt-5">
          {/* Header Skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-surface-variant/50" />
            <div className="h-6 w-48 bg-surface-variant/60 rounded-lg" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-[320px] bg-surface-variant/30 rounded-3xl border border-outline-variant/20 overflow-hidden flex flex-col">
                <div className="h-48 w-full bg-surface-variant/50" />
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-surface-variant/40 rounded-full" />
                    <div className="h-5 w-20 bg-surface-variant/40 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-surface-variant/60 rounded-lg mt-2" />
                  <div className="h-4 w-1/2 bg-surface-variant/40 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </main>
        
      </div>
    </div>
  );
}
