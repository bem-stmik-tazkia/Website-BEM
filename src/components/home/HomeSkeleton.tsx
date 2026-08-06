/**
 * Skeleton loaders for home page sections
 * Used as Suspense fallbacks to show placeholder UI while data is being fetched
 */

/** Skeleton for KaryaProjek section */
export function KaryaSkeleton() {
  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-8 animate-pulse">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-24 bg-surface-variant/60 rounded-full" />
            <div className="h-9 w-48 bg-surface-variant/60 rounded-xl" />
            <div className="h-4 w-36 bg-surface-variant/40 rounded-md" />
          </div>
          <div className="h-4 w-20 bg-surface-variant/40 rounded-md" />
        </div>
        {/* Cards skeleton */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl aspect-[4/3] bg-surface-variant/50"
            />
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="lg:hidden animate-pulse rounded-3xl aspect-[4/3] bg-surface-variant/50 w-full max-w-2xl mx-auto" />
      </div>
    </section>
  );
}

/** Skeleton for BeritaSorotan section */
export function BeritaSkeleton() {
  return (
    <section className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto py-12 md:py-20 bg-background overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-52 bg-surface-variant/60 rounded-xl" />
          <div className="h-4 w-80 bg-surface-variant/40 rounded-md" />
        </div>
        <div className="h-4 w-32 bg-surface-variant/40 rounded-md" />
      </div>
      <div className="animate-pulse w-full min-h-[420px] rounded-2xl md:rounded-3xl bg-surface-variant/50" />
    </section>
  );
}

/** Skeleton for EventVolunteer section */
export function EventVolunteerSkeleton() {
  return (
    <div className="bg-surface py-10 md:py-16">
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-10 md:mb-16">
        {/* Live event skeleton */}
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div className="h-6 w-48 bg-surface-variant/60 rounded-full" />
          <div className="h-6 w-20 bg-red-200/50 rounded-full" />
        </div>
        <div className="animate-pulse w-full h-[280px] sm:h-[300px] md:h-[350px] rounded-2xl md:rounded-3xl bg-surface-variant/50 mb-10 md:mb-16" />
      </div>
      {/* 3-column grid skeleton */}
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="h-6 w-40 bg-surface-variant/60 rounded-full" />
              <div className="aspect-[4/3] rounded-3xl bg-surface-variant/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
